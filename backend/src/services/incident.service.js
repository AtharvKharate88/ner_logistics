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
const getOfficerIncidents = async (userId) => {
  const incidents = await Incident.find({
    reportedBy: userId
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reportsToday = incidents.filter(
    (incident) => new Date(incident.createdAt) >= today
  ).length;

  return {
    reportsToday,
    totalReports: incidents.length,
    incidents
  };
};
module.exports = {
  createIncident,
  getOfficerIncidents
};