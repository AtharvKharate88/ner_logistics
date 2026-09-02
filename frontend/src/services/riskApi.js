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

    return response.json();
};