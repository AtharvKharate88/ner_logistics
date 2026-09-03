const Incident = require('../models/Incident');
const Alert = require('../models/Alert');

const createIncident = async ({
  reportedBy,
  latitude,
  longitude,
  type,
  severity,
  description,
  photoUrl
}) => {
  const incidentId = `INC-${Date.now()}`;

  const incident = await Incident.create({
    incidentId,
    reportedBy,
    latitude,
    longitude,
    type,
    severity,
    description,
    photoUrl
  });

  const alert = await Alert.create({
    incidentId: incident._id,
    title: `${severity} ${type} reported`,
    message: `${type} reported by a field officer near the reported location.`,
    latitude,
    longitude,
    radiusKm: 5,
    severity,
    status: 'ACTIVE'
  });

  return {
    incident,
    alert
  };
};

module.exports = {
  createIncident
};