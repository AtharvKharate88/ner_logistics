import API_BASE_URL from "./api";

export const getSegmentRisk = async (segmentId, date) => {
    if (!segmentId) {
        throw new Error("Road segment ID is required.");
    }

    if (!date) {
        throw new Error("Date is required.");
    }

    const response = await fetch(
        `${API_BASE_URL}/risk/segment/${encodeURIComponent(
            segmentId
        )}?date=${encodeURIComponent(date)}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch risk data (${response.status}).`);
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
        throw new Error("Malformed risk response.");
    }

    if (typeof data.riskAvailable !== "boolean") {
        throw new Error("Malformed risk response.");
    }

    if (
        data.riskAvailable &&
        (data.riskScore === undefined || data.riskLevel === undefined)
    ) {
        throw new Error("Malformed risk response.");
    }

    return data;
};