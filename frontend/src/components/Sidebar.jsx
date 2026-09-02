import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const SIDEBAR_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    items: [
      {
        to: "/route-planner",
        label: "Route Planner",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="2.15" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="18" cy="18" r="2.15" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M8 7.4c4.2 0 3.8 9.2 8 9.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        to: "/route-history",
        label: "Route History",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M12 8v4.2l2.6 1.6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    id: "analysis",
    label: "Analysis",
    items: [
      {
        to: "/risk-prediction",
        label: "Risk Prediction",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3.5 19 7v5.2c0 4.3-2.9 6.9-7 8.3-4.1-1.4-7-4-7-8.3V7l7-3.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M12 8.5v4.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="15.4" r="0.85" fill="currentColor" />
          </svg>
        ),
      },
    ],
  },
];

function Sidebar({ isOpen = false, onClose }) {
  const handleNavigate = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar__overlay${isOpen ? " is-visible" : ""}`}
        aria-label="Close navigation"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />

      <aside className={`sidebar${isOpen ? " is-open" : ""}`} aria-label="Application">
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <span className="sidebar__mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="23" r="3.1" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="15.5" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="25" cy="20" r="3.1" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M10.6 20.6 13.4 10.8M18.4 9.8 22.6 17.6M10.7 23.6 21.9 20.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <p className="sidebar__brand-text">NER Logistics</p>
          </div>
          <button
            type="button"
            className="sidebar__close"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Application pages">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.id} className="sidebar__section">
              <p className="sidebar__label">{section.label}</p>
              <ul className="sidebar__list">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `sidebar__link${isActive ? " sidebar__link--active" : ""}`
                      }
                      onClick={handleNavigate}
                    >
                      <span className="sidebar__icon">{item.icon}</span>
                      <span className="sidebar__text">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
