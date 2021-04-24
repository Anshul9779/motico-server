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
  loginAPI,
  signupAPI,
} from "./routes/auth";
import {
  twillioCallStart,
  twillioConnect,
  twillioToken,
} from "./routes/twillio";

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

/**
 *  AUTH BASED APIS
 *
 * This section contains apis for account management like Login Signup etc
 */

app.post("/api/signup", signupAPI);

app.post("/api/login", loginAPI);

/**
 *  TWILLIO BASED APIS
 *
 * This section contains apis for Twillio like calling APIs
 *
 */

app.get("/api/twillio/token", authenticateToken, twillioToken);

app.post(
  "/api/twillio/connect",
  twilio.webhook({ validate: false }),
  twillioConnect
);

app.post("/api/twillio/outgoing/start", authenticateToken, twillioCallStart);

app.get("/", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.send("Protected");
});

app.listen(8080, () => {
  console.log("Server running on 8080");
});
