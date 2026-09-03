import {
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import RouteMap from
  "../components/route-planner/RouteMap";

import {
  normalizeRiskLevel,
} from "../utils/routeFormat";

import "./RiskPrediction.css";


// Format distance
function formatDistance(
  distance
) {
  const value =
    Number(distance);

  if (
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${Math.round(value)} km`;
}


// Format route duration
function formatDuration(
  hours
) {
  const value =
    Number(hours);

  if (
    !Number.isFinite(value)
  ) {
    return "—";
  }

  const totalMinutes =
    Math.round(
      value * 60
    );

  const hourValue =
    Math.floor(
      totalMinutes / 60
    );

  const minuteValue =
    totalMinutes % 60;

  if (
    hourValue <= 0
  ) {
    return `${minuteValue}m`;
  }

  if (
    minuteValue === 0
  ) {
    return `${hourValue}h`;
  }

  return `${hourValue}h ${minuteValue}m`;
}


// Format risk score
function formatRiskScore(
  score
) {
  const value =
    Number(score);

  if (
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toFixed(1);
}


// Get readable risk level
function getRiskLevel(
  route
) {
  return normalizeRiskLevel(
    route?.risk?.level
  );
}


// Get CSS class for risk
function getRiskClass(
  level
) {
  if (
    level === "HIGH"
  ) {
    return "risk-high";
  }

  if (
    level === "MEDIUM"
  ) {
    return "risk-medium";
  }

  return "risk-low";
}


function RiskPrediction() {

  const location =
    useLocation();

  const navigate =
    useNavigate();


  // Route data transferred from Route Planner
  const routeData =
    location.state?.routeData ||
    null;


  // Select recommended route initially
  const [
    selectedRouteId,
    setSelectedRouteId,
  ] = useState(
    routeData?.recommendedRouteId ||
    routeData?.routes?.[0]?.routeId ||
    null
  );


  // Protect against direct navigation or refresh
  if (
    !routeData ||
    !Array.isArray(
      routeData.routes
    ) ||
    !routeData.routes.length
  ) {
    return (
      <div
        className="
          risk-prediction
        "
      >

        <div
          className="
            risk-prediction__main
          "
        >

          <section
            className="
              risk-prediction__empty
            "
          >

            <span
              className="
                risk-prediction__eyebrow
              "
            >
              Route Analysis
            </span>

            <h1>
              No Route Data Available
            </h1>

            <p>
              Generate a route first
              before analyzing route
              risks.
            </p>

            <button
              type="button"

              onClick={() =>
                navigate(
                  "/route-planner"
                )
              }
            >
              Go to Route Planner
            </button>

          </section>

        </div>

      </div>
    );
  }


  const routes =
    routeData.routes;


  // Selected route data
  const selectedRoute =
    useMemo(() => {
      return (
        routes.find(
          (route) =>
            route.routeId ===
            selectedRouteId
        ) ||
        routes[0]
      );
    }, [
      routes,
      selectedRouteId,
    ]);


  const selectedRiskLevel =
    getRiskLevel(
      selectedRoute
    );


  const selectedIncidents =
    selectedRoute
      ?.currentIncidents ||
    [];


  const recommendedRouteId =
    routeData.recommendedRouteId;


  const recommendedReason =
    routeData.recommendedReason ||
    routeData.analysis
      ?.summary ||
    "This route was selected by the route engine based on the configured distance and risk trade-off.";


  const analysisReasons =
    routeData.analysis
      ?.reasons || [];


  return (
    <div
      className="
        risk-prediction
      "
    >

      <main
        className="
          risk-prediction__main
        "
      >

        {/* =================================
            PAGE HEADER
        ================================= */}

        <header
          className="
            risk-prediction__header
          "
        >

          <div>

            <p
              className="
                risk-prediction__eyebrow
              "
            >
              Logistics Intelligence
            </p>

            <h1>
              Risk Prediction
            </h1>

            <p
              className="
                risk-prediction__subtitle
              "
            >
              Compare environmental
              risks across available
              transportation corridors
              before selecting the
              safest route.
            </p>

          </div>


          <button
            type="button"

            className="
              risk-prediction__back
            "

            onClick={() =>
              navigate(
                "/route-planner"
              )
            }
          >
            ← Plan Another Route
          </button>

        </header>


        {/* =================================
            ROUTE SUMMARY
        ================================= */}

        <section
          className="
            risk-prediction__summary
          "
        >

          <div
            className="
              risk-prediction__summary-item
            "
          >

            <span>
              Origin
            </span>

            <strong>
              {
                routeData.origin
              }
            </strong>

          </div>


          <div
            className="
              risk-prediction__summary-arrow
            "
          >
            →
          </div>


          <div
            className="
              risk-prediction__summary-item
            "
          >

            <span>
              Destination
            </span>

            <strong>
              {
                routeData.destination
              }
            </strong>

          </div>


          <div
            className="
              risk-prediction__summary-item
            "
          >

            <span>
              Departure
            </span>

            <strong>
              {
                routeData.departureDate ||
                "—"
              }
            </strong>

          </div>


          <div
            className="
              risk-prediction__summary-item
            "
          >

            <span>
              Cargo
            </span>

            <strong>
              {
                routeData.cargoType ||
                "—"
              }
            </strong>

          </div>


          <div
            className="
              risk-prediction__summary-item
            "
          >

            <span>
              Vehicle
            </span>

            <strong>
              {
                routeData.vehicleType ||
                "—"
              }
            </strong>

          </div>

        </section>


        {/* =================================
            MAP
        ================================= */}

        <section
          className="
            risk-prediction__map-section
          "
        >

          <div
            className="
              risk-prediction__section-heading
            "
          >

            <div>

              <h2>
                Route Overview
              </h2>

              <p>
                Select a route below
                to highlight it on the
                map.
              </p>

            </div>


            <div
              className="
                risk-prediction__legend
              "
            >

              <span>
                <i
                  className="
                    risk-prediction__legend-dot
                    risk-prediction__legend-dot--recommended
                  "
                />

                Recommended
              </span>

              <span>
                <i
                  className="
                    risk-prediction__legend-dot
                    risk-prediction__legend-dot--alternative
                  "
                />

                Alternatives
              </span>

            </div>

          </div>


          <div
            className="
              risk-prediction__map
            "
          >

            <RouteMap
              routes={routes}

              selectedRouteId={
                selectedRouteId
              }

              recommendedRouteId={
                recommendedRouteId
              }

              originLabel={
                routeData.origin
              }

              destinationLabel={
                routeData.destination
              }

              originCoordinates={
                routeData.originCoordinates
              }

              destinationCoordinates={
                routeData.destinationCoordinates
              }
            />

          </div>

        </section>


        {/* =================================
            ROUTE RESULTS
        ================================= */}

        <section
          className="
            risk-prediction__results
          "
        >

          <div
            className="
              risk-prediction__section-heading
            "
          >

            <div>

              <h2>
                Route Results
              </h2>

              <p>
                Compare corridors and
                their environmental
                risk.
              </p>

            </div>

          </div>


          <div
            className="
              risk-prediction__route-grid
            "
          >

            {routes.map(
              (route) => {

                const isSelected =
                  route.routeId ===
                  selectedRouteId;

                const isRecommended =
                  route.routeId ===
                  recommendedRouteId;

                const riskLevel =
                  getRiskLevel(
                    route
                  );

                const riskClass =
                  getRiskClass(
                    riskLevel
                  );

                const incidents =
                  route.currentIncidents ||
                  [];


                return (

                  <button
                    type="button"

                    key={
                      route.routeId
                    }

                    className={`
                      risk-prediction__route-card
                      ${
                        isSelected
                          ? "risk-prediction__route-card--selected"
                          : ""
                      }
                    `}

                    onClick={() =>
                      setSelectedRouteId(
                        route.routeId
                      )
                    }
                  >

                    {/* Card header */}
                    <div
                      className="
                        risk-prediction__route-card-header
                      "
                    >

                      <strong>

                        {isRecommended
                          ? "★ RECOMMENDED ROUTE"
                          : route.routeId.toUpperCase()
                        }

                      </strong>


                      <span
                        className={`
                          risk-prediction__risk-badge
                          ${riskClass}
                        `}
                      >
                        Risk:
                        {" "}
                        {riskLevel}
                      </span>

                    </div>


                    {/* Route metrics */}
                    <div
                      className="
                        risk-prediction__metrics
                      "
                    >

                      <div>

                        <span>
                          Distance
                        </span>

                        <strong>
                          {
                            formatDistance(
                              route.distanceKm
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Duration
                        </span>

                        <strong>
                          {
                            formatDuration(
                              route.estimatedTimeHours
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Risk Score
                        </span>

                        <strong>
                          {
                            formatRiskScore(
                              route.risk?.score
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Risk Coverage
                        </span>

                        <strong>
                          {Math.round(
                            route.risk
                              ?.coveragePercent ||
                              0
                          )}
                          %
                        </strong>

                      </div>

                    </div>


                    {/* High risk segment count */}
                    <div
                      className="
                        risk-prediction__segment-info
                      "
                    >

                      <span>
                        High-Risk Segments
                      </span>

                      <strong>
                        {
                          route.risk
                            ?.highRiskSegmentCount ??
                          "—"
                        }
                      </strong>

                    </div>


                    {/* Current incidents */}
                    {incidents.length > 0 ? (

                      <div
                        className="
                          risk-prediction__incident
                        "
                      >

                        <div
                          className="
                            risk-prediction__incident-title
                          "
                        >
                          ⚠ Current incident
                          reported
                        </div>


                        <div
                          className="
                            risk-prediction__incident-details
                          "
                        >

                          <span>

                            {
                              incidents[0]
                                ?.type
                            }

                            {" • "}

                            {
                              incidents[0]
                                ?.severity
                            }

                          </span>


                          <span>

                            +{
                              incidents.length - 1
                            }

                            {" more"}

                          </span>

                        </div>

                      </div>

                    ) : (

                      <div
                        className="
                          risk-prediction__no-incident
                        "
                      >
                        ✓ No active field
                        incidents reported
                      </div>

                    )}


                    {/* Selection state */}
                    <div
                      className="
                        risk-prediction__selection
                      "
                    >

                      {isSelected
                        ? "✓ SELECTED ON MAP"
                        : "VIEW ON MAP"
                      }

                    </div>

                  </button>

                );

              }
            )}

          </div>

        </section>


        {/* =================================
            WHY THIS ROUTE
        ================================= */}

        <section
          className="
            risk-prediction__why
          "
        >

          <div
            className="
              risk-prediction__section-heading
            "
          >

            <div>

              <h2>
                Why This Route?
              </h2>

              <p>
                Route intelligence
                from the planning
                engine for
                {" "}
                {
                  selectedRoute
                    ?.routeId
                }.
              </p>

            </div>

          </div>


          <div
            className="
              risk-prediction__why-card
            "
          >

            <p
              className="
                risk-prediction__reason-summary
              "
            >
              {
                recommendedReason
              }
            </p>


            {analysisReasons.length > 0 ? (

              <ul
                className="
                  risk-prediction__reason-list
                "
              >

                {analysisReasons.map(
                  (
                    reason,
                    index
                  ) => (

                    <li
                      key={index}
                    >
                      ✓
                      <span>
                        {reason}
                      </span>
                    </li>

                  )
                )}

              </ul>

            ) : (

              <ul
                className="
                  risk-prediction__reason-list
                "
              >

                <li>
                  ✓
                  <span>
                    Risk level:
                    {" "}
                    {
                      selectedRiskLevel
                    }
                  </span>
                </li>


                <li>
                  ✓
                  <span>
                    Risk coverage:
                    {" "}
                    {Math.round(
                      selectedRoute
                        ?.risk
                        ?.coveragePercent ||
                        0
                    )}
                    %
                  </span>
                </li>


                <li>
                  ✓
                  <span>
                    High-risk segments:
                    {" "}
                    {
                      selectedRoute
                        ?.risk
                        ?.highRiskSegmentCount ||
                      0
                    }
                  </span>
                </li>

              </ul>

            )}

          </div>

        </section>


        {/* =================================
            CURRENT INCIDENTS
        ================================= */}

        {selectedIncidents.length > 0 ? (

          <section
            className="
              risk-prediction__incidents
            "
          >

            <div
              className="
                risk-prediction__section-heading
              "
            >

              <div>

                <h2>
                  Current Field Incidents
                </h2>

                <p>
                  Reports submitted
                  by field officers
                  near this route.
                </p>

              </div>

            </div>


            <div
              className="
                risk-prediction__incident-list
              "
            >

              {selectedIncidents.map(
                (incident) => (

                  <article
                    key={
                      incident.incidentId
                    }

                    className="
                      risk-prediction__incident-card
                    "
                  >

                    <div>

                      <span
                        className="
                          risk-prediction__incident-type
                        "
                      >
                        ⚠
                        {" "}
                        {
                          incident.type
                        }
                      </span>

                      <h3>
                        {
                          incident.description ||
                          "Field incident reported."
                        }
                      </h3>

                    </div>


                    <div
                      className="
                        risk-prediction__incident-meta
                      "
                    >

                      <span>
                        Severity:
                        {" "}
                        <strong>
                          {
                            incident.severity
                          }
                        </strong>
                      </span>


                      <span>
                        Distance from
                        route:
                        {" "}
                        {
                          incident.distanceFromRouteKm
                        }
                        {" km"}
                      </span>

                    </div>

                  </article>

                )
              )}

            </div>

          </section>

        ) : null}


        {/* =================================
            DISCLAIMER
        ================================= */}

        {routeData.analysis
          ?.disclaimer ? (

          <p
            className="
              risk-prediction__disclaimer
            "
          >
            {
              routeData.analysis
                .disclaimer
            }
          </p>

        ) : null}

      </main>

    </div>
  );
}

export default RiskPrediction;