import Conference, { ConfigConference } from "./conference";
export * from "./conference.type";
export default Conference;

declare global {
  var OpenVidu: any;
  var Conference: any;
}
export function sayHello(name: string): string {
  return `Conference: Hello ${name}`;
}
// window["OpenVidu"] =
window["Conference"] = Conference;
