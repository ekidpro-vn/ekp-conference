export class Events {
  events: Record<string, ((...args: any) => void)[]> = {};

  addEvent(key: string, fnc: (...args: any) => void) {
    if (!this.events[key]) {
      this.events[key] = [];
    }
    this.events[key].push(fnc);
  }

  removeEvent(key: string, fnc: (...args: any) => void) {
    const fncClone = this.events[key];
    this.events[key] = fncClone.filter((i) => i !== fnc);
  }

  removeEventAll() {
    this.events = {};
  }

  emit(key: string, args: any) {
    const fncClone = this.events[key];
    if (fncClone && fncClone.length > 0) {
        fncClone.forEach((fnc) => {
        fnc(args);
      });
    }
  }
}
