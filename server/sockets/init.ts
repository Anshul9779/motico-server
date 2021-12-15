import { TokenUser } from "../models/User";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import SOCKET from "./channels";
import { onSocketConnect, onSocketDisconnect } from "./connection";

type IO = null | Server<DefaultEventsMap, DefaultEventsMap>;
let io: IO;

export function init(ioServer: IO) {
  io = ioServer;
  io.on("connection", (socket) => {
    // welp security can come later, first lets make pow
    // TODO: Add extra params
    console.log("Socket Connected");
    let userEmail = "";
    let userCompany = "";
    let tokenUser: null | TokenUser = null;

    const disconnectUser = () => {
      onSocketDisconnect(tokenUser, socket);
    };

    socket.on(SOCKET.START_CONNECTION, async ({ jwt }: { jwt: string }) => {
      onSocketConnect(jwt, socket)
        .then((newTokenUser) => (tokenUser = newTokenUser))
        .catch((err) => {
          console.log("[SOCKET ERR] ", err);
          disconnectUser();
        });
    });

    socket.on("disconnect", disconnectUser);

    // socket.on(SOCKET.USER_CALL_START, async (data: { callID: string }) => {
    //   // Send all the call details to user
    //   const record = (await CallRecordModel.findOne({ _id: data.callID })
    //     .populate("user")
    //     .exec()) as CallRecordPopulated;
    //   const details = {
    //     from: record.from,
    //     to: record.to,
    //     id: record._id,
    //     agent: record.user.firstName,
    //     startTime: record.startTime,
    //     status: record.type,
    //   };

    //   io.to(userCompany).emit(SOCKET.CALL_ADD, details);
    //   console.log(userEmail, "Call Started");
    // });

    // socket.on(SOCKET.USER_CALL_END, async (data: { callID: string }) => {
    //   console.log(data);
    //   const { callID } = data;
    //   const record = await CallRecordModel.findOne({ _id: data.callID }).exec();
    //   const startTime = record.startTime;
    //   const endTime = new Date().getTime();
    //   const duration = endTime - startTime;
    //   console.log(userEmail, "Call Ended");

    //   await CallRecordModel.findOneAndUpdate(
    //     { _id: callID },
    //     { endTime, duration, isActive: false }
    //   ).exec();
    //   io.to(userCompany).emit(SOCKET.CALL_END, {
    //     id: data.callID,
    //   });
    // });

    // socket.on(
    //   SOCKET.CALL_ADD_CSID,
    //   async (data: { callId: string; csid: string }) => {
    //     await CallRecordModel.findOneAndUpdate(
    //       {
    //         _id: data.callId,
    //       },
    //       {
    //         callSid: data.csid,
    //       }
    //     ).exec();
    //   }
    // );
  });
}

export function getIO(): IO {
  return io;
}
