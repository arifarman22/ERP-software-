"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-md">
        Retry
      </button>
    </div>
  );
}
