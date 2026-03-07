let socket;
const logs = document.getElementById("logs");

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const BASE_URL = (() => {
  const url = new URL("../ws", window.location);
  url.protocol = protocol;
  return url.href;
})();

const ACTIONS = [
  {
    name: "Settings",
    mode: "web",
    type: "start",
    data: {
      scene: "stage",
      size: 10,
      session_type: "speech",
      document_id: "placeholder-micromachines",
      distractions: true,
      qa: true,
      difficulty: "easy",
    },

    state: 1,
    new_state: true,
  },
  {
    name: "Web ready",
    mode: "web",
    type: "ready",

    state: 2,
    new_state: true,
  },
  {
    name: "Game ready",
    mode: "game",
    type: "ready",
    data: {
      stress: true,
      audio_format: "webm",
    },

    state: 3,
    new_state: true,
  },
  {
    name: "Speech Start",
    mode: "game",
    type: "speech_start",

    state: 4,
    new_state: true,
  },
  {
    name: "Audio",
    mode: "game",

    type: "audio",
    data: {
      name: "micro-machines",
      chunk_size: 1000,
      chunks: 30,
    },

    state: 5,
  },
  {
    name: "Audio(Short)",
    mode: "game",

    type: "audio",
    data: {
      name: "micro-machines",
      chunk_size: 1000,
      chunks: 3,
    },

    state: 5,
  },
  {
    name: "Stress",
    mode: "game",
    type: "stress",
    data: {
      bvp_mean: 75.2,
      bvp_std: 5.4,
      eda_mean: 0.02,
      temp_mean: 36.6,
      // Including some optional fields
      acc_mag_mean: 1.1,
    },
    state: 5,
  },
  {
    name: "Silence",
    mode: "game",

    type: "audio",
    data: {
      name: "silence",
      chunk_size: 1000,
      chunks: 10,
    },

    state: 5,
  },
  {
    name: "Speech End",
    mode: "game",
    type: "speech_end",

    state: 5,
    new_state: true,
  },
];

class App {
  constructor() {
    this.connected = false;
    this.logs = [];
    this.state = 1;
    this.web_only = false;
    this.game_only = false;
    this.game_join_id = "";

    this.actions = ACTIONS;

    this.sockets = { web: undefined, game: undefined };
  }

  connectUI() {
    if (this.game_only) {
      this.connect("game", this.game_join_id);
      this.state = 3;
    } else {
      this.connect("web");
    }
  }

  connect(mode, session) {
    const url = `${BASE_URL}/${mode}${!!session ? "/" + session : ""}`;
    this.log(mode, `Connecting to ${url}...`, "system");
    const socket = new WebSocket(url);

    socket.onopen = () => {
      this.connected = true;
      this.log(mode, "WebSocket Connected", "success");
    };

    socket.onmessage = (event) => {
      try {
        let message = JSON.parse(event.data);
        this.handle_message(mode, message);
        this.log(mode, `INBOUND: ${JSON.stringify(message)}`, "in");
      } catch (e) {
        this.log(mode, `INBOUND: Failed to parse ${event.data} ${e}`, "error");
      }
    };

    socket.onclose = () => {
      this.connected = false;
      this.log(mode, "WebSocket Disconnected", "error");
    };

    socket.onerror = (error) => {
      console.log(error);
      this.log(mode, `WebSocket Error: ${error}`, "error");
    };

    this.sockets[mode] = socket;
  }

  clearLogs() {
    this.logs = [];
  }

  log(mode, message, type) {
    const time = new Date().toLocaleTimeString();
    let color = "#fff";
    if (type === "in") color = "#4fc3f7";
    if (type === "out") color = "#8bc34a";
    if (type === "error") color = "#f44336";

    console.log(`[${mode}][${time}] ${message}`);
    this.logs.push({ mode, type, message, color, time });
  }

  sendMessage(message) {
    const socket = this.sockets[message.mode];
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("Not connected!");
      return;
    }

    if (message.type === "audio") {
      let idx = 0;

      const play_chunk = () => {
        fetch(
          `./audio/${message.data.name}/chunk_${idx.toString().padStart(3, "0")}.webm`,
        ).then((data) => {
          data.blob().then((data) => socket.send(data));
        });
        idx += 1;

        if (idx < message.data.chunks) {
          setTimeout(play_chunk, 1000);
        }
      };

      play_chunk();
      return;
    }

    const payload = { type: message.type };
    if (message.data) payload.data = message.data;

    const json = JSON.stringify(payload);
    socket.send(json);
    this.log(message.mode, `OUTBOUND: ${json}`, "out");
    if (message.new_state) {
      this.state++;
    }
  }

  handle_message(mode, message) {
    if (!this.web_only && mode === "web" && message.type === "pair") {
      this.connect("game", message.data.session_id);
    } else if (message.type === "a_s_r") {
      message.data.lines = undefined;
      message.data.session_id = undefined;
    }
  }

  disconnect() {
    this.state = 1;
    this.clearLogs();
    this.game_join_id = "";
    this.web_only = false;
    this.game_only = false;
    this.connected = false;
    this.sockets = { web: undefined, game: undefined };
  }
}

document.addEventListener("alpine:init", () => {
  function sendStress() {
    const mockStress = {
      bvp_mean: 75.2,
      bvp_std: 5.4,
      eda_mean: 0.02,
      temp_mean: 36.6,
      // Including some optional fields
      acc_mag_mean: 1.1,
    };
    sendMessage("stress", mockStress);
  }

  Alpine.data("app", () => new App());
});
