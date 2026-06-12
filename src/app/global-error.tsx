"use client";

// Catches errors in the root layout itself (rare but catastrophic).
// This has no access to the root layout, so it provides its own <html>.
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (error.digest) console.error("Global error:", error.digest);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Something went wrong — Conduit AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body { margin: 0; font-family: system-ui, sans-serif; background: #0A0908; color: #F5F1EA; }
          main { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; text-align: center; }
          h1 { font-size: 2rem; font-weight: 600; margin: 0 0 0.75rem; }
          p { color: #8C8884; margin: 0 0 2rem; max-width: 30rem; }
          button { cursor: pointer; padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; background: #FF8A3D; border: none; color: #fff; }
          button:hover { opacity: 0.85; }
        `}</style>
      </head>
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>An unexpected error prevented the app from loading. Please refresh the page.</p>
          <button onClick={reset}>Refresh</button>
        </main>
      </body>
    </html>
  );
}
