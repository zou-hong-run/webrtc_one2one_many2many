import { createPeerConnection, createVideoEle, getLocalMediaStream, getLocalScreenMediaStream, setLocalVideoStream, setRemoteVideoStream } from "./utils/common.js";
import { io } from "./utils/socket.io.esm.min.js"
const roomInput = document.querySelector("#roomId")
const userInput = document.querySelector("#userId")
const startBtn = document.querySelector('.startBtn')
const stopBtn = document.querySelector('.stopBtn')
const videoBtn = document.querySelector('.videoBtn');
const screenBtn = document.querySelector('.screenBtn');

let offerVideo = document.querySelector('#offerVideo')

let localStream = await getLocalMediaStream({ video: true, audio: true });
setLocalVideoStream(offerVideo, localStream);

let isStopAudio = false;
let isStopVideo = false;

/**
 * @type {RTCPeerConnection}
 */
let peer;
let client;
let roomId;
let userId;
let isInited = false;
let isRoomFull = false;
const serverUrl = "wss://192.168.0.107:3333/";
stopBtn.addEventListener('click', () => {
  if (peer) {
    isStopAudio = !isStopAudio;
    isStopVideo = !isStopVideo;
    peer.getSenders().find(sender => sender.track.kind === 'audio').track.enabled = !isStopAudio
    peer.getSenders().find(sender => sender.track.kind === 'video').track.enabled = !isStopVideo
  }
})
videoBtn.addEventListener("click", async () => {
  let newStream = await getLocalMediaStream({ video: true, audio: true });
  if (newStream) {
    localStream = newStream
    setLocalVideoStream(offerVideo, localStream);
    localStream.getVideoTracks().forEach(track => {
      peer.getSenders().find(sender => sender.track.kind === 'video').replaceTrack(track)
    })
  }

})
screenBtn.addEventListener("click", async () => {
  let newStream = await getLocalScreenMediaStream({
    video: {
      cursor: 'always' | 'motion' | 'never',
      displaySurface: 'application' | 'browser' | 'monitor' | 'window'
    }
  });
  if (newStream) {
    localStream = newStream
    setLocalVideoStream(offerVideo, localStream);
    localStream.getVideoTracks().forEach(track => {
      peer.getSenders().find(sender => sender.track.kind === 'video').replaceTrack(track)
    })
  }

})
startBtn.addEventListener('click', async () => {
  if (isRoomFull) {
    alert("当前房间人数已满");
    return
  }
  roomId = roomInput.value;
  userId = userInput.value;

  if (!client) {
    client = new io(serverUrl, {
      reconnectDelayMat: 10000,
      transports: ["websocket"],
      query: {
        roomId,
        userId
      }
    });
  }
  client.on("connect", () => {
    console.log("Connection successful!");
  })
  client.on("disconnect", () => {
    console.log("Connection disconnect!");
  })
  client.on("error", () => {
    console.log("Connection error!");
  })
  client.on('room-msg', (data) => {
    console.log(data);
  })
  client.on('people-count-msg', async (count) => {
    if (count === 1) {
      isInited = true
    }
    peer = createPeerConnection();
    localStream.getTracks().forEach(track => {
      peer.addTrack(track, localStream)
    });
    /**
     * @param {RTCPeerConnectionIceEvent} event 
     */
    peer.onicecandidate = (event) => {
      // console.log("candidate", event.candidate);
      if (event.candidate) {
        client.emit("candidate-msg", event.candidate)
      }
    }
    /**
     * @param {RTCTrackEvent} event 
     */
    peer.ontrack = (event) => {
      let videoEle = createVideoEle(count);
      setRemoteVideoStream(videoEle, event.track)
    }
    if (!isInited) {
      let offerSDP = await peer.createOffer()
      await peer.setLocalDescription(offerSDP)
      client.emit("offer-sdp-msg", offerSDP);
    }
    isInited = true
  })
  client.on("room-full", () => {
    alert("当房间人数已经满了")
    isRoomFull = true
    return
  })
  // A收到B的sdp
  client.on('offer-sdp-msg', async (offerSDP) => {
    await peer.setRemoteDescription(offerSDP)
    let answerSDP = await peer.createAnswer();
    await peer.setLocalDescription(answerSDP)
    client.emit("answer-sdp-msg", answerSDP)
  })
  // B收到A的sdp
  client.on('answer-sdp-msg', async (answerSDP) => {
    await peer.setRemoteDescription(answerSDP);
  })
  // 交换candiate信息
  client.on('candidate-msg', async (candidate) => {
    await peer.addIceCandidate(candidate)
  })
  client.on('client-leave', (data) => {
    console.log(data);
  })
})


