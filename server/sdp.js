import { Server, Socket } from "socket.io";
/**
 * @type {Map<string,number>}
 */
const roomMap = new Map();
/**
 * @param {Server} io 
 */
export const initSDPServer = (io) => {
  // 当用户连接到客户端的时候触发该事件
  io.on("connection", (socket) => {
    onEvent(socket);
  })
}
/**
 * 初始化事件监听
 * @param {Socket} socket 
 */
const onEvent = (socket) => {
  let { roomId, userId } = socket.request._query;
  if (!roomMap.get(roomId)) {
    roomMap.set(roomId, 1);
  } else {
    roomMap.set(roomId, roomMap.get(roomId) + 1)
  }
  console.log("新用户加入：房间总人数", roomMap.get(roomId));
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    socket.to(roomId).emit("client-leave", userId + ":leave")
    roomMap.set(roomId, roomMap.get(roomId) - 1)
    console.log("用户离开：房间总人数", roomMap.get(roomId));
  })
  if (roomMap.get(roomId) > 2) {
    socket.emit("room-full", true)
    return
  }
  socket.join(roomId);
  socket.emit("people-count-msg", roomMap.get(roomId));
  socket.to(roomId).emit("people-count-msg", roomMap.get(roomId));
  socket.to(roomId).emit("room-msg", `welcome: ${userId}`);

  socket.on('offer-sdp-msg', (offerSDP) => {
    socket.to(roomId).emit("offer-sdp-msg", offerSDP)
  })
  socket.on('answer-sdp-msg', (answerSDP) => {
    socket.to(roomId).emit("answer-sdp-msg", answerSDP)
  })
  socket.on('candidate-msg', (candidate) => {
    socket.to(roomId).emit("candidate-msg", candidate)
  })
}