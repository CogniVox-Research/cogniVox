import type { OptionsConfig } from "@/features/start-session";
import type {
  ASR,
  StressResponse,
  FinalResult,
  SessionMessage,
  TranscriptResponse,
  SDSResponse,
} from "./types";
import WS from "./ws";

export type WaitingState = {
  state: "waiting_join";
  session_id: string;
};

export type ErrorState = {
  state: "error";
  error: string;
};

export type RunningState = {
  state: "running";
  asr: ASR;
  stress: StressResponse[];
};

export type FinishedState = {
  state: "finished";
  transcript_analysis?: TranscriptResponse;
  speech_score?: SDSResponse;
  asr: ASR;
  stress: StressResponse[];
};

export type SessionState =
  | WaitingState
  | ErrorState
  | RunningState
  | FinishedState;

export default class Session {
  readonly options: OptionsConfig;
  readonly session_id: string;
  private state: SessionState;
  private socket: WS;
  private watchers: (() => void)[];

  private constructor(socket: WS, session_id: string, options: OptionsConfig) {
    this.options = options;
    this.watchers = [];
    this.socket = socket;
    this.session_id = session_id;
    this.state = {
      state: "waiting_join",
      session_id,
    };
    this.getState = this.getState.bind(this);
    this.subscribe = this.subscribe.bind(this);

    this.onChange();

    socket.subscribe<string>("error", (error) => {
      this.state = { state: "error", error };
      this.onChange();
    });

    socket.setErrorListener((error) => {
      this.state = { state: "error", error };
      this.onChange();
    });

    socket.subscribe<ASR>("a_s_r", (asr) => {
      if (this.state.state !== "running") return;
      this.state = { ...this.state, asr };
      this.onChange();
    });

    socket.subscribe<StressResponse>("stress", (stress) => {
      if (this.state.state !== "running") return;
      this.state = { ...this.state, stress: [...this.state.stress, stress] };
      this.onChange();
    });

    socket.subscribe("game_connected", () => {
      this.state = {
        state: "running",
        asr: {
          current_silence: null,
          full_text: "",
          lines: [],
          session_id: session_id,
          type: "partial",
        },
        stress: [],
      };
      this.onChange();
    });

    socket.subscribe<FinalResult>("results", (results) => {
      if (this.state.state !== "running") throw Error("Invalid state change");
      this.state = {
        state: "finished",
        ...results,
        asr: this.state.asr,
        stress: this.state.stress,
      };

      this.onChange();
    });

    socket.send("ready");
  }

  subscribe(cb: () => void) {
    this.watchers.push(cb);
    return () => {
      const idx = this.watchers.indexOf(cb);
      this.watchers.splice(idx, 1);
    };
  }

  private onChange() {
    this.watchers.forEach((v) => v());
  }

  getState() {
    return this.state;
  }

  disconnect() {
    this.socket.close();
  }

  static async connect(
    options: OptionsConfig,
    document: File,
  ): Promise<Session> {
    const socket = new WS(`ws://${window.location.host}/api/ws/web`);
    const msg = await socket.waitFor<SessionMessage>("session", 5000);
    const session_id = msg.session_id;

    console.log("session is", session_id);

    const body = new FormData();
    body.append("file", document);
    const upload_response = await fetch(`/api/document/upload/${session_id}`, {
      method: "POST",
      body,
    });
    const document_id = (await upload_response.json()).content_path;

    socket.send("start", {
      ...options,
      document_id,
      qa: options.qaEnabled,
      scene: options.environment,
      size: options.audienceSize,
      environment: undefined,
      qaEnabled: undefined,
      audienceSize: undefined,
    });

    return new Session(socket, session_id, options);
  }
}
