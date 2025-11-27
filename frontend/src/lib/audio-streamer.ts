export default class AudioStreamer {
    #url: string;
    #connection: WebSocket | null = null;
    #recorder: MediaRecorder | null = null;
    #messageHandler: ((m: MessageEvent) => void) | null = null;
    #stateHandler: (() => void) | null = null;

    constructor(url: string) {
        this.#url = url;
    }

    async connectWS() {
        await new Promise((res, rej) => {
            try {
                let ws = new WebSocket(this.#url);

                ws.onopen = () => {
                    res(null)
                    this.#connection = ws;
                };
                ws.onmessage = (event) => {
                    if (this.#messageHandler) {
                        this.#messageHandler(event)
                    } else {
                        console.log(event)
                    }
                };
                ws.onclose = () => {
                    console.log("WebSocket Disconnected.");
                    this.#connection = null;
                    if (this.#stateHandler) this.#stateHandler();
                };
                ws.onerror = (error) => console.error('WebSocket Error:', error);

            } catch (e) {
                console.error("Failed to connect WebSocket:", e);
                rej(e)
            }
        })
    }

    onMessage(handler: (m: MessageEvent) => void) {
        this.#messageHandler = handler;
    }

    onStateChange(handler: () => void) {
        this.#stateHandler = handler;
    }


    async startStream() {
        await this.connectWS();

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        this.#recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm; codecs=opus'
        });

        this.#recorder.onstart = () => {
            if (this.#stateHandler) this.#stateHandler();
        }

        this.#recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                const audioBlob = event.data
                if (audioBlob.size > 0) {
                    if (this.#connection == null) {
                        this.stopStreaming();
                        return;
                    }

                    this.#connection.send(audioBlob);
                    console.log(`Streaming: Sent ${audioBlob.size} bytes`);
                }
            }
        };

        this.#recorder.start(1000);
    }

    async stopStreaming() {
        this.#recorder?.stop();
        if (this.#recorder) {
            this.#recorder.onstop = () => {
                setTimeout(() => {
                    this.#connection?.send(new Blob(["STOP"], { type: "plain/text" }));
                }, 500)
            };
            this.#recorder = null;
        }

        if (this.#stateHandler) this.#stateHandler();
    }

    get isRecording() {
        return this.#recorder != null
    }
}