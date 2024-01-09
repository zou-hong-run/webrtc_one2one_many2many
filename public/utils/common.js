
/**
 * 获取本地媒体数据流
 * @param {MediaStreamConstraints} constraints 
 */
export const getLocalMediaStream = async (constraints) => {
  try {
    let stream = await navigator.mediaDevices.getUserMedia(constraints)
    return stream;
  } catch (error) {
    console.log("error", error);
  }
}
/**
 * 获取本地共享屏幕数据流
 * @param {MediaStreamConstraints} constraints 
 */
export const getLocalScreenMediaStream = async (constraints) => {
  try {
    let stream = await navigator.mediaDevices.getDisplayMedia(constraints)
    return stream;
  } catch (error) {
    console.log("error", error);
  }
}
/**
 * 
 * @param {HTMLVideoElement} ele 
 * @param {MediaProvider } stream 
 */
export const setLocalVideoStream = (ele, newStream) => {
  if (ele) {
    let stream = ele.srcObject;
    if (stream) {
      stream.getAudioTracks().forEach(e => {
        stream.removeTrack(e)
      });
      stream.getVideoTracks().forEach(e => {
        stream.removeTrack(e)
      })
    }
    ele.srcObject = newStream
  }
}
/**
 * 
 * @param {HTMLVideoElement} ele 
 * @param {*} track 
 */
export const setRemoteVideoStream = (ele, track) => {
  if (ele) {
    let stream = ele.srcObject;
    if (stream) {
      stream.addTrack(track)
    } else {
      let newStream = new MediaStream();
      newStream.addTrack(track);
      ele.srcObject = newStream;
      ele.muted = true
    }
  }
}

export const createPeerConnection = () => {
  const peer = new RTCPeerConnection({
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    // iceTransportPolicy: 'relay',// 强制服务器转发
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  })
  return peer;
}
/**
 * 
 * @param {number} count 
 * @returns 
 */
export const createVideoEle = (count) => {
  let video_container = document.querySelector(".video-container");
  /**
   * @type {HTMLVideoElement}
   */
  let video = document.querySelector("#video" + count);
  if (!video) {
    video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.controls = true;
    video.id = "video" + count;
    video_container.appendChild(video);
  }
  return video;
}