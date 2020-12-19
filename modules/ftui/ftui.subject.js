
export class Subject {
  constructor() {
    this.observers = [];
  }

  isSubscribed(observer) {
    return this.observers.filter(subscriber => subscriber === observer).length;
  }

  subscribe(observer) {
    if (this.isSubscribed(observer)) return;
    this.observers.push({ observer: observer });
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(subscriber => subscriber !== observer);
  }

  publish(args) {
    this.observers.forEach(subscriber => subscriber.observer(args));
  }
}
