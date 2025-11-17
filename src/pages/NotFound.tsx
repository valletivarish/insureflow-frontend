import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <div style={{ padding: "var(--space-xxl)", textAlign: "center" }}>
    <h1 style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>404</h1>
    <p style={{ marginBottom: "var(--space-lg)", color: "var(--color-text-muted)" }}>
      The page you are looking for could not be found.
    </p>
    <Link to="/dashboard">Return to dashboard</Link>
  </div>
);
