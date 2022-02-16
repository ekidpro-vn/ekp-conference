import {
  OpenVidu,
  Session,
  Subscriber,
  Publisher,
  StreamEvent,
  Stream,
} from "openvidu-browser";
import { checkPublishByRole } from "./utils/check-publish-conference";
import { Events } from "./utils/events";
import {
  IUser,
  Actions,
  IEventStream,
  ConfigConference,
} from "./conference.type";
import { getOptionPublisherByRole } from "./utils/get-option-publisher";

const configAdvanced = {
  publisherSpeakingEventsOptions: {
    interval: 500, // Frequency of the polling of audio streams in ms (default 100)
    threshold: 45,
  },
};

class Conference {
  events = new Events();
  public openVidu?: OpenVidu;
  session?: Session;
  subscribers: Subscriber[] = [];
  publisher?: Publisher;
  userInfo?: IUser;
  token?: string;
  config?: ConfigConference;
  configDefault = {
    resolution: "640x480",
    frameRate: 30,
    insertMode: "APPEND",
    mirror: false,
  };

  constructor() {}

  init(params: { token: string; userInfo: IUser; config?: ConfigConference }) {
    this.initConference();
    this.token = params.token;
    this.userInfo = params.userInfo;
    this.config = this.config;
  }

  updateToken = (token: string) => {
    this.token = token;
  };

  initConference = () => {
    this.openVidu = new OpenVidu();
    this.openVidu.enableProdMode();
    this.openVidu.setAdvancedConfiguration(configAdvanced);
  };

  start = async () => {
    if (!this.userInfo || !this.token || this.session) {
      return;
    }

    if (!this.openVidu) {
      this.initConference();
    }

    if (!this.openVidu) {
      return;
    }

    // const devices = await this.openVidu.getDevices();
    // const videoDevice = devices.filter((i) => i.kind === "videoinput");
    // const publishOption = getOptionPublisherByRole(this.userInfo.role, {
    //   camera: videoDevice.length > 0,
    // });

    this.session = this.openVidu.initSession();
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
          const subscriber = this.session.subscribe(
            (event as StreamEvent).stream,
            `${data.userId}_${data.role}`
          );
          this.subscribers.push(subscriber);
          const push: IEventStream = { info: data, stream: subscriber };
          this.events.emit(Actions.ADD_STREAM, push);
        } catch (error) {
          this.events.emit(Actions.CONNECT_ERROR, { message: error.message });
          console.error("streamCreated: ", error);
        }
      }
    });
    this.session.on("streamDestroyed", (e) => {
      const event = e as StreamEvent;
      const connectionData = event.stream.connection.data;
      const clientData = connectionData.split("%/%");
      const data = JSON.parse(clientData[0]) as IUser;
      const subscribers = this.subscribers;
      const index = subscribers.indexOf(
        event.stream.streamManager as Subscriber,
        0
      );
      if (index > -1) {
        subscribers.splice(index, 1);
        this.subscribers = subscribers;
        const push: IEventStream = {
          info: data,
          stream: event.stream.streamManager as Subscriber,
        };
        this.events.emit(Actions.REMOVE_STREAM, push);
      }
    });

    this.events.emit(Actions.CONNECTING, { message: "Connecting..." });

    this.session
      .connect(this.token, {
        ...this.userInfo,
        clientData: this.userInfo.name || "No name",
      })
      .then(() => {
        this.events.emit(Actions.CONNECT_SUCCESS, { message: "Join room..." });

        if (this.userInfo && this.session && this.openVidu) {
          if (
            typeof this.config !== "undefined" &&
            this.config.public &&
            typeof this.config.publicConfig !== "undefined"
          ) {
            this.openVidu
              .initPublisherAsync("", {
                ...this.config.publicConfig,
                ...this.configDefault,
              })
              .then((publisher) => {
                this.publisher = publisher;
                this.session?.publish(this.publisher).then(() => {
                  if (this.userInfo && this.publisher) {
                    const push: IEventStream = {
                      info: this.userInfo,
                      stream: this.publisher,
                    };
                    this.events.emit(Actions.ADD_STREAM, push);
                  }
                });
              })
              .catch((error) => {
                this.events.emit(Actions.PUBLISH_ERROR, {
                  message: error.message,
                });
              });
          }
        }
      })
      .catch((error) => {
        this.events.emit(Actions.CONNECT_ERROR, { message: error.message });
      });
  };

  retryPublish = async () => {
    if (!this.openVidu) {
      this.initConference();
    }

    if (this.userInfo && this.session && this.openVidu) {
      if (
        typeof this.config !== "undefined" &&
        this.config.public &&
        typeof this.config.publicConfig !== "undefined"
      ) {
        // const devices = await this.openVidu.getDevices();
        // const videoDevice = devices.filter((i) => i.kind === "videoinput");
        // const publishOption = getOptionPublisherByRole(this.userInfo.role, {
        //   camera: videoDevice.length > 0,
        // });

        this.openVidu
          .initPublisherAsync("", {
            ...this.config.publicConfig,
            ...this.configDefault,
          })
          .then((publisher) => {
            this.publisher = publisher;
            this.session?.publish(this.publisher).then(() => {
              if (this.userInfo && this.publisher) {
                const push: IEventStream = {
                  info: this.userInfo,
                  stream: this.publisher,
                };
                this.events.emit(Actions.ADD_STREAM, push);
              }
            });
          })
          .catch((error) => {
            this.events.emit(Actions.PUBLISH_ERROR, { message: error.message });
          });
      }
    }
  };

  close = () => {
    if (!this.session) {
      return;
    }
    this.session.disconnect();
    this.session = undefined;
    this.publisher = undefined;
    this.subscribers = [];
  };

  muteAudio = (val: boolean) => {
    const publisher = this.publisher;
    if (publisher) {
      publisher.publishAudio(val);
    }
  };

  muteVideo = (val: boolean) => {
    const publisher = this.publisher;
    if (publisher) {
      publisher.publishVideo(val);
    }
  };

  getUserInfo = (stream: Stream): IUser | null => {
    const connectionData = stream.connection.data;
    const clientData = connectionData.split("%/%");
    try {
      if (clientData.length === 0) {
        return null;
      }
      const userInfo = JSON.parse(clientData[0]);
      if (userInfo && typeof userInfo.userId !== "number") {
        userInfo.userId = parseInt(userInfo.userId, 10);
      }
      return userInfo;
    } catch (error) {
      return null;
    }
  };
}

export default new Conference();
