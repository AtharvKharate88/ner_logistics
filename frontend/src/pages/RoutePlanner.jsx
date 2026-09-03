import { useMemo, useState } from "react";
import Loading from "../components/Loading";
import RouteForm from "../components/route-planner/RouteForm";
import RouteMap from "../components/route-planner/RouteMap";
import RouteResults from "../components/route-planner/RouteResults";
import RouteInsights from "../components/route-planner/RouteInsights";
import { planRoute } from "../services/api";
import { friendlyApiError } from "../utils/routeFormat";
import "./RoutePlanner.css";

const INITIAL_FORM = {
  origin: "",
  destination: "",
  departureDate: "",
  cargoType: "medicine",
  vehicleType: "Truck",
  weight: "500",
};

function validateForm(values) {
  const errors = {};

  if (!values.origin) {
    errors.origin = "Origin is required.";
  }
  if (!values.destination) {
    errors.destination = "Destination is required.";
  }
  if (
    values.origin &&
    values.destination &&
    values.origin.trim().toLowerCase() === values.destination.trim().toLowerCase()
  ) {
    errors.destination = "Origin and destination must be different.";
  }
  if (!values.departureDate) {
    errors.departureDate = "Departure date is required.";
  }
  if (!values.cargoType) {
    errors.cargoType = "Cargo type is required.";
  }
  if (!values.vehicleType) {
    errors.vehicleType = "Vehicle type is required.";
  }

  const weight = Number(values.weight);
  if (values.weight === "" || values.weight === null || values.weight === undefined) {
    errors.weight = "Weight is required.";
  } else if (!Number.isFinite(weight) || weight <= 0) {
    errors.weight = "Weight must be a number greater than 0.";
  }

  return errors;
}

function RoutePlanner() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const selectedRoute = useMemo(() => {
    if (!routeData?.routes?.length) return null;
    return (
      routeData.routes.find((route) => route.routeId === selectedRouteId) ||
      routeData.routes.find((route) => route.routeId === routeData.recommendedRouteId) ||
      routeData.routes[0]
    );
  }, [routeData, selectedRouteId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const runPlan = async () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        origin: form.origin,
        destination: form.destination,
        departureDate: form.departureDate,
        cargoType: form.cargoType,
        weight: Number(form.weight),
        vehicleType: form.vehicleType,
      };

      const response = await planRoute(payload);
      setRouteData(response);
      setSelectedRouteId(response.recommendedRouteId || response.routes[0]?.routeId || null);
    } catch (requestError) {
      setRouteData(null);
      setSelectedRouteId(null);
      setError(friendlyApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    runPlan();
  };

  return (
    <div className="route-planner">
      

      <div className="route-planner__body">

        <main className="route-planner__main">
          <header className="route-planner__header">
            <p className="route-planner__eyebrow">Logistics Intelligence</p>
            <h1>Route Planner</h1>
            <p className="route-planner__subtitle">
              Plan safer and more reliable transportation routes across North-East India.
            </p>
          </header>

          <div className="route-planner__workspace">
            <RouteForm
              values={form}
              errors={errors}
              loading={loading}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />

            <div className="route-planner__map-panel">
              <RouteMap
                routes={routeData?.routes || []}
                selectedRouteId={selectedRoute?.routeId || null}
                recommendedRouteId={routeData?.recommendedRouteId || null}
                originLabel={routeData?.origin || form.origin}
                destinationLabel={routeData?.destination || form.destination}
                originCoordinates={routeData?.originCoordinates || null}
                destinationCoordinates={routeData?.destinationCoordinates || null}
              />

              {loading ? (
                <Loading
                  fullPage
                  message="Calculating safest route..."
                  detail="Querying the route engine for distance, alternatives, and risk coverage."
                />
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="route-planner__error" role="alert">
              <div>
                <h2>Unable to plan your route</h2>
                <p>{error}</p>
              </div>
              <button type="button" onClick={runPlan} disabled={loading}>
                Try again
              </button>
            </div>
          ) : null}

          {routeData?.demoFallback ? (
            <div className="route-planner__demo" role="status">
              <strong>Demo fallback mode</strong>
              <p>
                The Python route engine was unavailable, so the API returned labeled
                approximate corridors based on your request. Start the route-engine
                service for real graph routing.
              </p>
            </div>
          ) : null}

          <RouteResults
            routes={routeData?.routes || []}
            recommendedRouteId={routeData?.recommendedRouteId || null}
            selectedRouteId={selectedRoute?.routeId || null}
            onSelect={setSelectedRouteId}
          />

          <RouteInsights
            analysis={routeData?.analysis || null}
            recommendedReason={routeData?.recommendedReason || ""}
            selectedRoute={selectedRoute}
          />
        </main>
      </div>
    </div>
  );
}

export default RoutePlanner;
