import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { registerUser } from '../api/auth';

const registerSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterFormProps = {
    onSuccess?: () => void;
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setServerError(null);
        setIsLoading(true);
        try {
            await registerUser(data);
            onSuccess?.();
        } catch (err) {
            setServerError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {serverError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                    {serverError}
                </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                    Username
                </label>
                <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="john_doe"
                    {...register('username')}
                    className={inputClass}
                />
                {errors.username && (
                    <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className={inputClass}
                />
                {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={inputClass}
                />
                {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                    Min. 8 characters, one uppercase letter and one number.
                </p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Creating account…
                    </span>
                ) : (
                    'Create account'
                )}
            </button>
        </form>
    );
}
