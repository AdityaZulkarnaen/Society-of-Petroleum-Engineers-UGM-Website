"use client";

import { useEffect, useRef } from "react";

export function SubmissionDialog({ stage }: { stage: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const upload = /^Uploading document (\d+) of (\d+)/.exec(stage);
  const total = upload ? Number(upload[2]) : 0;
  // The current document is still uploading; count only completed requests.
  const completed = upload ? Math.max(0, Number(upload[1]) - 1) : 0;
  const determinate = total > 0 && completed < total;
  const finalizing = stage.startsWith("Finalizing");
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.focus({ preventScroll: true });
    const preventLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", preventLeaving);
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      window.removeEventListener("beforeunload", preventLeaving);
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby="submission-title"
      aria-describedby="submission-progress submission-help"
      aria-busy="true"
      onCancel={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        // This progress-only dialog has no interactive controls to tab through.
        if (event.key === "Tab") {
          event.preventDefault();
          dialog.current?.focus({ preventScroll: true });
        }
      }}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-[#d2cbfa] bg-white p-6 text-ink shadow-xl outline-none backdrop:bg-ink/40 sm:p-8"
    >
      <div aria-hidden="true" className="mb-5 size-8 rounded-full border-4 border-[#ebe6ff] border-t-iris motion-safe:animate-spin" />
      <h2 id="submission-title" className="font-display text-xl font-semibold">Submitting your application</h2>
      <p id="submission-progress" role="status" aria-live="polite" aria-atomic="true" className="mt-3 font-medium text-iris">{stage}</p>
      <div
        role="progressbar"
        aria-label={determinate ? "Document uploads" : "Application processing"}
        aria-valuemin={0}
        aria-valuemax={determinate ? total : undefined}
        aria-valuenow={determinate ? completed : undefined}
        aria-valuetext={determinate ? `${completed} of ${total} documents uploaded. ${stage}` : stage}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#ebe6ff]"
      >
        <div
          aria-hidden="true"
          className={`h-full rounded-full bg-iris ${determinate ? "motion-safe:transition-[width] motion-safe:duration-300" : "w-1/3 motion-safe:animate-pulse"}`}
          style={determinate ? { width: `${completed / total * 100}%` } : undefined}
        />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {determinate ? `${completed} of ${total} documents uploaded` : finalizing ? "Uploads complete. Waiting for confirmation." : "Preparing your documents."}
      </p>
      <p id="submission-help" className="mt-4 text-sm leading-relaxed text-ink-soft">Please keep this page open. Your documents are uploaded one at a time, then your application is finalized.</p>
    </dialog>
  );
}
