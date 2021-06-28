import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import { connect, connection } from "mongoose";
import twilio from "twilio";
import {
  AuthenticatedRequest,
  authenticateToken,
  isAdmin,
  loginAPI,
  signupAPI,
  userInvite,
} from "./routes/auth";
import path from "path";
import {
  buyNumber,
  getAvailablePhoneNumbers,
  getPendingIncomingCalls,
  handleIncomingCall,
  ivrMenu,
  ivrWelcome,
  twillioCallStart,
  twillioConfTwiML,
  twillioConnect,
  twillioToken,
} from "./routes/twillio";
import UserModel from "./models/User";
import { ROLES } from "./constants";
import {
  assignPhoneNumber,
  createCompnay,
  createTeam,
  getTeams,
  getUserDetails,
  getUsersByCompany,
  onlineUsers,
  userAddCompany,
  userAddRoles,
} from "./routes/users";
import CallRecordModel, { CallRecordPopulated } from "./models/CallRecord";
import {
  callRecordTime,
  getCallRecordCSID,
  totalCalls,
} from "./routes/callrecord";
import { getRegisteredPhoneNumbers, addNumber } from "./routes/phonenumber";

//Set up default mongoose connection
const mongoDB = "mongodb://127.0.0.1:27017/twillio";
connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = connection;
db.on("error", console.error.bind(console, "MongoDB Connection Error"));

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

/**
 * Socket based Logic
 *
 * How socket works =>
 *
 * 1. User logins => User gets ONLINE => Set in db => Admin must be notified
 * 2. User Call Starts => Set Calling in DB => Admin must be notified
 * 3. User Call Ends => Set Calling in DB => Admin must be notified
 *
 * All this happens for particular "company". Each "company" has different "socket rooms"
 */

const SOCKET = {
  START_CONNECTION: "START_CONNECTION",
  USER_ONLINE: "USER_ONLINE",
  USER_LOGOUT: "USER_LOGOUT",
  USER_CALL_START: "USER_CALL_START",
  USER_CALL_END: "USER_CALL_END",
  CALL_ADD: "CALL_ADD",
  CALL_END: "CALL_END",
  CALL_ADD_CSID: "CALL_ADD_CSID",
} as const;

io.on("connection", (socket) => {
  // welp security can come later, first lets make pow
  // TODO: Add extra params
  console.log("Socket Connected");
  let userEmail = "";
  let userCompany = "";
  socket.on(SOCKET.START_CONNECTION, async ({ email }: { email: string }) => {
    console.log(email);
    const user = await UserModel.findOneAndUpdate(
      { email },
      { isOnline: true }
    );
    if (!user) {
      socket.disconnect();
    }
    userEmail = email;
    userCompany = user.company.toString();
    io.to(userCompany).emit(SOCKET.USER_ONLINE, {
      id: user._id,
      name: user.firstName + " " + (user.lastName ?? ""),
      // TODO: Add avatar url
      avatarURL: "",
    });

    // Depending on if user is admin
    if (user.roles.includes(ROLES.ADMIN)) {
      // If user is admin -> join to the company room
      socket.join(userCompany);
    }
  });

  socket.on("disconnect", async () => {
    // Set user as offline
    if (userEmail) {
      console.log(userEmail, "Disconnected");
      const user = await UserModel.findOneAndUpdate(
        { email: userEmail },
        { isOnline: false }
      );
      if (userCompany) {
        io.to(userCompany).emit(SOCKET.USER_LOGOUT, {
          id: user._id,
        });
      }
    }
  });

  socket.on(SOCKET.USER_CALL_START, async (data: { callID: string }) => {
    // Send all the call details to user
    const record = (await CallRecordModel.findOne({ _id: data.callID })
      .populate("user")
      .exec()) as CallRecordPopulated;
    const details = {
      from: record.from,
      to: record.to,
      id: record._id,
      agent: record.user.firstName,
      startTime: record.startTime,
      status: record.type,
    };

    io.to(userCompany).emit(SOCKET.CALL_ADD, details);
    console.log(userEmail, "Call Started");
  });

  socket.on(SOCKET.USER_CALL_END, async (data: { callID: string }) => {
    console.log(data);
    const { callID } = data;
    const record = await CallRecordModel.findOne({ _id: data.callID }).exec();
    const startTime = record.startTime;
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    console.log(userEmail, "Call Ended");

    await CallRecordModel.findOneAndUpdate(
      { _id: callID },
      { endTime, duration, isActive: false }
    ).exec();
    io.to(userCompany).emit(SOCKET.CALL_END, {
      id: data.callID,
    });
  });

  socket.on(
    SOCKET.CALL_ADD_CSID,
    async (data: { callId: string; csid: string }) => {
      await CallRecordModel.findOneAndUpdate(
        {
          _id: data.callId,
        },
        {
          callSid: data.csid,
        }
      ).exec();
    }
  );
});

app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/static", express.static(path.join(__dirname, "build", "static")));
/**
 *  AUTH BASED APIS
 *
 * This section contains apis for account management like Login Signup etc
 */

app.post("/api/signup", signupAPI);

app.post("/api/login", loginAPI);

/**
 * USER CREATION ROUTES
 *
 */

app.post("/api/user/invite", isAdmin, userInvite);

/**
 * ADMIN ROUTES
 *
 * Contains all the requests only admin can make
 */

app.post("/api/admin/user/invite", isAdmin, userInvite);
app.get("/api/admin/user/online", isAdmin, onlineUsers);
app.post("/api/admin/user/company", isAdmin, userAddCompany);
app.post("/api/admin/user/roles", isAdmin, userAddRoles);
app.post("/api/admin/user/get-company", isAdmin, getUsersByCompany);
app.post("/api/admin/user", isAdmin, getUserDetails);
app.post("/api/admin/company/new", isAdmin, createCompnay);

/**
 *  TWILLIO BASED APIS
 *
 * This section contains apis for Twillio like calling APIs
 *
 */

app.get("/api/twillio/token", authenticateToken, twillioToken);

app.get("/api/status", (req, res) => {
  res.status(200).json({
    message: "Hi, from server",
  });
});

// Expects a Query Param as callId
app.post(
  "/api/twillio/call/:sid/add-participant/:callerId/:phone",
  twillioConfTwiML
);

app.post(
  "/api/twillio/connect",
  twilio.webhook({ validate: false }),
  twillioConnect
);

app.post("/api/twillio/outgoing/start", authenticateToken, twillioCallStart);

app.post(
  "/api/twillio/phonenumber/search",
  authenticateToken,
  getAvailablePhoneNumbers
);

app.post("/api/twillio/phonenumber/buy", isAdmin, buyNumber);
app.post("/api/twillio/ivr/welcome", ivrWelcome);
app.post("/api/twillio/ivr/menu", ivrMenu);

app.post("/api/twillio/incoming", handleIncomingCall);
app.post("/api/twillio/incoming/pending", getPendingIncomingCalls);

/**
 * Meta utility apis
 */

app.get("/api/call/analytics", authenticateToken, totalCalls);
app.post("/api/call/time", authenticateToken, callRecordTime);
app.post("/api/call/getcsid", authenticateToken, getCallRecordCSID);

/**
 * Phone number utility
 */

app.get("/api/phonenumber/registered", isAdmin, getRegisteredPhoneNumbers);
app.post("/api/phonenumber/new", isAdmin, addNumber);
app.post("/api/phonenumber/assign", isAdmin, assignPhoneNumber);

/**
 *
 * Team Utility
 *
 */

app.post("/api/teams/new", isAdmin, createTeam);
app.post("/api/teams", isAdmin, getTeams);

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

server.listen(8080, () => {
  console.log("Server running on 8080");
});
