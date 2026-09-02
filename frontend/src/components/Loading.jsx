import "./Loading.css";

function Loading({ message = "Analyzing environmental conditions..." }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading__spinner" aria-hidden="true"></div>
      <p className="loading__message">{message}</p>
    </div>
  );
}

export default Loading;