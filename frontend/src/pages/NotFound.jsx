import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main
      style={{
        padding: "var(--space-8)",
        textAlign: "center",
      }}
    >
      <h1>404</h1>

      <p
        style={{
          color: "var(--color-text-secondary)",
          marginTop: "var(--space-2)",
        }}
      >
        Page not found.
      </p>

      <Link
        to="/"
        style={{
          display: "inline-block",
          marginTop: "var(--space-6)",
          color: "var(--color-primary)",
        }}
      >
        Go back home
      </Link>
    </main>
  );
}

export default NotFound;