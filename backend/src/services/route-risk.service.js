const routeService = require('./route.service');
const riskService = require('./risk.service');

const planRouteWithRisk = async (requestPayload) => {
  const validationError = riskService.validateDepartureDate(requestPayload.departureDate);
  if (validationError) {
    const error = new routeService.RouteServiceError(validationError, 400);
    throw error;
  }

  return routeService.planRoute(requestPayload);
};

module.exports = {
  planRouteWithRisk
};
