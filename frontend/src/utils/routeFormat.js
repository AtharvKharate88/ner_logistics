/** City list aligned with backend/src/config/cities.js */
export const SUPPORTED_CITIES = [
  "Guwahati",
  "Shillong",
  "Imphal",
  "Kohima",
  "Itanagar",
  "Aizawl",
];

export const CARGO_OPTIONS = [
  { value: "medicine", label: "Medicine" },
  { value: "food", label: "Food" },
  { value: "general", label: "General Cargo" },
  { value: "fuel", label: "Fuel" },
  { value: "perishable", label: "Perishable" },
];

export const VEHICLE_OPTIONS = [
  { value: "Truck", label: "Truck" },
  { value: "MiniTruck", label: "Mini Truck" },
  { value: "Van", label: "Van" },
  { value: "Tempo", label: "Tempo" },
];

export function formatDistance(km) {
  if (!Number.isFinite(km)) return "—";
  return `${Math.round(km).toLocaleString()} km`;
}

export function formatDuration(hours) {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function formatRiskScore(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return "N/A";
  }
  return String(Math.round(Number(score)));
}

export function normalizeRiskLevel(level) {
  const value = String(level || "UNKNOWN").toUpperCase();
  if (value === "LOW" || value === "MEDIUM" || value === "HIGH") return value;
  if (value === "UNAVAILABLE" || value === "UNKNOWN") return "UNKNOWN";
  return value;
}

export function riskClass(level) {
  const normalized = normalizeRiskLevel(level);
  if (normalized === "LOW") return "risk--low";
  if (normalized === "MEDIUM") return "risk--medium";
  if (normalized === "HIGH") return "risk--high";
  return "risk--unknown";
}

/** Convert GeoJSON [lon, lat] pairs to Leaflet [lat, lon]. */
export function geometryToLatLngs(geometry) {
  if (!geometry || !geometry.coordinates) return [];

  if (geometry.type === "Point") {
    const [lon, lat] = geometry.coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lon)) return [[lat, lon]];
    return [];
  }

  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
      .filter((pair) => Array.isArray(pair) && pair.length >= 2)
      .map(([lon, lat]) => [lat, lon])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));
  }

  return [];
}

export function friendlyApiError(error) {
  if (!error) {
    return "Unable to plan your route. Please try again.";
  }

  const status = error.status;
  const message = String(error.message || "");

  if (status === 400) {
    return message || "Please check the form details and try again.";
  }
  if (status === 404) {
    return "No feasible route was found between the selected locations.";
  }
  if (status === 503) {
    return "The route service is currently unavailable. Please try again shortly.";
  }
  if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("network")) {
    return "Unable to reach the route service. Confirm the backend is running and try again.";
  }

  return "Unable to plan your route. Please check the locations and try again.";
}
