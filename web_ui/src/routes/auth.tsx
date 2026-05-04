import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
  beforeLoad: (e) => {
    if (e.location.pathname.replaceAll("/", "") == "auth") {
      throw redirect({ to: "/auth/login" });
    }
  },
});

function RouteComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            CogniVox
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            VR public speaking platform
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
