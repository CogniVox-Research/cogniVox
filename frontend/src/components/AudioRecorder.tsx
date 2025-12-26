import React, { useEffect, useRef, useState } from 'react';
import AudioStreamer from "../lib/audio-streamer";

// Define the type for the MediaRecorder, which is globally available in browsers
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

const WEBSOCKET_URL = "ws://localhost:8000/ws/audio";

const AudioRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [content, setContent] = useState(null);

    const streamer = useRef(new AudioStreamer(WEBSOCKET_URL));
    useEffect(() => {
        streamer.current.onMessage((m) => {
            setContent(JSON.parse(m.data).content)
        });

        streamer.current.onStateChange(() => {
            setIsRecording(streamer.current.isRecording)
        })

    }, [streamer]);

    const start = () => streamer.current.startStream();
    const stop = () => streamer.current.stopStreaming();

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>🎤 Audio Stream Demo</h2>
            <p>Status: <strong>{status}</strong></p>
            <button
                onClick={!isRecording ? start : stop}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: isRecording ? '#d9534f' : '#5cb85c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                {isRecording ? '🔴 Stop Streaming' : '▶️ Start Streaming'}
            </button>
            <button
                onClick={!isRecording ? () => streamer.current.startTestStream() : null}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: isRecording ? '#d9534f' : '#5cb85c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                ▶️ Send Test Streaming
            </button>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                *The backend will log the size of each audio chunk it receives.
            </p>
            {content && content.lines.map(v => <p>{JSON.stringify(v)}</p>)}
            {content && content.lines.filter(v => v.speaker).reduce((pv, c) => pv + c.text, "")}
        </div>
    );
};

[].reduce

export default AudioRecorder;