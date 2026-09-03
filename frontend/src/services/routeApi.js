import API_BASE_URL from "./api";

export async function getRouteHistory() {
    const response = await fetch(`${API_BASE_URL}/api/routes/history`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message =
            payload &&
                typeof payload === "object" &&
                payload.message
                ? payload.message
                : "Unable to load route history.";

        throw new Error(message);
    }

    if (!payload || !Array.isArray(payload.routes)) {
        throw new Error("The route history service returned an unexpected response.");
    }

    return payload.routes;
}