import { useEffect, useState } from "react";
import { getRouteHistory } from "../services/routeApi";
import "./RouteHistory.css";

function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatCreatedAt(value) {
    if (!value) return "Unknown";

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return "Unknown";
    }

    return parsed.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function RouteHistoryCard({ route }) {
    return (
        <article className="route-history__card">
            <div className="route-history__card-header">
                <div className="route-history__route">
                    <span className="route-history__location">
                        {route.origin || "Unknown origin"}
                    </span>

                    <span className="route-history__arrow" aria-hidden="true">
                        →
                    </span>

                    <span className="route-history__location">
                        {route.destination || "Unknown destination"}
                    </span>
                </div>

                <span className="route-history__date">
                    {formatDate(route.departureDate)}
                </span>
            </div>

            <div className="route-history__divider" />

            <div className="route-history__details">
                <div className="route-history__detail">
                    <span className="route-history__label">Cargo</span>
                    <span className="route-history__value">
                        {route.cargoType || "Not specified"}
                    </span>
                </div>

                <div className="route-history__detail">
                    <span className="route-history__label">Weight</span>
                    <span className="route-history__value">
                        {route.weight !== null && route.weight !== undefined
                            ? `${route.weight} kg`
                            : "Not specified"}
                    </span>
                </div>

                <div className="route-history__detail">
                    <span className="route-history__label">Vehicle</span>
                    <span className="route-history__value">
                        {route.vehicleType || "Not specified"}
                    </span>
                </div>

                <div className="route-history__detail">
                    <span className="route-history__label">Recommended</span>
                    <span className="route-history__recommendation">
                        {route.recommendedRouteId || "Unavailable"}
                    </span>
                </div>
            </div>

            <div className="route-history__footer">
                <span>Planned {formatCreatedAt(route.createdAt)}</span>
            </div>
        </article>
    );
}

export default function RouteHistory() {
    const [routes, setRoutes] = useState([]);
    const [status, setStatus] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");

    async function loadHistory() {
        setStatus("loading");
        setErrorMessage("");

        try {
            const history = await getRouteHistory();
            setRoutes(history);
            setStatus("success");
        } catch (error) {
            setRoutes([]);
            setErrorMessage(
                error?.message ||
                "We couldn't retrieve your route history. Please try again.",
            );
            setStatus("error");
        }
    }

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <main className="route-history">
            <div className="route-history__container">
                <header className="route-history__header">
                    <div>
                        <p className="route-history__eyebrow">LOGISTICS ACTIVITY</p>
                        <h1>Route History</h1>
                        <p className="route-history__subtitle">
                            Review previously planned logistics routes.
                        </p>
                    </div>

                    {status === "success" && routes.length > 0 && (
                        <span className="route-history__count">
                            {routes.length} {routes.length === 1 ? "route" : "routes"}
                        </span>
                    )}
                </header>

                {status === "loading" && (
                    <section className="route-history__state" role="status">
                        <div className="route-history__spinner" aria-hidden="true" />
                        <h2>Loading route history…</h2>
                        <p>Retrieving your previously planned routes.</p>
                    </section>
                )}

                {status === "error" && (
                    <section className="route-history__state route-history__state--error">
                        <div className="route-history__state-icon" aria-hidden="true">
                            !
                        </div>

                        <h2>History unavailable</h2>

                        <p>{errorMessage}</p>

                        <button
                            type="button"
                            className="route-history__retry"
                            onClick={loadHistory}
                        >
                            TRY AGAIN
                        </button>
                    </section>
                )}

                {status === "success" && routes.length === 0 && (
                    <section className="route-history__state">
                        <div className="route-history__empty-icon" aria-hidden="true">
                            ↗
                        </div>

                        <h2>No route history yet</h2>

                        <p>
                            Routes you plan will appear here once they have been saved.
                        </p>
                    </section>
                )}

                {status === "success" && routes.length > 0 && (
                    <section
                        className="route-history__list"
                        aria-label="Previously planned routes"
                    >
                        {routes.map((route, index) => (
                            <RouteHistoryCard
                                key={`${route.createdAt}-${route.origin}-${route.destination}-${index}`}
                                route={route}
                            />
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}