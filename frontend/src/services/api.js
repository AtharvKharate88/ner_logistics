const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && payload.message) ||
      (typeof payload === "string" && payload.trim()) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

/**
 * Plan routes via the Express API (which proxies to the Python route engine).
 * @param {{
 *   origin: string,
 *   destination: string,
 *   departureDate: string,
 *   cargoType: string,
 *   weight: number,
 *   vehicleType: string
 * }} data
 */
export async function planRoute(data) {
  const response = await fetch(`${API_BASE_URL}/api/routes/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const payload = await parseResponse(response);

  if (!payload || typeof payload !== "object" || !Array.isArray(payload.routes)) {
    throw new Error("The route service returned an unexpected response.");
  }

  return payload;
}

export { API_BASE_URL };
export default API_BASE_URL;
