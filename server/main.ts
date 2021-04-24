import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import { connect, connection } from "mongoose";
import UserModel, { generateHashedPassword, TokenUser } from "./models/User";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import config from "./config";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

const { AccessToken } = twilio.jwt;
const VoiceGrant = AccessToken.VoiceGrant;
const client = twilio(config.accountSid, config.authToken);

import {
  DUPLICATE_EMAIL,
  INCOMPLETE_DATA,
  INTERNAL_SERVER_ERROR,
  TOKEN_ERROR,
  UNAUTHORIZED,
  USER_NOT_FOUND,
} from "./errors";
import CallRecorModel from "./models/CallRecord";
interface AuthenticatedRequest extends Request {
  user: TokenUser;
}

const SECRET_TOKEN = "randomstring_KLNL kn lk091830 knl";

//Set up default mongoose connection
const mongoDB = "mongodb://127.0.0.1/twillio";
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

app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const TOKEN_VALIDATITY = 24 * 60 * 60;

const generateAccessToken = (userDetails: TokenUser) => {
  userDetails["validTime"] = TOKEN_VALIDATITY * 1000;
  return jwt.sign(userDetails, SECRET_TOKEN, {
    expiresIn: `${TOKEN_VALIDATITY}s`, // Expires in 24hr
  });
};

const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(401).json(UNAUTHORIZED);
  jwt.verify(token, SECRET_TOKEN, (err, user: TokenUser) => {
    if (err) {
      console.error(err);
      res.status(401).json(TOKEN_ERROR);
    }
    req.user = user;
    next();
  });
};

app.post("/api/signup", async (req, res) => {
  const payload = req.body;
  // Handle the error here
  if (!payload.firstName || !payload.email || !payload.password) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const hashedPassword = await generateHashedPassword(payload.password);

    const createdUser = await UserModel.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      roles: ["ROLE_USER"],
    });
    // 201 Created
    createdUser.password = undefined;
    return res.status(201).json(createdUser);
  } catch (error) {
    console.error(error);
    if (
      error.code === 11000 ||
      error.message.includes("duplicate key error collection")
    ) {
      return res.status(400).json(DUPLICATE_EMAIL);
    } else {
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    }
  }
});

app.post("/api/login", async (req, res) => {
  const payload = req.body;
  if (!payload.email || !payload.password) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  try {
    const user = await UserModel.findOne({ email: payload.email }).exec();
    if (user === null) {
      return res.status(404).json(USER_NOT_FOUND);
    }
    user.password = undefined;
    const userDetails = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      issuedAt: new Date().getTime(),
      id: user._id,
    };
    const token = generateAccessToken(userDetails);
    return res.status(200).json({
      token,
      ...userDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(INTERNAL_SERVER_ERROR);
  }
});

app.get(
  "/api/twillio/token",
  authenticateToken,
  (req: AuthenticatedRequest, res) => {
    try {
      const accessToken = new AccessToken(
        config.accountSid,
        config.keySid,
        config.secret
      );
      accessToken.identity = req.user.firstName;
      const grant = new VoiceGrant({
        outgoingApplicationSid: config.outgoingApplicationSid,
        incomingAllow: true,
      });
      accessToken.addGrant(grant);
      return res.status(201).json({ token: accessToken.toJwt() });
    } catch (error) {
      console.error(error);
      res.status(500).json(INTERNAL_SERVER_ERROR);
    }
  }
);

app.post(
  "/api/twillio/connect",
  twilio.webhook({ validate: false }),
  (req, res) => {
    const phoneNumber = req.body.to;
    const callerId = req.body.from;
    const twiml = new VoiceResponse();

    const dial = twiml.dial({ callerId });
    dial.number({}, phoneNumber);
    res.send(twiml.toString());
  }
);

/**
 * How to start a phone call?
 * First Get the token -> Token is valid for a 1hr only, Refresh the token in 30 -45 mins
 * If you want to dial a number -> Hit the start outgoing endpoint -> Recive the CallRecord ID ->
 * Hit the connect API with the from, to, and the CallRecord ID, when call is connected the startTime, endTime
 * and duration are calculated and updated on disconnecting the call.
 */

app.post(
  "/api/twillio/outgoing/start",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const payload = req.body;
    if (!payload.from || !payload.to) {
      return res.status(400).json(INCOMPLETE_DATA);
    }
    try {
      const callRecordDetails = {
        from: payload.from,
        to: payload.to,
        user: req.user.id,
        type: "INCOMING",
      };
      // Start a Call Record and Return the ID;
      const callRecord = await CallRecorModel.create(callRecordDetails);
      return res.status(201).json({
        callRecordID: callRecord._id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(INTERNAL_SERVER_ERROR);
    }
  }
);

app.get("/", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.send("Protected");
});

app.listen(8080, () => {
  console.log("Server running on 8080");
});
