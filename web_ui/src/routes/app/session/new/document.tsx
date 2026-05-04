import { DocumentUploadPage } from "@/features/start-session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/session/new/document")({
  component: RouteComponent,
});

function RouteComponent() {
  return <DocumentUploadPage />;
}
