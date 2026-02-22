import type { PairingSession } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Request a new pairing session from the backend.
 * The backend should return a unique payload string to encode into the QR.
 */
export async function createPairingSession(): Promise<PairingSession> {
    const response = await fetch(`${API_BASE_URL}/pairing/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Failed to create pairing session');
    }

    return response.json();
}

/**
 * Poll the backend to check if the mobile has scanned the QR and connected.
 */
export async function checkPairingStatus(sessionId: string): Promise<{ connected: boolean }> {
    const response = await fetch(`${API_BASE_URL}/pairing/session/${sessionId}/status`);

    if (!response.ok) {
        throw new Error('Failed to check pairing status');
    }

    return response.json();
}
