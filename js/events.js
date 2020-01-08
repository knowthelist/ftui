export default class Events {
  constructor() {
    this.observers = [];
  }

  subscribe(observer, context) {
    if (void 0 === context) { context = observer; }
    this.observers.push({ observer: observer });
  }

  publish(args) {
    this.observers.forEach(topic => topic.observer(args));
  }
}