import type { OptionsConfig } from "@/features/start-session";

export default class Session {
  options: OptionsConfig;
  document: File;
  state: "init" | "starting" | "running" | "ended" | "error";
  socket: WebSocket | null;
  error: string | null;
  needs_pairing: boolean;

  constructor(options: OptionsConfig, document: File) {
    this.options = options;
    this.document = document;
    this.state = "init";
    this.socket = null;
    this.error = null;
    this.needs_pairing = true;
  }

  async connect(): Promise<Session> {
    this.socket = new WebSocket(`ws://${window.location.host}/api/ws/web`);
    this.socket.onmessage = (m) => this.onMessage(m);
    return this;
  }

  onMessage(msg: MessageEvent) {
    try {
      const data = JSON.parse(msg.data);
      console.log(data);
      switch (data.type) {
      }
    } catch (e) {
      this.socket?.close();
      this.error = e.toString();
    }
  }
}
