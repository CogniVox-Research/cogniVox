import testAudio from '../assets/micro-machines.wav';
import { toBase64 } from './utils';

type SpeechOptions = {
    doc: File
    settings?: {}
}

export default class AudioStreamer {
    #url: string;
    #connection: WebSocket | null = null;
    #recorder: MediaRecorder | null = null;
    #messageHandler: ((m: MessageEvent) => void) | null = null;
    #stuckHandler: ((m: any) => void) | null = null;
    #transcriptHandler: ((m: any) => void) | null = null;
    #speechScoreHandler: ((m: any) => void) | null = null;
    #stateHandler: (() => void) | null = null;
    #isProcessing: boolean = false;

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
                    try {
                        var data = JSON.parse(event.data);
                    } catch (e) {
                        console.error(event)
                        return
                    }

                    console.log("type: " + data.type, data)
                    if (data.type === "completed") {
                        this.#isProcessing = false;
                    }

                    if (data.type === "completed" || data.type === "partial") {
                        if (this.#messageHandler) {
                            this.#messageHandler(data)
                        } else {
                            console.log(event)
                        }
                    } else if (data.type === "stuck_detection" || data.type === "unstuck_detection") {
                        if (this.#stuckHandler) {
                            this.#stuckHandler(data)
                        }
                    } else if (data.type === "transcript_similarity") {
                        if (this.#transcriptHandler) {
                            this.#transcriptHandler(data)
                        }
                    } else if (data.type === "speech_score") {
                        if (this.#speechScoreHandler) {
                            this.#speechScoreHandler(data)
                        }
                    }
                };
                ws.onclose = () => {
                    console.log("WebSocket Disconnected.");
                    this.#connection = null;
                    this.#isProcessing = false;
                    if (this.#stateHandler) this.#stateHandler();
                };
                ws.onerror = (error) => console.error('WebSocket Error:', error);

            } catch (e) {
                console.error("Failed to connect WebSocket:", e);
                rej(e)
            }
        })
    }

    onMessage(handler: (m: any) => void) {
        this.#messageHandler = handler;
    }

    onStuck(handler: (m: any) => void) {
        this.#stuckHandler = handler;
    }

    onTranscript(handler: (m: any) => void) {
        this.#transcriptHandler = handler;
    }

    onSpeechScore(handler: (m: any) => void) {
        this.#speechScoreHandler = handler;
    }

    onStateChange(handler: () => void) {
        this.#stateHandler = handler;
    }


    async startStream(options: SpeechOptions) {
        await this.connectWS();


        this.#connection?.send(JSON.stringify({ "type": "settings", "data": options.settings }));
        this.#connection?.send(JSON.stringify({ "type": "transcript", "data": await toBase64(options.doc) }));
        this.#connection?.send(JSON.stringify({ "type": "speech_start" }))

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
                }
            }
        };

        this.#recorder.start(1000);
    }

    async startTestStream() {
        await this.connectWS();
        this.#isProcessing = true;

        const response = await fetch(testAudio);
        const audioBlob = await response.blob();

        if (this.#connection == null) {
            return;
        }

        if (this.#stateHandler) this.#stateHandler();

        this.#connection.send(audioBlob);
        console.log(`Test Stream: Sent ${audioBlob.size} bytes`);

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => {
            const length = audio.duration * 200;
            setTimeout(() => {
                this.#connection?.send(JSON.stringify({ "type": "speech_end" }))
            }, length + 500);
        }
    }

    async stopStreaming() {
        console.trace("Stop called")
        this.#recorder?.stop();
        if (this.#recorder) {
            this.#recorder.onstop = () => {
                setTimeout(() => {
                    this.#connection?.send(JSON.stringify({ "type": "speech_end" }))
                }, 500)
            };
            this.#recorder = null;
        }

        if (this.#stateHandler) this.#stateHandler();
    }

    get isRecording() {
        return this.#recorder != null || this.#isProcessing;
    }
}