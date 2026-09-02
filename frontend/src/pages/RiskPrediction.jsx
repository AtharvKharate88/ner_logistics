import { useState } from "react";
import { getSegmentRisk } from "../services/riskApi";
import "./RiskPrediction.css";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

const ROAD_SEGMENTS = [
  { value: "", label: "Select road" },
  { value: "road_1", label: "road_1" },
  { value: "road_2", label: "road_2" },
  { value: "road_3", label: "road_3" },
];

/**
 * Map an API-provided risk level onto a presentation-only CSS modifier.
 * This does NOT classify risk — the API's riskLevel string is the source
 * of truth; this only picks which existing palette color renders it.
 */
function levelModifier(riskLevel) {
  const normalized = typeof riskLevel === "string" ? riskLevel.toLowerCase() : "";
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return "unknown";
}

export default function RiskPrediction() {
  const [roadSegment, setRoadSegment] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [validation, setValidation] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [riskData, setRiskData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Single API request path shared by the form submit and the error retry,
   * so the request logic is never duplicated.
   */
  async function checkRisk(segmentId, targetDate) {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const data = await getSegmentRisk(segmentId, targetDate);
      setRiskData(data);
      setStatus("success");
    } catch {
      setRiskData(null);
      setErrorMessage(
        "We couldn't retrieve the risk assessment right now. Please try again.",
      );
      setStatus("error");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!roadSegment) {
      setValidation("Please select a road segment.");
      return;
    }
    if (!date) {
      setValidation("Please select a date.");
      return;
    }

    setValidation(null);
    checkRisk(roadSegment, date);
  }

  function handleRetry() {
    checkRisk(roadSegment, date);
  }

  const isLoading = status === "loading";

  return (
    <main className="risk-page">
      <div className="risk-page__container">
        <header className="risk-page__header">
          <h1>ENVIRONMENTAL RISK PREDICTION</h1>
          <p className="risk-page__subtitle">
            Select a road segment and date to begin the risk assessment.
          </p>
        </header>

        <section className="risk-page__card" aria-label="Prediction form">
          <h2 className="risk-page__card-title">Prediction Request</h2>
          <form className="risk-page__form" onSubmit={handleSubmit} noValidate>
            <div className="risk-page__field">
              <label className="risk-page__label" htmlFor="risk-road-segment">
                Road Segment / Location
              </label>
              <select
                id="risk-road-segment"
                className="risk-page__input risk-page__select"
                value={roadSegment}
                onChange={(e) => setRoadSegment(e.target.value)}
                disabled={isLoading}
              >
                {ROAD_SEGMENTS.map((segment) => (
                  <option
                    key={segment.value}
                    value={segment.value}
                    disabled={segment.value === ""}
                    hidden={segment.value === ""}
                  >
                    {segment.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="risk-page__field">
              <label className="risk-page__label" htmlFor="risk-date">
                Date
              </label>
              <input
                id="risk-date"
                className="risk-page__input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="risk-page__actions">
              <button
                type="submit"
                className="risk-page__button"
                disabled={isLoading}
              >
                {isLoading ? "CHECKING…" : "CHECK RISK"}
              </button>
            </div>
          </form>

          {validation && (
            <p className="risk-page__validation" role="alert">
              {validation}
            </p>
          )}
        </section>

        {isLoading && (
          <p className="risk-page__loading" role="status" aria-live="polite">
            Assessing environmental risk…
          </p>
        )}

        {status === "error" && (
          <section
            className="risk-page__card risk-page__card--error"
            role="alert"
          >
            <h2 className="risk-page__card-title">Assessment Unavailable</h2>
            <p className="risk-page__error-message">{errorMessage}</p>
            <div className="risk-page__error-actions">
              <button
                type="button"
                className="risk-page__button risk-page__button--secondary"
                onClick={handleRetry}
              >
                TRY AGAIN
              </button>
            </div>
          </section>
        )}

        {status === "success" && riskData && (
          <section
            className="risk-page__card risk-page__result"
            aria-label="Risk result"
            aria-live="polite"
          >
            <h2 className="risk-page__card-title">ENVIRONMENTAL RISK</h2>

            {riskData.riskAvailable &&
              riskData.riskScore !== undefined &&
              riskData.riskScore !== null ? (
              <div className="risk-page__result-body">
                <div className="risk-page__score-block">
                  <span className="risk-page__score-value">
                    {riskData.riskScore}
                  </span>
                  <span
                    className={`risk-page__level risk-page__level--${levelModifier(riskData.riskLevel)}`}
                  >
                    {riskData.riskLevel ?? "UNKNOWN"}
                  </span>
                </div>
                <p className="risk-page__result-caption">
                  AI-derived environmental risk
                </p>
              </div>
            ) : (
              <p className="risk-page__result-caption">
                {riskData.message ||
                  "Risk data is unavailable for this road segment and date."}
              </p>
            )}
          </section>
        )}

        {status === "success" && riskData?.riskAvailable && (
          <section className="environmental-indicators">
            <div className="environmental-indicators__header">
              <p className="environmental-indicators__eyebrow">
                ENVIRONMENTAL INDICATORS
              </p>

              <h2>Environmental indicators</h2>

              <p>
                AI-derived environmental anomaly detected for the selected
                road segment and date.
              </p>
            </div>

            <div className="environmental-indicators__grid">
              <article className="indicator-card">
                <span className="indicator-card__label">
                  Environmental anomaly score
                </span>

                <strong className="indicator-card__value">
                  {Number(riskData.anomalyScore).toFixed(2)}
                </strong>

                <span className="indicator-card__unit">
                  AI-derived anomaly
                </span>
              </article>
            </div>
          </section>
        )}

        {status === "success" && riskData?.riskAvailable && (
          <section className="risk-explanation">
            <p className="risk-explanation__eyebrow">
              RISK EXPLANATION
            </p>

            <h2>
              WHY IS THIS RISK {riskData.riskLevel}?
            </h2>

            <p className="risk-explanation__summary">
              The model detected an unusual combination of environmental
              conditions for this road segment.
            </p>

            <p className="risk-explanation__disclaimer">
              AI-derived environmental risk. This is not a probability of road closure.
            </p>

            <div className="risk-explanation__indicators">
              <h3>Key indicator:</h3>

              <ul>
                <li>
                  Environmental anomaly score:{" "}
                  {Number(riskData.anomalyScore).toFixed(2)}
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
