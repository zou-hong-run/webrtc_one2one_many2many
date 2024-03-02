import { createPeerConnection, createVideoEle, getLocalMediaStream, getLocalScreenMediaStream, setLocalVideoStream, setRemoteVideoStream } from "./utils/common.js";
import { io } from "./utils/socket.io.esm.min.js"


const roomInput = document.querySelector("#roomId")
const userInput = document.querySelector("#userId");
userInput.value = (Math.random()).toString(16).substring(2);
const startBtn = document.querySelector('.startBtn');

const stopBtn = document.querySelector('.stopBtn');
const videoBtn = document.querySelector('.videoBtn');
const screenBtn = document.querySelector('.screenBtn');

let offerVideo = document.querySelector('#offerVideo')

let localStream = await getLocalMediaStream({ video: true, audio: true });
setLocalVideoStream(offerVideo, localStream);
/**
   * @type {Map<string,RTCPeerConnection>}
   */
let peerMap = new Map();
/**
* @type {string[]}
*/
let roomUserIdList;
/**
* @type {string[]}
*/
let connectingUserIdList = [];

let isStopAudio = false;
let isStopVideo = false;
startBtn.addEventListener('click', async () => {
  let roomId = roomInput.value;
  let userId = userInput.value;
  let isInit = false;
  const serverUrl = "wss://192.168.43.7:3000/";
  const options = {
    reconnectDelayMat: 10000,
    transports: ["websocket"],
    query: {
      roomId,
      userId
    }
  }
  let client = new io(serverUrl, options);
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
  client.on('user-id-list-msg', async (userIdList) => {
    roomUserIdList = userIdList;
    connectingUserIdList = roomUserIdList.filter(item => item !== userId);
    // console.log(connectingUserIdList);
    for (let id of connectingUserIdList) {
      let peer = peerMap.get(id);
      if (!peer) {
        peer = createPeerConnection();
        peer.createDataChannel("data-channel")
        peerMap.set(id, peer)
        /**
         * @param {RTCPeerConnectionIceEvent} event 
         */
        peer.onicecandidate = (event) => {
          // console.log("candidate");
          if (event.candidate) {
            client.emit("candidate-msg", {
              fromUserId: userId,
              toUserId: id,
              candidate: event.candidate
            })
          }
        }
        /**
         * @param {RTCTrackEvent} event 
         */
        peer.ontrack = (event) => {
          let videoEle = createVideoEle(id);
          setRemoteVideoStream(videoEle, event.track)
        }
        peer.ondatachannel = (e) => {
          console.log("DataChannel is created");
          // console.log("ondatachannel", e);
        }
        localStream.getTracks().forEach(track => {
          peer.addTrack(track, localStream)
        });
        if (!isInit) {
          let offerSDP = await peer.createOffer()
          await peer.setLocalDescription(offerSDP)
          client.emit("offer-sdp-msg", {
            fromUserId: userId,
            toUserId: id,
            sdp: offerSDP
          });
        }
      }
    }
    isInit = true
  })
  client.on('offer-sdp-msg', async (data) => {
    let { fromUserId, toUserId, sdp } = data
    if (userId === toUserId) {
      console.log(connectingUserIdList, fromUserId, "offer");
      /**
       * @type {RTCPeerConnection}
       */
      let peer = peerMap.get(fromUserId);
      if (peer) {
        await peer.setRemoteDescription(sdp)
        let answerSDP = await peer.createAnswer();
        await peer.setLocalDescription(answerSDP)
        client.emit("answer-sdp-msg", {
          fromUserId: toUserId,
          toUserId: fromUserId,
          sdp: answerSDP
        })
      }
    }
  })
  client.on('answer-sdp-msg', async (data) => {
    let { fromUserId, toUserId, sdp } = data;
    if (userId === toUserId) {
      console.log(connectingUserIdList, fromUserId, "answer");
      /**
      * @type {RTCPeerConnection}
      */
      let peer = peerMap.get(fromUserId);
      if (peer) {
        await peer.setRemoteDescription(sdp);
      }
    }
  })
  // 交换candiate信息
  client.on('candidate-msg', async (data) => {
    let { fromUserId, toUserId, candidate } = data
    if (userId === toUserId) {
      // console.log(connectingUserIdList, fromUserId, "candidate");
      /**
        * @type {RTCPeerConnection}
        */
      let peer = peerMap.get(fromUserId);
      if (peer) {
        await peer.addIceCandidate(candidate)
      }
    }
  })
  client.on('client-leave', (data) => {
    console.log(data);
  })
});
stopBtn.addEventListener("click", () => {
  isStopAudio = !isStopAudio;
  isStopVideo = !isStopVideo;
  for (let id of connectingUserIdList) {
    let peer = peerMap.get(id);
    if (peer) {
      peer.getSenders().find(sender => sender.track.kind === 'audio').track.enabled = !isStopAudio;
      peer.getSenders().find(sender => sender.track.kind === 'video').track.enabled = !isStopVideo;
    }
  }
})
videoBtn.addEventListener("click", async () => {
  let newStream = await getLocalMediaStream({
    video: true,
    audio: true
  })
  if (newStream) {
    localStream = newStream;
    setLocalVideoStream(offerVideo, localStream);
    localStream.getVideoTracks().forEach(track => {
      for (let id of connectingUserIdList) {
        let peer = peerMap.get(id);
        if (peer) {
          peer.getSenders().find(sender => sender.track.kind === 'video').replaceTrack(track)
        }
      }
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
    localStream = newStream;
    setLocalVideoStream(offerVideo, localStream);
    localStream.getVideoTracks().forEach(track => {
      for (let id of connectingUserIdList) {
        let peer = peerMap.get(id);
        if (peer) {
          peer.getSenders().find(sender => sender.track.kind === 'video').replaceTrack(track)
        }
      }
    })
  }
})