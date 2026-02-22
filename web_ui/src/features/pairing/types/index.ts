export type PairingSession = {
    sessionId: string;
    qrPayload: string;    // the string encoded into the QR
    expiresAt: number;    // unix timestamp (ms)
};

export type PairingStatus = 'idle' | 'loading' | 'ready' | 'connected' | 'expired' | 'error';
