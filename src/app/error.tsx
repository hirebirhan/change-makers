"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
      <p className="text-sm text-muted-foreground">
        {error.message || "Something went wrong loading your dashboard data."}
      </p>
      <button
        onClick={reset}
        className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
      >
        Try again
      </button>
    </div>
  );
}
