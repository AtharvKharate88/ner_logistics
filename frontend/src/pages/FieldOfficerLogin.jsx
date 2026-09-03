import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";

import "./FieldOfficerLogin.css";

function FieldOfficerLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.user?.role !== "FIELD_OFFICER") {
        throw new Error("This login is only for field officers.");
      }

      localStorage.setItem("ner_token", data.token);
      localStorage.setItem("ner_user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="field-login">

      {/* Decorative background glow */}
      <div className="field-login__glow" />

      <div className="field-login__container">

        {/* Left information section */}
        <section className="field-login__info">

          <span className="field-login__badge">
            SECURITY · SECURE ACCESS
          </span>

          <h1>
            Field Officer
            <span> Portal</span>
          </h1>

          <p className="field-login__description">
            Secure access for authorized field officers to report
            incidents and monitor logistics operations across
            North-East India.
          </p>

          <div className="field-login__features">

            <div className="field-login__feature">
              <div className="field-login__feature-icon">
                ⚠
              </div>

              <div>
                <h3>Report Incidents</h3>
                <p>
                  Submit real-time environmental and road incident reports.
                </p>
              </div>
            </div>

            <div className="field-login__feature">
              <div className="field-login__feature-icon">
                ◉
              </div>

              <div>
                <h3>Field Intelligence</h3>
                <p>
                  Help improve route safety using live field information.
                </p>
              </div>
            </div>

            <div className="field-login__feature">
              <div className="field-login__feature-icon">
                ✓
              </div>

              <div>
                <h3>Secure Access</h3>
                <p>
                  Authorized personnel only.
                </p>
              </div>
            </div>

          </div>

        </section>

        {/* Login section */}
        <section className="field-login__card">

          <div className="field-login__card-header">

            <div className="field-login__icon">
              🛡
            </div>

            <div>
              <span>
                AUTHORIZED PERSONNEL
              </span>

              <h2>
                Sign in to your account
              </h2>
            </div>

          </div>

          <div className="field-login__divider" />

          <form
            className="field-login__form"
            onSubmit={handleSubmit}
          >

            <div className="field-login__group">

              <label htmlFor="username">
                USERNAME
              </label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
              />

            </div>

            <div className="field-login__group">

              <label htmlFor="password">
                PASSWORD
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

            </div>

            {error ? (
              <div
                className="field-login__error"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="field-login__button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"
              }

              <span aria-hidden="true">
                →
              </span>

            </button>

          </form>

          <div className="field-login__footer">

            <span className="field-login__status-dot" />

            <span>
              VERIFIED USER
            </span>

            <p>
              Protected field officer access
            </p>

          </div>

        </section>

      </div>

    </div>
  );
}

export default FieldOfficerLogin;