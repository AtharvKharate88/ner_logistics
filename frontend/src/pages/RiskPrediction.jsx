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

/**
 * Format a numeric API value for display. Returns "Data unavailable"
 * for null, undefined, or non-finite values — never fabricates data.
 */
function formatMetric(value, digits, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Data unavailable";
  }
  return `${Number(value).toFixed(digits)}${unit ? ` ${unit}` : ""}`;
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
                    {formatMetric(riskData.riskScore, 1)}
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
                {riskData.anomalyScore !== undefined &&
                  riskData.anomalyScore !== null && (
                    <p className="risk-page__anomaly">
                      Anomaly score: {formatMetric(riskData.anomalyScore, 2)}
                    </p>
                  )}
              </div>
            ) : (
              <p className="risk-page__result-caption">
                {riskData.message ||
                  "Risk data is unavailable for this road segment and date."}
              </p>
            )}
          </section>
        )}

        {status === "success" && riskData && riskData.riskAvailable && (
          <div className="risk-page__details">
            <section
              className="risk-page__card environmental-indicators"
              aria-label="Environmental indicators"
            >
              <h2 className="risk-page__card-title">
                Environmental Indicators
              </h2>
              <div className="environmental-indicators__grid">
                <div className="indicator-card">
                  <p className="indicator-card__label">Anomaly Score</p>
                  <p className="indicator-card__value">
                    {formatMetric(riskData.anomalyScore, 2)}
                  </p>
                </div>
                <div className="indicator-card">
                  <p className="indicator-card__label">Rainfall (1 day)</p>
                  <p className="indicator-card__value">
                    {formatMetric(riskData.rainfall_1d, 1, "mm")}
                  </p>
                </div>
                <div className="indicator-card">
                  <p className="indicator-card__label">Rainfall (3 days)</p>
                  <p className="indicator-card__value">
                    {formatMetric(riskData.rainfall_3d, 1, "mm")}
                  </p>
                </div>
                <div className="indicator-card">
                  <p className="indicator-card__label">Rainfall (7 days)</p>
                  <p className="indicator-card__value">
                    {formatMetric(riskData.rainfall_7d, 1, "mm")}
                  </p>
                </div>
                <div className="indicator-card">
                  <p className="indicator-card__label">Slope</p>
                  <p className="indicator-card__value">
                    {formatMetric(riskData.slope, 1, "°")}
                  </p>
                </div>
                <div className="indicator-card">
                  <p className="indicator-card__label">
                    Landslides within 5 km
                  </p>
                  <p className="indicator-card__value">
                    {formatMetric(riskData.landslides_5km, 0)}
                  </p>
                </div>
              </div>
            </section>

            <section
              className="risk-page__card risk-explanation"
              aria-label="Risk explanation"
            >
              <h2 className="risk-page__card-title">Risk Explanation</h2>
              <p className="risk-explanation__text">
                The environmental risk for this road segment on the selected
                date is assessed as{" "}
                <strong>{riskData.riskLevel ?? "UNKNOWN"}</strong>. This
                assessment is derived from recent rainfall (1-, 3-, and 7-day
                accumulations), terrain slope, recorded landslides within 5
                km, and the anomaly score of current conditions relative to
                historical patterns.
              </p>
              <p className="risk-explanation__text">
                Key indicators: rainfall 1d{" "}
                {formatMetric(riskData.rainfall_1d, 1, "mm")}, rainfall 3d{" "}
                {formatMetric(riskData.rainfall_3d, 1, "mm")}, rainfall 7d{" "}
                {formatMetric(riskData.rainfall_7d, 1, "mm")}, slope{" "}
                {formatMetric(riskData.slope, 1, "°")}, landslides within 5
                km {formatMetric(riskData.landslides_5km, 0)}, anomaly score{" "}
                {formatMetric(riskData.anomalyScore, 2)}.
              </p>
              <p className="risk-explanation__text risk-explanation__disclaimer">
                This is an AI-derived environmental risk assessment and
                should not be interpreted as a road-closure probability.
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
