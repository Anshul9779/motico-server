import "./env";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import { connect, connection } from "mongoose";
import migration from "./migrations";
import awsRouter from "./routers/aws";
import phonenumberRouter from "./routers/phonenumber";
import teamsRouter from "./routers/teams";
import callRouter from "./routers/call";
import twillioRouter from "./routers/twillio";
import {
  authenticateToken,
  isAdmin,
  loginAPI,
  signupAPI,
  userInvite,
  userPasswordReset,
} from "./routes/auth";
import path from "path";
import {
  createCompnay,
  deleteUser,
  getMe,
  getUserDetails,
  getUsersByCompany,
  onlineUsers,
  setMe,
  userAddCompany,
  userAddRoles,
} from "./routes/users";
import migrations from "./migrations";
import { init } from "./sockets";

//Set up default mongoose connection
const mongoDB = "mongodb://127.0.0.1:27017/twillio";
connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const db = connection;
db.on("error", console.error.bind(console, "MongoDB Connection Error"));

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

init(io);

migration();

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

app.post("/api/reset-password", userPasswordReset);
/**
 * USER CREATION ROUTES
 *
 */

app.post("/api/user/invite", isAdmin, userInvite);

app.get("/api/user/me", authenticateToken, getMe);
app.post("/api/user/me", authenticateToken, setMe);

/**
 * ADMIN ROUTES
 *
 * Contains all the requests only admin can make
 */

app.post("/api/admin/user/invite", isAdmin, userInvite);
app.get("/api/admin/user/online", isAdmin, onlineUsers);
app.post("/api/admin/user/delete", isAdmin, deleteUser);
app.post("/api/admin/user/company", isAdmin, userAddCompany);
app.post("/api/admin/user/roles", isAdmin, userAddRoles);
app.post("/api/admin/user/get-company", isAdmin, getUsersByCompany);
app.post("/api/admin/user", getUserDetails);
app.post("/api/admin/company/new", isAdmin, createCompnay);

/**
 *  TWILLIO BASED APIS
 *
 * This section contains apis for Twillio like calling APIs
 *
 */

app.get("/api/status", (req, res) => {
  res.status(200).json({
    message: "Hi, from server",
  });
});

// TODO Change this to /calls/pending
// router.post("/incoming/pending", getPendingIncomingCalls);

/**
 * Meta utility apis
 */
// https://stackoverflow.com/a/67560007/8077711 use this pls
app.use("/api/call", callRouter);
app.use("/api/aws", awsRouter);
app.use("/api/phonenumber", phonenumberRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/twillio", twillioRouter);

app.get("/api/migrations", (req, res) => {
  migrations()
    .then(() => {
      res.send("DONE");
    })
    .catch((err) => {
      res.send("ERROR");
    });
});

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

server.listen(8080, () => {
  console.log("Server running on 8080");
});
