import { useEffect, useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createPairingSession, checkPairingStatus } from '../api/pairing';
import type { PairingSession, PairingStatus } from '../types';

const QR_SIZE = 240;
const POLL_INTERVAL_MS = 2500;

export function QRPairingPanel() {
    const [session, setSession] = useState<PairingSession | null>(null);
    const [status, setStatus] = useState<PairingStatus>('idle');
    const [secondsLeft, setSecondsLeft] = useState(0);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimers = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startSession = useCallback(async () => {
        clearTimers();
        setStatus('loading');
        setSession(null);
        try {
            const s = await createPairingSession();
            setSession(s);
            setStatus('ready');
            setSecondsLeft(Math.round((s.expiresAt - Date.now()) / 1000));

            // Countdown timer
            timerRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearTimers();
                        setStatus('expired');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Poll for connection
            pollRef.current = setInterval(async () => {
                try {
                    const { connected } = await checkPairingStatus(s.sessionId);
                    if (connected) {
                        clearTimers();
                        setStatus('connected');
                    }
                } catch {
                    // ignore transient poll errors
                }
            }, POLL_INTERVAL_MS);
        } catch {
            setStatus('error');
        }
    }, []);

    // Auto-start on mount
    useEffect(() => {
        startSession();
        return clearTimers;
    }, [startSession]);

    // If no backend yet — use a demo payload so the QR is always visible
    const demoPayload = `cognivox://pair?session=demo-${Date.now()}`;
    const qrValue = session?.qrPayload ?? demoPayload;

    return (
        <div className="flex flex-col items-center gap-4">
            {/* QR code canvas */}
            <div className="relative flex items-center justify-center rounded-2xl border border-border bg-white p-5 shadow-sm">
                {status === 'loading' && (
                    <div
                        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/90"
                        style={{ width: QR_SIZE + 40, height: QR_SIZE + 40 }}
                    >
                        <svg className="h-10 w-10 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    </div>
                )}

                {status === 'expired' && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm"
                        style={{ width: QR_SIZE + 40, height: QR_SIZE + 40 }}
                    >
                        <p className="text-sm font-medium text-foreground">QR code expired</p>
                        <button
                            onClick={startSession}
                            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                            Refresh
                        </button>
                    </div>
                )}

                {status === 'connected' && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-50/95"
                        style={{ width: QR_SIZE + 40, height: QR_SIZE + 40 }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-emerald-700">Device connected!</p>
                    </div>
                )}

                <QRCodeSVG
                    value={qrValue}
                    size={QR_SIZE}
                    marginSize={2}
                    level="M"
                    className={status === 'expired' || status === 'connected' ? 'opacity-20 blur-sm' : ''}
                />
            </div>

            {/* Countdown */}
            {status === 'ready' && secondsLeft > 0 && (
                <p className="text-xs text-muted-foreground">
                    QR refreshes in{' '}
                    <span className={secondsLeft <= 10 ? 'font-semibold text-destructive' : 'font-medium'}>
                        {secondsLeft}s
                    </span>
                </p>
            )}

            {status === 'error' && (
                <p className="text-xs text-destructive">
                    Could not reach the server.{' '}
                    <button onClick={startSession} className="underline hover:no-underline">
                        Try again
                    </button>
                </p>
            )}
        </div>
    );
}
