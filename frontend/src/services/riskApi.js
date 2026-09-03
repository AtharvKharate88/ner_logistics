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

    if (
        !data ||
        typeof data !== "object" ||
        typeof data.riskScore !== "number" ||
        typeof data.riskLevel !== "string"
    ) {
        throw new Error("Malformed risk prediction response.");
    }

    return data;
};

export const getSegmentRiskHistory = async (
    segmentId,
    startDate,
    endDate
) => {
    if (!segmentId) {
        throw new Error("Road segment ID is required.");
    }

    if (!startDate || !endDate) {
        throw new Error("Start date and end date are required.");
    }

    const response = await fetch(
        `${API_BASE_URL}/risk/segment/${encodeURIComponent(
            segmentId
        )}/history?startDate=${encodeURIComponent(
            startDate
        )}&endDate=${encodeURIComponent(endDate)}`
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch risk history (${response.status}).`
        );
    }

    const data = await response.json();

    if (
        !data ||
        typeof data !== "object" ||
        !Array.isArray(data.history)
    ) {
        throw new Error("Malformed risk history response.");
    }

    return data.history;
};