"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
