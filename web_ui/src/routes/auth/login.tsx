import { LoginForm } from "@/features/auth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back — login to continue.
        </p>
      </div>

      <LoginForm onSuccess={handleSuccess} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          to="/auth/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
