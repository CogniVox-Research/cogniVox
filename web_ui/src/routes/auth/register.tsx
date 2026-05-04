import { RegisterForm } from "@/features/auth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/register")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate({ to: "/auth/login" });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          Create an account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Join CogniVox to start learning public speaking.
        </p>
      </div>

      <RegisterForm onSuccess={handleSuccess} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/auth/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
