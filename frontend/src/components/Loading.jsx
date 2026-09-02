import "./Loading.css";

/**
 * Shared loading indicator for long-running API work (route planning, etc.).
 */
function Loading({
  message = "Analyzing available routes...",
  detail = "Comparing distance, risk coverage, and route reliability.",
  fullPage = false,
}) {
  return (
    <div
      className={`loading${fullPage ? " loading--full" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading__panel">
        <div className="loading__orb" aria-hidden="true">
          <span className="loading__ring" />
          <span className="loading__ring loading__ring--delay" />
          <span className="loading__core" />
        </div>
        <p className="loading__message">{message}</p>
        {detail ? <p className="loading__detail">{detail}</p> : null}
      </div>
    </div>
  );
}

export default Loading;
