//  {
//     audioSource: undefined, // The source of audio. If undefined default microphone
//     videoSource: false, // The source of video. If undefined default webcam
//     publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
//     publishVideo: true, // Whether you want to start publishing with your video enabled or not
//     resolution: '640x480', // The resolution of your video
//     frameRate: 30, // The frame rate of your video
//     insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
//     mirror: false // Whether to mirror your local video or not
//   }

export function getOptionPublisherByRole(role: string) {
  const roleUpper = role.toUpperCase();
  switch (roleUpper) {
    case "OPERATOR_MANAGEMENT":
    case "OPERATOR":
    case "ADMIN": {
      return {
        audioSource: false,
        videoSource: false,
        publishAudio: true,
        publishVideo: false,
        resolution: "640x480",
        frameRate: 30,
        insertMode: "APPEND",
        mirror: false,
      };
    }

    default:
      return {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: true,
        publishVideo: true,
        resolution: "640x480",
        frameRate: 30,
        insertMode: "APPEND",
        mirror: false,
      };
  }
}
