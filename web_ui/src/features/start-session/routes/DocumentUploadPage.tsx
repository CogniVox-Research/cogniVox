import { useState, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { StepIndicator } from "../components/StepIndicator";
import { useSessionSetup } from "../context/SessionSetupContext";
import Session from "@/lib/session";
import { useSession } from "@/hooks/use-session";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ ext }: { ext: string }) {
  if (ext === "pdf") {
    return (
      <svg
        className="h-8 w-8 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-8 w-8 text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

export function DocumentUploadPage() {
  const navigate = useNavigate();
  const { config, document: uploadedDoc, setDocument } = useSessionSetup();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setSession } = useSession();

  const validateAndSet = useCallback(
    (file: File) => {
      setError(null);
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf" && ext !== "txt") {
        setError("Only PDF and plain text (.txt) files are accepted.");
        return;
      }
      setDocument(file);
    },
    [setDocument],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSet(file);
    },
    [validateAndSet],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
    e.target.value = "";
  };

  const handleStartSession = () => {
    if (!uploadedDoc) return;
    const session = Session.connect(config, uploadedDoc);
    session.then((s) => {
      setSession(s);
      navigate({ to: "/app/session/play/$id", params: { id: s.session_id } });
    });
  };

  const ext = uploadedDoc?.name.split(".").pop()?.toLowerCase() ?? "";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <StepIndicator current={3} />

      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Upload Document
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your speech script or topic document. Accepted formats: PDF,
          TXT.
        </p>
      </div>

      <fieldset className="space-y-6 rounded-xl border border-border p-1">
        <legend className="sr-only">Document upload</legend>

        <div className="px-5 pt-5">
          {/* Drop zone */}
          {!uploadedDoc ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={[
                "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-16 text-center cursor-pointer transition-all duration-200",
                dragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
              ].join(" ")}
            >
              {/* Upload icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Drop your file here, or{" "}
                  <span className="text-primary underline underline-offset-2">
                    browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF or TXT &mdash; required to start the session
                </p>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          ) : (
            /* Uploaded file card */
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 px-5 py-4">
              <FileIcon ext={ext} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {uploadedDoc.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(uploadedDoc.size)} &middot; {ext.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setDocument(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove file"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                />
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between border-t border-border px-5 py-5">
          <button
            onClick={() => {
              if (config.environment === "interview") {
                navigate({ to: "/app/session/new/start" });
              } else {
                navigate({ to: "/app/session/new/options" });
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </button>
          <button
            onClick={handleStartSession}
            disabled={!uploadedDoc}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
            Start Session
          </button>
        </div>
      </fieldset>
    </main>
  );
}
