import Conference from "./conference";
export * from "./conference.type";

export default Conference;

export function sayHello(name: string): string {
  return `Conference: Hello ${name}`;
}
