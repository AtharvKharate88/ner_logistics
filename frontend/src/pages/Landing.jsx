import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">

      {/* ========================================
          HERO
      ======================================== */}
      <section className="landing__hero">

        {/* Background grid decoration */}
        <div className="landing__grid" />

        <div className="landing__glow landing__glow--one" />
        <div className="landing__glow landing__glow--two" />

        <div className="landing__hero-content">

          {/* Left hero content */}
          <div className="landing__hero-copy">

            <p className="landing__eyebrow">
              LOGISTICS INTELLIGENCE
            </p>

            <h1>
              Intelligent Logistics
              <span>
                For North-East India
              </span>
            </h1>

            <p className="landing__description">
              Plan smarter transportation routes, understand
              environmental risks, and make safer logistics
              decisions with data-driven route intelligence.
            </p>

            <div className="landing__actions">

              <button
                type="button"
                className="landing__primary-button"
                onClick={() => navigate("/route-planner")}
              >
                Plan a Route
                <span aria-hidden="true">
                  →
                </span>
              </button>

              <button
                type="button"
                className="landing__secondary-button"
                onClick={() => navigate("/risk-prediction")}
              >
                Check Risk
              </button>

            </div>

            {/* Hero stats */}
            <div className="landing__stats">

              <div className="landing__stat">
                <span className="landing__stat-icon">
                  ◌
                </span>

                <strong>
                  74,100+
                </strong>

                <span>
                  Road Segments
                </span>
              </div>

              <div className="landing__stat">
                <span className="landing__stat-icon">
                  ◈
                </span>

                <strong>
                  8
                </strong>

                <span>
                  North-East States
                </span>
              </div>

              <div className="landing__stat">
                <span className="landing__stat-icon">
                  ◷
                </span>

                <strong>
                  365
                </strong>

                <span>
                  Days of Data
                </span>
              </div>

              <div className="landing__stat">
                <span className="landing__stat-icon">
                  ✦
                </span>

                <strong>
                  AI-Powered
                </strong>

                <span>
                  Risk Detection
                </span>
              </div>

            </div>

          </div>

          {/* Right visual */}
          <div className="landing__visual">

            <div className="landing__visual-card">

              <div className="landing__visual-header">

                <span className="landing__live-dot" />

                <span>
                  NORTH-EAST NETWORK
                </span>

              </div>

              {/* Abstract map */}
              <div className="landing__map-visual">

                <svg
                  viewBox="0 0 600 500"
                  className="landing__map-svg"
                  aria-hidden="true"
                >

                  {/* Network routes */}
                  <path
                    className="landing__map-line landing__map-line--main"
                    d="M110 300 L180 240 L260 270 L330 190 L410 230 L480 150"
                  />

                  <path
                    className="landing__map-line"
                    d="M180 240 L220 150 L330 190"
                  />

                  <path
                    className="landing__map-line"
                    d="M260 270 L300 380 L410 320"
                  />

                  <path
                    className="landing__map-line"
                    d="M330 190 L370 100 L480 150"
                  />

                  <path
                    className="landing__map-line"
                    d="M410 230 L470 330 L520 260"
                  />

                  <path
                    className="landing__map-line"
                    d="M110 300 L170 390 L300 380"
                  />

                  {/* Connection dots */}
                  <circle
                    className="landing__map-node"
                    cx="110"
                    cy="300"
                    r="8"
                  />

                  <circle
                    className="landing__map-node"
                    cx="180"
                    cy="240"
                    r="7"
                  />

                  <circle
                    className="landing__map-node"
                    cx="260"
                    cy="270"
                    r="9"
                  />

                  <circle
                    className="landing__map-node"
                    cx="330"
                    cy="190"
                    r="7"
                  />

                  <circle
                    className="landing__map-node"
                    cx="410"
                    cy="230"
                    r="8"
                  />

                  <circle
                    className="landing__map-node"
                    cx="480"
                    cy="150"
                    r="8"
                  />

                  <circle
                    className="landing__map-node"
                    cx="300"
                    cy="380"
                    r="7"
                  />

                  <circle
                    className="landing__map-node"
                    cx="470"
                    cy="330"
                    r="7"
                  />

                  {/* Important hub */}
                  <circle
                    className="landing__map-hub"
                    cx="260"
                    cy="270"
                    r="18"
                  />

                </svg>

                {/* Floating data cards */}
                <div className="landing__map-label landing__map-label--one">
                  <span>
                    GUWAHATI
                  </span>

                  <strong>
                    ACTIVE HUB
                  </strong>
                </div>

                <div className="landing__map-label landing__map-label--two">
                  <span>
                    NETWORK
                  </span>

                  <strong>
                    ONLINE
                  </strong>
                </div>

              </div>

              <div className="landing__visual-footer">

                <div>
                  <span>
                    NETWORK STATUS
                  </span>

                  <strong>
                    Operational
                  </strong>
                </div>

                <div>
                  <span>
                    RISK MONITORING
                  </span>

                  <strong>
                    Active
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          FEATURES
      ======================================== */}
      <section className="landing__section">

        <div className="landing__section-heading">

          <div>

            <p className="landing__eyebrow">
              PLATFORM CAPABILITIES
            </p>

            <h2>
              Built for safer logistics decisions
            </h2>

          </div>

          <p>
            One platform to plan routes, analyze environmental
            risk, and respond to changing road conditions.
          </p>

        </div>

        <div className="landing__feature-grid">

          <article className="landing__feature-card">

            <div className="landing__feature-number">
              01
            </div>

            <div className="landing__feature-icon">
              ⌁
            </div>

            <h3>
              Smart Route Planning
            </h3>

            <p>
              Generate and compare multiple transportation
              corridors based on distance, travel time,
              and environmental risk.
            </p>

            <button
              type="button"
              onClick={() => navigate("/route-planner")}
            >
              Explore Route Planner
              <span>
                →
              </span>
            </button>

          </article>


          <article className="landing__feature-card">

            <div className="landing__feature-number">
              02
            </div>

            <div className="landing__feature-icon">
              ⚠
            </div>

            <h3>
              AI Risk Intelligence
            </h3>

            <p>
              Analyze route corridors using environmental
              and risk data to identify potentially
              hazardous road segments.
            </p>

            <button
              type="button"
              onClick={() => navigate("/risk-prediction")}
            >
              Analyze Route Risk
              <span>
                →
              </span>
            </button>

          </article>


          <article className="landing__feature-card">

            <div className="landing__feature-number">
              03
            </div>

            <div className="landing__feature-icon">
              ◉
            </div>

            <h3>
              Field Incident Reports
            </h3>

            <p>
              Field officers can report incidents such as
              landslides and floods, helping route decisions
              reflect current ground conditions.
            </p>

            <button
              type="button"
              onClick={() => navigate("/field-officer/login")}
            >
              Report an Incident
              <span>
                →
              </span>
            </button>

          </article>

        </div>

      </section>


      {/* ========================================
          HOW IT WORKS
      ======================================== */}
      <section className="landing__workflow">

        <div className="landing__workflow-content">

          <div>

            <p className="landing__eyebrow">
              HOW IT WORKS
            </p>

            <h2>
              From route request to
              <span>
                smarter decisions.
              </span>
            </h2>

          </div>

          <div className="landing__steps">

            <div className="landing__step">

              <div className="landing__step-number">
                1
              </div>

              <div>

                <h3>
                  Enter your journey
                </h3>

                <p>
                  Choose your origin, destination,
                  vehicle, cargo, and travel details.
                </p>

              </div>

            </div>


            <div className="landing__step">

              <div className="landing__step-number">
                2
              </div>

              <div>

                <h3>
                  Compare available routes
                </h3>

                <p>
                  The routing engine generates multiple
                  feasible transportation corridors.
                </p>

              </div>

            </div>


            <div className="landing__step">

              <div className="landing__step-number">
                3
              </div>

              <div>

                <h3>
                  Analyze environmental risk
                </h3>

                <p>
                  Risk coverage and high-risk segments
                  are evaluated across every route.
                </p>

              </div>

            </div>


            <div className="landing__step">

              <div className="landing__step-number">
                4
              </div>

              <div>

                <h3>
                  Make an informed decision
                </h3>

                <p>
                  Select the route that provides the best
                  balance between distance and safety.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          CTA
      ======================================== */}
      <section className="landing__cta">

        <div className="landing__cta-card">

          <div className="landing__cta-copy">

            <p className="landing__eyebrow">
              READY TO PLAN?
            </p>

            <h2>
              Start planning a safer route.
            </h2>

            <p>
              Generate route alternatives and understand
              the environmental risks before transportation
              begins.
            </p>

          </div>

          <button
            type="button"
            className="landing__primary-button"
            onClick={() => navigate("/route-planner")}
          >
            Open Route Planner
            <span>
              →
            </span>
          </button>

        </div>

      </section>


      {/* ========================================
          FOOTER
      ======================================== */}
      <footer className="landing__footer">

        <div>

          <strong>
            NER LOGISTICS
          </strong>

          <span>
            AI-powered logistics intelligence for
            North-East India.
          </span>

        </div>

        <p>
          © 2026 NER Logistics
        </p>

      </footer>

    </div>
  );
}

export default Landing;