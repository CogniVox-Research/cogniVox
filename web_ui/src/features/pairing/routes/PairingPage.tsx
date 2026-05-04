import { QRPairingPanel } from '../components/QRPairingPanel';

const steps = [
    {
        number: 1,
        title: 'Open CogniVox on your phone',
        description: 'Launch the CogniVox mobile app on your Android or iOS device.',
    },
    {
        number: 2,
        title: 'Tap "Connect to PC"',
        description: 'Find the Connect option in the app menu or home screen.',
    },
    {
        number: 3,
        title: 'Scan the QR code',
        description: 'Point your phone camera at the QR code on this screen to pair instantly.',
    },
];

export function PairingPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-4xl">

                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">CogniVox</h1>
                    <p className="mt-1 text-sm text-muted-foreground">VR public speaking platform</p>
                </div>

                {/* Main card */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col sm:flex-row">

                        {/* ── Left: instructions ─────────────────────────────────────── */}
                        <div className="flex flex-col justify-center gap-8 border-b border-border px-8 py-10 sm:w-1/2 sm:border-b-0 sm:border-r">
                            <div>
                                <h2 className="text-xl font-semibold text-card-foreground">Connect your phone</h2>
                                <p className="mt-1.5 text-sm text-muted-foreground">
                                    Pair your mobile device with this PC in seconds. Once connected, your phone
                                    acts as a real-time biometric sensor during VR sessions.
                                </p>
                            </div>

                            <ol className="space-y-6">
                                {steps.map((step) => (
                                    <li key={step.number} className="flex items-start gap-4">
                                        {/* Step number pill */}
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                            {step.number}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-card-foreground">{step.title}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>

                            <p className="text-xs text-muted-foreground">
                                Make sure your phone and this computer are on the same Wi-Fi network.
                            </p>
                        </div>

                        {/* ── Right: QR code ──────────────────────────────────────────── */}
                        <div className="flex flex-col items-center justify-center gap-4 px-8 py-10 sm:w-1/2">
                            <p className="text-sm font-medium text-card-foreground">Scan with your phone</p>
                            <QRPairingPanel />

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
