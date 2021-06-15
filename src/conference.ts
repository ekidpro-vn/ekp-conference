import { OpenVidu, Session, Subscriber, Publisher, StreamEvent } from "openvidu-browser";
import { checkPublishByRole } from "./utils/check-publish-conference";

const configAdvanced = {
  publisherSpeakingEventsOptions: {
    interval: 500, // Frequency of the polling of audio streams in ms (default 100)
    threshold: 45,
  },
};

class Conference {
  openVidu: OpenVidu;
  session?: Session;
  subscribers: Subscriber[] = [];
  publisher?: Publisher;
  userInfo?: IUser;
  token?: string;

  constructor() {
    this.openVidu = new OpenVidu();
    this.openVidu.enableProdMode();
    this.openVidu.setAdvancedConfiguration(configAdvanced);
  }

  init(params: { token: string; userInfo: IUser }) {
    this.token = params.token;
    this.userInfo = params.userInfo;
  }

  start() {
    if (!this.userInfo || !this.token) {
      return;
    }
    this.session = this.openVidu.initSession();
    this.session.connect(this.token, { ...this.userInfo, clientData: this.userInfo.name || "No name" });
    if (checkPublishByRole(this.userInfo.role)) {
      this.publisher = this.openVidu.initPublisher(`${this.userInfo.userId}_${this.userInfo.role}`);
    }

    this.session.on("streamCreated", (e) => {
      const event = e as StreamEvent;
      const connectionData = event.stream.connection.data;
      const clientData = connectionData.split("%/%");

      if (clientData && clientData.length > 0) {
        try {
          const data = JSON.parse(clientData[0]) as IUser;
          if (!this.session) {
            return;
          }
          const subscriber = this.session.subscribe((event as StreamEvent).stream, `${data.userId}_${data.role}`);
          this.subscribers.push(subscriber);
        } catch (error) {}
      }
    });
    this.session.on("streamDestroyed", (e) => {
      const event = e as StreamEvent;
      const subscribers = this.subscribers;
      const index = subscribers.indexOf(event.stream.streamManager as Subscriber, 0);
      if (index > -1) {
        subscribers.splice(index, 1);
        this.subscribers = subscribers;
      }
    });
  }

  finish() {
    if (!this.session) {
      return;
    }
    this.session.disconnect();
    this.session = undefined;
    this.publisher = undefined;
    this.subscribers = [];
  }

  muteAudio(val: boolean) {
    const publisher = this.publisher;
    if (publisher) {
      publisher.publishAudio(val);
    }
  }

  muteVideo(val: boolean) {
    const publisher = this.publisher;
    if (publisher) {
      publisher.publishVideo(val);
    }
  }
}

export default new Conference();
