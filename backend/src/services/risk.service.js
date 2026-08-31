const RISK_PREDICTIONS_NOTE =
  'Risk predictions are loaded by the route engine from existing Phase 3 parquet output.';

const validateDepartureDate = (departureDate) => {
  if (!departureDate || typeof departureDate !== 'string') {
    return 'departureDate is required and must be a string in YYYY-MM-DD format.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
    return 'departureDate must use YYYY-MM-DD format.';
  }

  const parsed = new Date(`${departureDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return 'departureDate is not a valid calendar date.';
  }

  return null;
};

module.exports = {
  validateDepartureDate,
  RISK_PREDICTIONS_NOTE
};
