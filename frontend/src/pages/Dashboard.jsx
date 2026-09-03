import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import { getCurrentUser, logout } from "../utils/auth";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [dashboardData, setDashboardData] = useState({
    reportsToday: 0,
    totalReports: 0,
    incidents: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("ner_token");

        const response = await fetch(
          `${API_BASE_URL}/api/field-officer/incidents`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load dashboard");
        }

        setDashboardData({
          reportsToday: data.reportsToday || 0,
          totalReports: data.totalReports || 0,
          incidents: Array.isArray(data.incidents) ? data.incidents : [],
        });
      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/field-officer/login");
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="field-dashboard">
      {/* Header */}
      <div className="field-dashboard__header">
        <div>
          <p className="field-dashboard__eyebrow">FIELD OPERATIONS</p>

          <h1 className="field-dashboard__title">
            Field Officer Dashboard
          </h1>

          <p className="field-dashboard__subtitle">
            Report and monitor road incidents from the field.
          </p>
        </div>

        <button
          type="button"
          className="field-dashboard__logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Officer information */}
      <div className="field-dashboard__welcome">
        <div>
          <p className="field-dashboard__label">Logged in as</p>

          <h2>{user?.name || "Field Officer"}</h2>

          <p>
            Officer ID:{" "}
            <strong>{user?.officerId || "N/A"}</strong>
          </p>
        </div>

        <div className="field-dashboard__role">
          FIELD OFFICER
        </div>
      </div>

      {/* Statistics */}
      <div className="field-dashboard__stats">
        <article className="field-dashboard__stat">
          <span className="field-dashboard__stat-label">
            Reports Today
          </span>

          <strong className="field-dashboard__stat-value">
            {loading ? "—" : dashboardData.reportsToday}
          </strong>
        </article>

        <article className="field-dashboard__stat">
          <span className="field-dashboard__stat-label">
            Total Reports
          </span>

          <strong className="field-dashboard__stat-value">
            {loading ? "—" : dashboardData.totalReports}
          </strong>
        </article>

        <article className="field-dashboard__stat">
          <span className="field-dashboard__stat-label">
            Reports Loaded
          </span>

          <strong className="field-dashboard__stat-value">
            {loading ? "—" : dashboardData.incidents.length}
          </strong>
        </article>
      </div>

      {/* Error */}
      {error && (
        <div className="field-dashboard__error" role="alert">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="field-dashboard__grid">
        <article className="field-dashboard__card">
          <div className="field-dashboard__card-icon">+</div>

          <div>
            <h3>Report an Incident</h3>

            <p>
              Submit a new road or environmental incident
              with location, severity and photo evidence.
            </p>

            <button
              type="button"
              className="field-dashboard__primary"
              onClick={() => navigate("/field-officer/report")}
            >
              Report Incident
            </button>
          </div>
        </article>

        <article className="field-dashboard__card">
          <div className="field-dashboard__card-icon">!</div>

          <div>
            <h3>Field Reporting</h3>

            <p>
              Report landslides, floods, road damage and
              other disruptions directly from the field.
            </p>

            <span className="field-dashboard__status">
              Reporting system active
            </span>
          </div>
        </article>
      </div>

      {/* Recent reports */}
      <div className="field-dashboard__reports">
        <div className="field-dashboard__reports-header">
          <div>
            <p className="field-dashboard__eyebrow">
              FIELD ACTIVITY
            </p>

            <h2>Recent Reports</h2>
          </div>

          <button
            type="button"
            className="field-dashboard__secondary"
            onClick={() => navigate("/field-officer/report")}
          >
            + New Report
          </button>
        </div>

        {loading ? (
          <div className="field-dashboard__empty">
            Loading reports...
          </div>
        ) : dashboardData.incidents.length === 0 ? (
          <div className="field-dashboard__empty">
            No incidents reported yet.
          </div>
        ) : (
          <div className="field-dashboard__report-list">
            {dashboardData.incidents.map((incident) => (
              <article
                className="field-dashboard__report"
                key={incident._id || incident.incidentId}
              >
                <div className="field-dashboard__report-main">
                  <div className="field-dashboard__report-title">
                    <h3>{incident.type}</h3>

                    <span
                      className={`field-dashboard__severity field-dashboard__severity--${incident.severity?.toLowerCase()}`}
                    >
                      {incident.severity}
                    </span>
                  </div>

                  <p className="field-dashboard__report-id">
                    {incident.incidentId}
                  </p>

                  {incident.description && (
                    <p className="field-dashboard__report-description">
                      {incident.description}
                    </p>
                  )}

                  <p className="field-dashboard__report-location">
                    📍 {incident.latitude?.toFixed?.(5) || incident.latitude},{" "}
                    {incident.longitude?.toFixed?.(5) || incident.longitude}
                  </p>
                </div>

                <div className="field-dashboard__report-meta">
                  <span
                    className={`field-dashboard__status-badge field-dashboard__status-badge--${incident.status?.toLowerCase()}`}
                  >
                    {incident.status}
                  </span>

                  <span className="field-dashboard__report-date">
                    {formatDate(incident.createdAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Dashboard;