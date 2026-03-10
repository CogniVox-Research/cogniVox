import type { OptionsConfig } from "@/features/start-session";
import type {
  ASR,
  StressResponse,
  FinalResult,
  SessionMessage,
  TranscriptResponse,
  SDSResponse,
  Timestamped,
  HeartRate,
  Stuck,
  ASRRaw,
  AnsweringResult,
  StressPlan,
} from "./types";
import WS from "./ws";
import { produce } from "immer";
import { compactSpeech } from "./asr_util";

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
  stress: Timestamped<StressResponse>[];
  heart_rate: Timestamped<HeartRate>[];
  stuck: Timestamped<Stuck>[];
};

export type QuestionState = {
  state: "question";
  questions: { asr: ASR; question: string }[];
  stress: Timestamped<StressResponse>[];
  heart_rate: Timestamped<HeartRate>[];
  stuck: Timestamped<Stuck>[];
  speech: {
    asr: ASR;
  };
} & (
  | {
      current_question: string;
      current_asr: ASR;
    }
  | {
      current_question: null;
      current_asr: null;
    }
);

export type FinishedState = {
  state: "finished";
  transcript_analysis?: TranscriptResponse;
  speech_score?: SDSResponse;
  asr: ASR;
  stress: Timestamped<StressResponse>[];
  heart_rate: Timestamped<HeartRate>[];
  stuck: Timestamped<Stuck>[];
  answer_score: AnsweringResult;
  stress_result: StressPlan;
};

export type SessionState =
  | WaitingState
  | ErrorState
  | RunningState
  | FinishedState
  | QuestionState;

const emptyASR = (): ASR => {
  return {
    current_silence: null,
    full_text: "",
    segments: [],
    type: "partial",
  };
};

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
    this.update();

    socket.subscribe<string>("error", (error) => {
      this.update({ state: "error", error });
    });

    socket.setErrorListener((error) => {
      this.update({ state: "error", error });
    });

    socket.subscribe<ASRRaw>("a_s_r", (asr) => {
      this.update((s) => {
        if (s.state !== "running") return;
        s.asr = {
          ...asr,
          segments: compactSpeech(asr.lines),
        };
      });
    });

    socket.subscribe<StressResponse>("stress", (stress) => {
      this.update((s) => {
        if (s.state !== "running") return;
        s.stress.push({ data: stress, timestamp: new Date() });
      });
    });

    socket.subscribe<HeartRate>("heart_rate", (hr) => {
      this.update((s) => {
        if (s.state !== "running") return;
        s.heart_rate.push({ data: hr, timestamp: new Date() });
      });
    });

    socket.subscribe("stuck", () => {
      this.update((s) => {
        if (s.state !== "running") return;
        s.stuck.push({ data: { type: "stuck" }, timestamp: new Date() });
      });
    });

    socket.subscribe("unstuck", () => {
      this.update((s) => {
        if (s.state !== "running") return;
        s.stuck.push({ data: { type: "unstuck" }, timestamp: new Date() });
      });
    });

    socket.subscribe<string>("stuck_suggestion", (sg) => {
      this.update((s) => {
        if (s.state !== "running") return;
        s.stuck.push({
          data: { type: "stuck_suggestion", text: sg },
          timestamp: new Date(),
        });
      });
    });

    socket.subscribe("game_connected", () => {
      this.update({
        state: "running",
        asr: emptyASR(),
        stress: [],
        heart_rate: [],
        stuck: [],
      });
    });

    socket.subscribe("questions_begin", () => {
      if (this.state.state !== "running") throw Error("Invalid state change");
      this.update({
        state: "question",
        current_asr: null,
        current_question: null,
        heart_rate: this.state.heart_rate,
        questions: [],
        stress: this.state.stress,
        stuck: this.state.stuck,
        speech: { asr: this.state.asr },
      });
    });

    socket.subscribe<string>("question", (question) => {
      this.update((s) => {
        if (s.state !== "question") return;
        s.current_question = question;
        s.current_asr = emptyASR();
      });
    });

    socket.subscribe<ASR>("question_a_s_r", (asr) => {
      this.update((s) => {
        if (s.state !== "question" || !s.current_question) return;
        s.current_asr = asr;
      });
    });

    socket.subscribe("question_end", () => {
      this.update((s) => {
        if (s.state !== "question" || !s.current_question) return;
        s.questions.push({
          asr: s.current_asr,
          question: s.current_question,
        });
      });
    });

    socket.subscribe<FinalResult>("results", (results) => {
      if (this.state.state === "running") {
        this.update({
          state: "finished",
          ...results,
          asr: this.state.asr,
          stress: this.state.stress,
          heart_rate: this.state.heart_rate,
          stuck: this.state.stuck,
        });
      } else if (this.state.state === "question") {
        this.update({
          state: "finished",
          ...results,
          asr: this.state.speech.asr,
          stress: this.state.stress,
          heart_rate: this.state.heart_rate,
          stuck: this.state.stuck,
        });
      } else {
        throw Error("Invalid state change");
      }
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

  private update(fn_or_state?: ((s: SessionState) => void) | SessionState) {
    if (fn_or_state) {
      if (typeof fn_or_state === "function") {
        this.state = produce(this.state, fn_or_state);
      } else {
        this.state = fn_or_state;
      }
    }
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
