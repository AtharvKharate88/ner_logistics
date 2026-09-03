import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import "./ReportIncident.css";

const INITIAL_FORM = {
  type: "LANDSLIDE",
  severity: "MEDIUM",
  latitude: "",
  longitude: "",
  description: "",
};

function ReportIncident() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPhoto(null);
      return;
    }

    setPhoto(file);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setError("");
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
        }));

        setLocationLoading(false);
      },
      (locationError) => {
        setLocationLoading(false);

        if (locationError.code === 1) {
          setError("Location permission was denied.");
        } else {
          setError("Unable to get your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(null);

    if (!form.latitude || !form.longitude) {
      setError("Please provide the incident location.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("ner_token");

      if (!token) {
        navigate("/field-officer/login");
        return;
      }

      const formData = new FormData();

      formData.append("latitude", form.latitude);
      formData.append("longitude", form.longitude);
      formData.append("type", form.type);
      formData.append("severity", form.severity);
      formData.append("description", form.description);

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to report incident.");
      }

      setSuccess(data);

      setForm(INITIAL_FORM);
      setPhoto(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="report-incident">
      <div className="report-incident__header">
        <div>
          <p className="report-incident__eyebrow">
            FIELD OPERATIONS
          </p>

          <h1>Report Incident</h1>

          <p>
            Submit a road or environmental incident from the field.
          </p>
        </div>
      </div>

      {success ? (
        <div className="report-incident__success">
          <div className="report-incident__success-icon">
            ✓
          </div>

          <div>
            <h2>Incident reported successfully</h2>

            <p>
              Incident ID:{" "}
              <strong>{success.incident?.incidentId}</strong>
            </p>

            <p>
              An alert has been generated for the nearby area.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form
          className="report-incident__form"
          onSubmit={handleSubmit}
        >
          <div className="report-incident__section">
            <h2>Incident Details</h2>

            <div className="report-incident__grid">
              <label>
                <span>Incident Type</span>

                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="LANDSLIDE">Landslide</option>
                  <option value="FLOOD">Flood</option>
                  <option value="ROAD_DAMAGE">Road Damage</option>
                  <option value="BRIDGE_DAMAGE">
                    Bridge Damage
                  </option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="CONGESTION">Congestion</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>

              <label>
                <span>Severity</span>

                <select
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
            </div>

            <label>
              <span>Description</span>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what you observed..."
                rows="5"
              />
            </label>
          </div>

          <div className="report-incident__section">
            <div className="report-incident__section-header">
              <div>
                <h2>Incident Location</h2>

                <p>
                  Use your current GPS location or enter coordinates
                  manually.
                </p>
              </div>

              <button
                type="button"
                className="report-incident__location-button"
                onClick={useCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading
                  ? "Getting Location..."
                  : "Use Current Location"}
              </button>
            </div>

            <div className="report-incident__grid">
              <label>
                <span>Latitude</span>

                <input
                  type="number"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g. 25.9578198"
                  required
                />
              </label>

              <label>
                <span>Longitude</span>

                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g. 91.8496976"
                  required
                />
              </label>
            </div>
          </div>

          <div className="report-incident__section">
            <h2>Photo Evidence</h2>

            <label className="report-incident__file">
              <span>Select Incident Photo</span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
              />

              {photo ? (
                <small>{photo.name}</small>
              ) : (
                <small>
                  JPG, PNG or WEBP · Maximum 5 MB
                </small>
              )}
            </label>
          </div>

          {error ? (
            <div className="report-incident__error">
              {error}
            </div>
          ) : null}

          <div className="report-incident__actions">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Submitting Report..."
                : "Submit Incident Report"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ReportIncident;