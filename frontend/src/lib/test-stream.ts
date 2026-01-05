

export type AudioStreamController = {
    play: () => Promise<void>;
    stop: () => void;
    recorder: MediaRecorder,
};

export function streamAudioFileToWebSocket(socket: WebSocket, audioURL: string): AudioStreamController {
    const audio = new Audio(audioURL);
    audio.crossOrigin = "anonymous";

    const audioContext = new AudioContext();

    const sourceNode = audioContext.createMediaElementSource(audio);
    const destinationNode = audioContext.createMediaStreamDestination();

    sourceNode.connect(audioContext.destination);
    sourceNode.connect(destinationNode);

    const mediaRecorder = new MediaRecorder(destinationNode.stream, {
        mimeType: "audio/webm; codecs=opus",
    });

    mediaRecorder.ondataavailable = async (event) => {
        if (socket.readyState !== WebSocket.OPEN || event.data.size === 0) return;

        const buffer = await event.data.arrayBuffer();
        socket.send(buffer);
    };

    const play = async () => {
        if (socket.readyState === WebSocket.CONNECTING) {
            await new Promise((res) => (socket.onopen = res));
        }

        if (mediaRecorder.state === "inactive") {
            mediaRecorder.start(1000);
        }

        await audio.play();
        await new Promise((res) => audio.onended = () => setTimeout(res, 1000));
        mediaRecorder.stop()
    };



    const stop = () => {
        audio.pause();
        audio.currentTime = 0;

        if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }

        audioContext.close();
    };

    return { play, recorder: mediaRecorder, stop };

}
