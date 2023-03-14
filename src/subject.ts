export class Subject<T> {
  private listeners: ((event: T) => any)[] = [];

  addListener(listenerToAdd: (event: T) => any): () => void {
    this.listeners.push(listenerToAdd);

    const unsubscribe = (): void => {
      this.removeListener(listenerToAdd);
    };

    return unsubscribe;
  }

  addListenerOnce(listenerToAdd: (event: T) => any): () => void {
    const wrappedListener = (event: T): void => {
      this.removeListener(wrappedListener);
      listenerToAdd(event);
    };

    const unsubscribe = this.addListener(wrappedListener);

    return unsubscribe;
  }

  removeListener(listenerToRemove: (event: T) => any): this {
    this.listeners = this.listeners.filter((listener) => {
      return listener !== listenerToRemove;
    });

    return this;
  }

  removeAllListeners(): this {
    this.listeners = [];
    return this;
  }

  notify = (event: T): this => {
    this.listeners.forEach((listener) => {
      // TODO: handle errors
      listener(event);
    });

    return this;
  };
}
