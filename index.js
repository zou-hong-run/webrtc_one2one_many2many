import express from "express";
import fs from 'fs'
import path from 'path'
import https from 'https'
import { Server } from 'socket.io'
import { getIpAddress } from "./utils/common.js";
// 一对一通讯的时候使用这个
// import { initSDPServer } from "./server/sdp.js";
// 多对多通讯的时候使用这个
import { initSDPServer } from "./server/sdp2.js";
const options = {
  key: fs.readFileSync(path.resolve("./ssl/server.key")),
  cert: fs.readFileSync(path.resolve("./ssl/server.crt"))
}
const app = express();
app.use(express.static("./public"))
const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer, { allowEIO3: true, cors: true })
initSDPServer(io);
httpsServer.listen(3333, () => {
  let str = getIpAddress() ? `https://${getIpAddress()}:3333` : `当前网络不可用`;
  console.log(str);
})

