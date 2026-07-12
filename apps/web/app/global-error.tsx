"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f5f4ef",
          color: "#1d211f",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}
      >
        <main
          style={{ margin: "0 auto", maxWidth: "42rem", padding: "12vh 2rem" }}
        >
          <p
            style={{
              color: "#666a65",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Loura Knowledge Atlas
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              letterSpacing: "-0.04em",
            }}
          >
            The workspace could not load.
          </h1>
          <p style={{ color: "#666a65", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Nothing has been changed. Try loading the workspace again in a
            moment.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#1d211f",
              border: 0,
              borderRadius: "0.4rem",
              color: "white",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 700,
              marginTop: "1rem",
              padding: "0.75rem 1rem",
            }}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
