import { ROLES } from "../constants";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import UserModel, { TokenUser, UserDocument } from "../models/User";
import { verifyJWTToken } from "../utils/auth";
import SOCKET from "./channels";
import { getIO } from "./init";

export const onSocketConnect = async (
  jwt: string,
  socket: Socket<DefaultEventsMap, DefaultEventsMap>
) => {
  const io = getIO();

  const tokenUser = await verifyJWTToken(jwt);

  console.log("Socket User Online : ", tokenUser.email);

  // Mark user as Online => Emit this data also

  const user = await UserModel.findByIdAndUpdate(tokenUser.id, {
    isOnline: true,
  });

  // Emit this to admin-companyId;
  io.to(`admin-${tokenUser.companyId}`).emit(SOCKET.USER_ONLINE, {
    id: tokenUser.id,
    name: user.firstName + " " + (user.lastName ?? ""),
    // TODO: Add avatar url
    avatarURL: "",
  });

  // A user will subscribe to 3 channels
  // 1. User Id => Only specific to user connections
  // 2. Company Id => Only specific to a company
  // 3. "admin-${companyId}" => Only if user is admin for that company

  socket.join(tokenUser.id);
  socket.join(tokenUser.companyId);
  if (tokenUser.roles.includes(ROLES.ADMIN)) {
    socket.join(`admin-${tokenUser.companyId}`);
  }

  return tokenUser;
};

export const onSocketDisconnect = async (
  user: null | TokenUser,
  socket: Socket<DefaultEventsMap, DefaultEventsMap>
) => {
  if (!user) {
    console.log("[SOCKET] Disconnected Socket No User");
    socket.disconnect(true);
    return;
  }
  console.log(`[SOCKET] Disconnected Socket ${user.email} ${user.id}`);

  await UserModel.findByIdAndUpdate(user.id, { isOnline: false });
  const io = getIO();
  console.log("Socket User Offline : ", user.email);

  io.to(`admin-${user.companyId}`).emit(SOCKET.USER_LOGOUT, { id: user.id });
  socket.disconnect(true);
};
