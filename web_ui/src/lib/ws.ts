type MessageWaiter = {
  type: string;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export default class WS {
  private socket: WebSocket;
  private waiters: MessageWaiter[];
  private listeners: Map<string, (v: unknown) => void>;
  error: string | null;
  private messageListener: ((msg: unknown) => void) | null;
  private errorListener: ((error: string) => void) | null;

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.waiters = [];
    this.listeners = new Map();
    this.error = null;
    this.messageListener = null;
    this.errorListener = null;

    this.socket.onerror = (e) => this._handleError(e);
    this.socket.onmessage = (m) => this._messageHandler(m);
  }

  setMessageListener(v: (msg: unknown) => void) {
    this.messageListener = v;
  }

  setErrorListener(v: (msg: string) => void) {
    this.errorListener = v;
  }

  waitFor<T = unknown>(type: string, timeout: number = -1): Promise<T> {
    let getMessage = new Promise((resolve, reject) => {
      this.waiters.push({ type, resolve, reject });
    });

    if (timeout > 0) {
      const time = new Promise<never>((_, rej) =>
        setTimeout(() => {
          rej("Waiter Timed Out");
        }, timeout),
      );
      getMessage = Promise.race([getMessage, time]) as Promise<T>;
    }

    return getMessage as Promise<T>;
  }

  subscribe<T = unknown>(type: string, listener: (data: T) => void) {
    // @ts-expect-error ignore
    this.listeners.set(type, listener);
  }

  async send(type: string, data?: unknown) {
    this.socket.send(JSON.stringify({ type, data }));
  }

  async connect() {
    await new Promise((res, rej) => {
      this.socket.onopen = res;
      this.socket.onerror = rej;
    });
  }

  close() {
    this.socket.close();
  }

  private _handleError(e: unknown) {
    this.error = `${e}`;
    this.waiters.forEach((l) => l.reject(e));
    this.waiters = [];
    this.listeners.clear();
    this.socket.close();
  }

  private _messageHandler(msg: MessageEvent) {
    try {
      const data = JSON.parse(msg.data);
      console.log(`Got Message ${msg.data}`);
      if (this.waiters.length > 0) {
        const idx = this.waiters.findIndex((m) => m.type == data.type);
        console.log("idx is " + idx + " data is " + JSON.stringify(data));
        if (idx >= 0) {
          this.waiters[idx].resolve(data.data);
          this.waiters.splice(idx, 1);
          return;
        }
      }

      if (data.type === "error") {
        return this._handleError(data.data);
      }

      const listener = this.listeners.get(data.type);
      if (listener) {
        listener(data.data);
      } else if (this.messageListener) {
        this.messageListener(data);
      }
    } catch (e) {
      this._handleError(e);
      console.error(`Failed to parse message: ${e}`);
    }
  }
}
