import React, { useRef, useState, useCallback } from 'react';

// Define the type for the MediaRecorder, which is globally available in browsers
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

const WEBSOCKET_URL = "ws://localhost:8000/ws/audio"; 

const AudioRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("Idle. Ready to stream.");

    // Refs to hold global objects
    const recorderRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Buffer to hold audio data until it's sent
    const audioChunksRef = useRef<Blob[]>([]);
    const intervalRef = useRef<number | null>(null);

    // --- WebSocket Setup ---
    const connectWebSocket = useCallback(() => {
        try {
            socketRef.current = new WebSocket(WEBSOCKET_URL);

            socketRef.current.onopen = () => {
                setStatus("Connected to server. Click 'Start Streaming'!");
            };

            socketRef.current.onmessage = (event) => {
                // Handle response from backend if needed
                console.log('Server message:', event.data);
            };

            socketRef.current.onclose = () => {
                setStatus("WebSocket Disconnected.");
            };

            socketRef.current.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setStatus("WebSocket Error. Check console.");
            };
        } catch (e) {
            console.error("Failed to connect WebSocket:", e);
            setStatus("Failed to connect.");
        }
    }, []);

    // --- Send Function ---
    const sendAudio = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            // Create a single blob from all chunks and empty the buffer
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
            audioChunksRef.current = [];

            // Only send if the blob has data
            if (audioBlob.size > 0) {
                socketRef.current.send(audioBlob);
                setStatus(`Streaming: Sent ${audioBlob.size} bytes`);
            }
        } else {
            console.warn("WebSocket is not open. Cannot send audio.");
            // You might want to try to reconnect here
        }
    }, []);

    // --- Start Recording and Streaming ---
    const startStreaming = useCallback(async () => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            // Ensure socket is connected before starting to record
            connectWebSocket();
            // Delay recording start slightly to allow connection to open
            setTimeout(startStreaming, 500);
            return;
        }

        try {
            // 1. Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 2. Create MediaRecorder
            // MimeType is important; 'audio/webm; codecs=opus' is highly compatible.
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm; codecs=opus'
            });
            recorderRef.current = mediaRecorder;

            // 3. Handle data availability
            mediaRecorder.ondataavailable = (event) => {
                // Collect chunks of data
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // 4. Start recording
            mediaRecorder.start(1000); // Start recording, collect data every 1000ms (1 second)

            // 5. Set up an interval to periodically send the collected data
            // This is the **streaming** part. It takes the buffered chunks and sends them.
            intervalRef.current = window.setInterval(sendAudio, 1000);

            setIsRecording(true);
            setStatus("Recording and Streaming...");

        } catch (error) {
            console.error("Error accessing microphone or starting recorder:", error);
            setStatus("Error: Failed to access microphone.");
        }
    }, [connectWebSocket, sendAudio]);

    // --- Stop Recording and Streaming ---
    const stopStreaming = useCallback(() => {
        setIsRecording(false);
        setStatus("Stopping streaming...");

        // 1. Stop MediaRecorder
        if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop();
        }

        // 2. Stop the microphone stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        // 3. Clear the sending interval
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // 4. Send any remaining data in the buffer
        sendAudio();
        audioChunksRef.current = []; // Clear buffer completely

        // 5. Close WebSocket connection (optional, but clean)
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        setStatus("Stopped. Ready to stream again.");

    }, [sendAudio]);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>🎤 Audio Stream Demo</h2>
            <p>Status: <strong>{status}</strong></p>
            <button
                onClick={isRecording ? stopStreaming : startStreaming}
                disabled={!!(!isRecording && socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING)}                style={{
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
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                *The backend will log the size of each audio chunk it receives.
            </p>
        </div>
    );
};

export default AudioRecorder;