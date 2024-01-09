import express from "express";
import fs from 'fs'
import path from 'path'
import https from 'https'
import { Server } from 'socket.io'
import { getIpAddress } from "./utils/common.js";
import { initSDPServer } from "./server/sdp.js";
// import { initSDPServer } from "./server/sdp2.js";
const options = {
  key: fs.readFileSync(path.resolve("./ssl/server.key")),
  cert: fs.readFileSync(path.resolve("./ssl/server.crt"))
}
const app = express();
app.use(express.static("./public"))
const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer, { allowEIO3: true, cors: true })
initSDPServer(io);
httpsServer.listen(3000, () => {
  let str = getIpAddress() ? `https://${getIpAddress()}:3000` : `当前网络不可用`;
  console.log(str);
})

