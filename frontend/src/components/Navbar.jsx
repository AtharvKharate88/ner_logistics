import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/route-planner", label: "Route Planner" },
  { to: "/risk-prediction", label: "Risk Prediction" },
  { to: "/route-history", label: "Route History" },
];

function Navbar({ onMenuClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggle = () => {
    setIsMenuOpen((open) => !open);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleSidebarToggle = () => {
    if (typeof onMenuClick === "function") {
      onMenuClick();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">

        <div className="navbar__left">
          <button
            type="button"
            className="navbar__sidebar-toggle"
            aria-label="Open sidebar"
            onClick={handleSidebarToggle}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <Link
            to="/"
            className="navbar__brand"
            onClick={closeMenu}
          >
            <span className="navbar__mark" aria-hidden="true">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="8"
                  cy="23"
                  r="3.1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />

                <circle
                  cx="15.5"
                  cy="8"
                  r="3.1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />

                <circle
                  cx="25"
                  cy="20"
                  r="3.1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />

                <path
                  d="M10.6 20.6 13.4 10.8M18.4 9.8 22.6 17.6M10.7 23.6 21.9 20.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />

                <circle cx="8" cy="23" r="1.1" fill="currentColor" />
                <circle cx="15.5" cy="8" r="1.1" fill="currentColor" />
                <circle cx="25" cy="20" r="1.1" fill="currentColor" />
              </svg>
            </span>

            <span className="navbar__identity">
              <span className="navbar__title">
                NER Logistics
              </span>

              <span className="navbar__subtitle">
                AI-powered logistics intelligence
              </span>
            </span>
          </Link>
        </div>

        {/* Mobile navigation toggle */}
        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={isMenuOpen}
          aria-controls="navbar-navigation"
          aria-label={
            isMenuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          onClick={handleToggle}
        >
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>

        <nav
          id="navbar-navigation"
          className={`navbar__nav${isMenuOpen ? " is-open" : ""}`}
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `navbar__link${
                  isActive
                    ? " navbar__link--active"
                    : ""
                }`
              }
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

      </div>
    </header>
  );
}

export default Navbar;