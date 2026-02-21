import { Link } from '@tanstack/react-router';
import { RegisterForm } from '../components/RegisterForm';
import { useNavigate } from '@tanstack/react-router';

export function RegisterPage() {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate({ to: '/login' });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">CogniVox</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        VR public speaking platform
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-card-foreground">Create an account</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Join CogniVox to start learning public speaking.
                        </p>
                    </div>

                    <RegisterForm onSuccess={handleSuccess} />

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
