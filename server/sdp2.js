import { Server, Socket } from "socket.io";
/**
 * @type {Map<string,Set<string>>}
 */
const roomMap = new Map();
/**
 * @param {Server} io 
 */
export const initSDPServer = (io) => {
  // 当用户连接到客户端的时候触发该事件
  io.on("connection", (socket) => {
    console.log("New client connected");
    onEvent(socket);
  })
}
/**
 * 初始化事件监听
 * @param {Socket} socket 
 */
const onEvent = (socket) => {
  let { roomId, userId } = socket.request._query
  socket.on('offer-sdp-msg', (data) => {
    console.log("offer");
    socket.to(roomId).emit("offer-sdp-msg", data)
  })
  socket.on('answer-sdp-msg', (data) => {
    console.log("answer");
    socket.to(roomId).emit("answer-sdp-msg", data)
  })
  socket.on('candidate-msg', (data) => {
    socket.to(roomId).emit("candidate-msg", data)
  })
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    socket.to(roomId).emit("client-leave", userId + ":leave")
    roomMap.get(roomId).delete(userId);
    console.log("房间总人数", roomMap.get(roomId).size);
  })
  let userSet = roomMap.get(roomId);
  if (!userSet) {
    let newUserSet = new Set();
    newUserSet.add(userId);
    roomMap.set(roomId, newUserSet);
  } else {
    userSet.add(userId);
  }
  socket.join(roomId);
  socket.emit("user-id-list-msg", [...roomMap.get(roomId)]);
  socket.to(roomId).emit("user-id-list-msg", [...roomMap.get(roomId)]);
  socket.to(roomId).emit("room-msg", "我踏马来了" + userId);
  console.log("房间总人数", roomMap.get(roomId).size);
}