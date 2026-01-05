import { streamAudioFileToWebSocket, type AudioStreamController } from './test-stream';
import { toBase64 } from './utils';

import audioURL from "../assets/demo.opus?url";
import audioText from "../assets/demo.txt?url";

type SpeechOptions = {
    doc: Blob | File,
    settings?: {},
    isTestStream?: boolean
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
    #testStreamer: AudioStreamController | null = null;

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

        if (options.isTestStream) {
            return
        }

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

        await this.startStream({ doc: await (await fetch(audioText)).blob(), isTestStream: true })


        if (this.#connection == null) {
            return;
        }

        if (this.#stateHandler) this.#stateHandler();

        const control = streamAudioFileToWebSocket(this.#connection, audioURL);
        this.#testStreamer = control;

        this.#recorder = control.recorder;

        await control.play();
        await this.stopStreaming();
    }

    async stopStreaming() {
        console.trace("Stop called")
        this.#recorder?.stop();
        this.#testStreamer?.stop();

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