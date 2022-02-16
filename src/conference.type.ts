import { Publisher, Subscriber } from "openvidu-browser";

export interface IUser {
  userId: number;
  name: string;
  role: string;
}

export const Actions = {
  ADD_STREAM: "ADD_STREAM",
  REMOVE_STREAM: "REMOVE_STREAM",
  CONNECT_ERROR: "CONNECT_ERROR",
  PUBLISH_ERROR: "PUBLISH_ERROR",
  CONNECT_SUCCESS: "CONNECT_SUCCESS",
  CONNECTING: "CONNECTING",
};

export interface IEventStream {
  info: IUser;
  stream: Publisher | Subscriber;
}

export interface ConfigConference {
  public: boolean;
  publicConfig?: {
    audioSource?: boolean;
    videoSource?: boolean;
    publishAudio?: boolean;
    publishVideo?: boolean;
  };
}