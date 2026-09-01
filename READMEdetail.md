# NER Logistics --- Routing + Environmental Risk Integration

## Overview

This project combines a MERN application backend with a Python/FastAPI
route engine and an offline ML pipeline.

The core flow is:

``` text
React Frontend
      |
      v
MERN / Express :5000
      |
      +---- MongoDB
      |
      +---- HTTP ----> Python / FastAPI :8001
                            |
                            +--> NetworkX road graph
                            |
                            +--> Risk predictions
                                  |
                                  +--> Isolation Forest
```

The system accepts origin, destination, departure date and vehicle/cargo
information, generates up to three candidate routes, enriches those
routes with environmental risk, scores them using distance + risk, and
returns the recommended route.

------------------------------------------------------------------------

# 1. Architecture

``` text
Frontend
   |
   | POST /api/routes/plan
   v
Express / MERN :5000
   |
   | validation
   v
route.controller.js
   |
   v
route.service.js
   |
   | POST /routes/plan
   v
FastAPI :8001
   |
   +--> RiskService
   |       |
   |       +--> risk_predictions.parquet
   |
   +--> RouteEngine
           |
           +--> cKDTree coordinate snapping
           +--> NetworkX Dijkstra
           +--> candidate routes
           +--> roadSegmentIds
                    |
                    v
              route_risk.py
                    |
                    +--> meanRisk
                    +--> maxRisk
                    +--> coverage
                    +--> riskLevel
                    +--> routeScore
                    |
                    v
              recommendedRouteId
                    |
                    v
              MERN response
                    |
                    v
                Frontend
```

MERN is responsible for application/API orchestration and persistence.
Python is responsible for geospatial routing and ML/risk computation.

------------------------------------------------------------------------

# 2. Repository Structure

``` text
logistics/
├── backend/
│   └── src/
│       ├── server.js
│       ├── routes/
│       │   ├── route.routes.js
│       │   └── risk.routes.js
│       ├── controllers/
│       │   ├── route.controller.js
│       │   ├── risk.controller.js
│       │   └── riskController.js
│       ├── services/
│       │   ├── route.service.js
│       │   ├── risk.service.js
│       │   ├── route-risk.service.js
│       │   └── routeRisk.service.js
│       ├── models/
│       │   └── Prediction.js
│       ├── middleware/
│       │   ├── validation.middleware.js
│       │   └── error.middleware.js
│       └── config/
│           └── db.js
│
├── route-engine/
│   ├── src/
│   │   ├── api.py
│   │   ├── route_finder.py
│   │   ├── graph_builder.py
│   │   ├── graphBuilder.py
│   │   ├── speed_config.py
│   │   └── risk/
│   │       ├── __init__.py
│   │       ├── config.py
│   │       ├── risk_service.py
│   │       └── route_risk.py
│   ├── scripts/
│   │   ├── build_graph.py
│   │   ├── test_city_pairs.py
│   │   ├── test_graph_integrity.py
│   │   ├── test_route_quality.py
│   │   ├── validate_routes.py
│   │   └── generate_integration_report.py
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_graph.py
│   │   ├── test_route_finder.py
│   │   └── test_route_risk.py
│   └── data/
│       └── graph/
│           ├── road_graph.joblib
│           └── node_index.parquet
│
├── ml/
│   ├── scripts/
│   │   ├── analyze_large_dataset.py
│   │   ├── integrate_features.py
│   │   ├── optimize_dataset.py
│   │   ├── optimize_dataset_backup.py
│   │   ├── train_isolation_forest.py
│   │   ├── train_isolation_forest_backup.py
│   │   ├── validate_risk_features.py
│   │   └── generate_risk_predictions.py
│   ├── src/
│   │   └── model/
│   │       └── predict.py
│   ├── notebooks/
│   │   └── risk_model_training.ipynb
│   ├── data/
│   │   └── processed/
│   │       ├── risk_features.csv
│   │       ├── risk_features.parquet
│   │       ├── risk_model_features.parquet
│   │       ├── environmental_anomaly_scores.parquet
│   │       └── risk_predictions.parquet
│   └── models/
│       ├── isolation_forest.joblib
│       ├── risk_model.pkl
│       └── risk_model_report.txt
│
└── frontend/
    └── src/
        ├── components/
        │   └── RiskBadge.jsx
        ├── pages/
        │   └── RiskPrediction.jsx
        └── services/
            └── riskApi.js
```

There are some legacy/duplicate names in the current repository
(`riskController.js` vs `risk.controller.js`, `routeRisk.service.js` vs
`route-risk.service.js`). These should be consolidated before
production.

------------------------------------------------------------------------

# 3. MERN API Routes

The Express server is in:

``` text
backend/src/server.js
```

It mounts:

``` javascript
app.use('/api', routeRoutes);
app.use('/api', riskRoutes);
```

Therefore the public prefix is `/api`.

## GET /api/health

Checks the MERN backend.

``` http
GET http://127.0.0.1:5000/api/health
```

Response:

``` json
{
  "status": "OK",
  "service": "NER Logistics API"
}
```

## POST /api/routes/plan

Main route-planning endpoint.

Example request:

``` json
{
  "origin": {
    "lat": 28.0380227,
    "lon": 94.6790063
  },
  "destination": {
    "lat": 27.2207019,
    "lon": 95.7233468
  },
  "departureDate": "2025-01-01",
  "vehicleType": "truck",
  "cargoType": "general",
  "weight": 1000
}
```

The MERN service forwards the request to:

``` text
POST http://127.0.0.1:8001/routes/plan
```

The response contains candidate routes, risk information, route scores
and `recommendedRouteId`.

## GET /api/routes/history

Returns saved route history.

## GET /api/routes/:routeId

Retrieves a route by ID.

## POST /api/incidents

Creates an incident through the route controller.

## GET /api/risk/segment/:id?date=YYYY-MM-DD

Returns risk for a specific road segment.

Example:

``` http
GET http://127.0.0.1:5000/api/risk/segment/road_1?date=2025-01-01
```

Verified response:

``` json
{
  "success": true,
  "roadSegmentId": "road_1",
  "date": "2025-01-01",
  "riskAvailable": true,
  "anomalyScore": -0.12950441241264343,
  "riskScore": 5.63967752456665,
  "riskLevel": "LOW"
}
```

Unknown segment:

``` json
{
  "success": true,
  "roadSegmentId": "road_DOES_NOT_EXIST",
  "date": "2025-01-01",
  "riskAvailable": false
}
```

## POST /api/risk/predict

Registered by `backend/src/routes/risk.routes.js` and handled by the
existing `predictRisk` controller. It is separate from the graph-based
route-risk enrichment flow.

------------------------------------------------------------------------

# 4. Python/FastAPI API Routes

Main file:

``` text
route-engine/src/api.py
```

Application:

``` text
NER Route Engine
version 2.0.0
```

## GET /health

``` http
GET http://127.0.0.1:8001/health
```

## POST /routes/plan

Main Python route engine endpoint.

Input:

``` json
{
  "origin": {
    "lat": 28.0380227,
    "lon": 94.6790063
  },
  "destination": {
    "lat": 27.2207019,
    "lon": 95.7233468
  },
  "departureDate": "2025-01-01",
  "cargoType": "general",
  "weight": 1000
}
```

## GET /risk/segment/{segment_id}?date=YYYY-MM-DD

Direct Python segment-risk lookup.

## GET /routes/graph/stats

Returns graph node/edge counts and metadata.

Verified graph:

``` text
Nodes: 1,787,359
Edges: 3,524,679
```

## GET /debug/route-test

Tests snapping for known locations including Guwahati, Shillong and
Imphal.

Development/debug endpoint only.

## GET /debug/connectivity

Checks connected components for known locations.

Development/debug endpoint only.

------------------------------------------------------------------------

# 5. ML Pipeline

## Dataset

``` text
ml/data/processed/risk_model_features.parquet
```

Verified:

``` text
Rows:       8,249,000
Segments:      22,600
Dates:            365
Duplicates:         0
```

Features:

``` text
rainfall_1d
rainfall_3d
rainfall_7d
elevation
slope
landslides_5km
landslides_10km
```

Missing values were present only in:

``` text
elevation: 40,880
slope:     40,880
```

They are handled by median imputation.

------------------------------------------------------------------------

# 6. Isolation Forest

Training file:

``` text
ml/scripts/train_isolation_forest.py
```

Pipeline:

``` text
Raw features
    ↓
SimpleImputer(strategy="median")
    ↓
log1p on rainfall/landslide-count features
    ↓
StandardScaler
    ↓
IsolationForest
```

Configuration:

``` python
n_estimators=200
max_samples="auto"
contamination="auto"
n_jobs=-1
random_state=42
```

## Why Isolation Forest?

There is no reliable binary label for every road segment/date. Isolation
Forest is therefore used as an unsupervised anomaly detector.

It identifies environmental observations that are unusual relative to
the learned distribution.

Important:

``` text
Isolation Forest detects anomaly.
It does not prove that a landslide will occur.
```

------------------------------------------------------------------------

# 7. Anomaly Score

Scikit-learn's `decision_function()` has:

``` text
higher = more normal
```

The project intentionally uses:

``` python
scores = -pipeline.decision_function(X)
```

Therefore:

``` text
higher environmental_anomaly_score
=
more anomalous
```

Output:

``` text
ml/data/processed/environmental_anomaly_scores.parquet
```

Verified:

``` text
Rows:          8,249,000
Segments:         22,600
Dates:               365
Missing scores:        0
Duplicates:            0
```

------------------------------------------------------------------------

# 8. Risk Prediction Generation

Script:

``` text
ml/scripts/generate_risk_predictions.py
```

Input:

``` text
environmental_anomaly_scores.parquet
```

Output:

``` text
risk_predictions.parquet
```

Columns:

``` text
road_segment_id
date
anomaly_score
risk_score
risk_level
```

Verified:

``` text
Rows:       8,249,000
Segments:      22,600
Dates:            365
```

Risk score is scaled to:

``` text
0–100
```

Current route-engine thresholds:

``` text
HIGH   >= 80
MEDIUM >= 50
LOW    < 50
```

Risk score is a relative environmental anomaly index, not a calibrated
probability.

------------------------------------------------------------------------

# 9. RiskService

File:

``` text
route-engine/src/risk/risk_service.py
```

Responsibilities:

-   load risk predictions,
-   validate required columns,
-   parse dates,
-   cache the loaded dataframe,
-   look up segment/date predictions,
-   return anomaly score, risk score and risk level.

Required prediction columns:

``` text
road_segment_id
date
anomaly_score
risk_score
risk_level
```

------------------------------------------------------------------------

# 10. Future Dates

The current prediction dataset covers:

``` text
2025-01-01 → 2025-12-31
```

If the user requests:

``` text
2026-01-01
```

the current prototype maps it to:

``` text
2025-01-01
```

This was tested successfully through both:

``` text
/api/routes/plan
```

and:

``` text
/api/risk/segment/road_1
```

Important interview statement:

> This is not a true 2026 forecast. It is an analog-date/climatology
> strategy used because the current prediction dataset contains one
> year. A production implementation should consume actual forecast data
> for the requested date.

------------------------------------------------------------------------

# 11. Graph

Main file:

``` text
route-engine/src/graph_builder.py
```

Artifacts:

``` text
route-engine/data/graph/road_graph.joblib
route-engine/data/graph/node_index.parquet
```

Graph:

``` text
NetworkX DiGraph
```

Current verified size:

``` text
1,787,359 nodes
3,524,679 edges
```

Edges contain information including:

``` text
road_segment_id
length_km
travel_time_hours
geometry
weight
```

Geodesic length is calculated with:

``` text
pyproj.Geod(ellps="WGS84")
```

------------------------------------------------------------------------

# 12. Coordinate Snapping

File:

``` text
route-engine/src/route_finder.py
```

User coordinates are not necessarily exact graph nodes.

Flow:

``` text
lat/lon
   ↓
EPSG:4326
   ↓
EPSG:3857
   ↓
cKDTree nearest-node search
   ↓
graph node
```

The node index contains:

``` text
node_id
lon
lat
x_3857
y_3857
```

cKDTree avoids scanning all 1.7M nodes linearly for every request.

------------------------------------------------------------------------

# 13. Route Generation

File:

``` text
route-engine/src/route_finder.py
```

The first path uses Dijkstra.

The `_k_paths()` method generates alternatives using repeated Dijkstra
searches with penalties on already-used edges.

Conceptually:

``` text
Dijkstra → route 1
     ↓
penalize used edges
     ↓
Dijkstra → route 2
     ↓
penalize more edges
     ↓
Dijkstra → route 3
```

This was chosen because a full Yen `shortest_simple_paths`
implementation was considered too slow for the large graph and
interactive API.

The first route remains a true shortest-path route for the configured
graph weight.

------------------------------------------------------------------------

# 14. Route Risk

File:

``` text
route-engine/src/risk/route_risk.py
```

Flow:

``` text
route.roadSegmentIds
        ↓
RiskService.lookup_segments()
        ↓
segment risks
        ↓
route summary
```

Calculated:

``` text
meanRisk
maxRisk
highRiskSegmentCount
riskCoverage
riskCoverageStatus
riskLevel
```

`meanRisk` represents average route environmental risk.

`maxRisk` identifies the worst segment.

The route risk level is based on the maximum risk.

------------------------------------------------------------------------

# 15. Risk Coverage

Verified:

``` text
Graph segments: 23,647
ML segments:    22,600
Coverage:       95.57%
```

The two datasets do not have identical segment coverage.

Missing segments are not assigned fake risk.

Instead:

``` text
riskAvailable = false
```

is returned for those segments.

Route coverage:

``` text
segments with risk / total route segments × 100
```

Minimum configured coverage:

``` text
80%
```

Routes below the threshold are not eligible for route scoring.

------------------------------------------------------------------------

# 16. Route Scoring

File:

``` text
route-engine/src/risk/config.py
```

Defaults:

``` text
distance_weight = 0.5
risk_weight     = 0.5
```

For eligible routes:

``` text
normalized distance
        +
normalized mean risk
        ↓
0.5 × distance + 0.5 × risk
        ↓
routeScore
```

Lower score is better.

The recommended route is the route with the minimum eligible score.

------------------------------------------------------------------------

# 17. Verified End-to-End Test

Coordinates:

``` text
Origin:
28.0380227, 94.6790063

Destination:
27.2207019, 95.7233468

Date:
2025-01-01
```

Result:

  Route        Distance     Time   Mean Risk   Max Risk Level      Score
  --------- ----------- -------- ----------- ---------- ------- --------
  route_1     258.02 km   4.17 h       33.23      95.05 HIGH      0.1403
  route_2     457.15 km   7.13 h       32.36      98.34 HIGH      0.4292
  route_3     490.00 km   8.94 h       35.46      99.27 HIGH      1.0000

Final:

``` text
Recommended route: route_1
History saved: True
```

This verified the complete MERN → Python → graph → risk → scoring → MERN
pipeline.

------------------------------------------------------------------------

# 18. Problems Faced and Solutions

## Problem: incorrect graph relative path

Initial path:

``` text
..oute-engine\data\graphoad_graph.joblib
```

caused:

``` text
OSError: [Errno 22] Invalid argument
```

Cause: the command was already being executed from `route-engine`.

Solution:

``` text
data/graph/road_graph.joblib
```

or use the correct path relative to the current directory.

------------------------------------------------------------------------

## Problem: graph/ML segment mismatch

Observed:

``` text
Graph: 23,647
ML:    22,600
Coverage: 95.57%
```

Solution:

Do not fabricate predictions. Mark unavailable segments and calculate
route coverage. Routes below 80% coverage are excluded from route
scoring.

------------------------------------------------------------------------

## Problem: Mumbai/Pune route failed

Test:

``` text
Mumbai: 19.0760, 72.8777
Pune:   18.5204, 73.8567
```

Error:

``` text
Coordinate could not be snapped to a graph node within 75.0 km.
```

Investigation showed the graph node bounds were approximately:

``` text
lat: 22.08 → 29.17
lon: 88.10 → 97.04
```

The source road data had similar geographic bounds.

Conclusion:

This was a **dataset coverage issue**, not a Dijkstra failure.

Solution:

Use coordinates inside the actual graph coverage or rebuild the road
dataset for the required geography.

------------------------------------------------------------------------

## Problem: Python import errors

Errors included:

``` text
ModuleNotFoundError: No module named 'route_finder'
ModuleNotFoundError: No module named 'graph_builder'
ModuleNotFoundError: No module named 'risk'
```

Cause:

Some files used imports assuming `src` was directly on the Python path:

``` python
from route_finder import ...
from graph_builder import ...
from risk.risk_service import ...
```

while the application was imported as:

``` python
from src.api import app
```

Solution:

Use package-aware imports:

``` python
from src.route_finder import get_engine
from src.risk.risk_service import ...
from src.risk.route_risk import ...
```

and update risk-package imports similarly.

------------------------------------------------------------------------

## Problem: MERN endpoint returned 404

Incorrect:

``` text
GET /risk/segment/road_1
```

Correct:

``` text
GET /api/risk/segment/road_1?date=2025-01-01
```

Cause:

`server.js` mounts the router under:

``` javascript
app.use('/api', riskRoutes);
```

------------------------------------------------------------------------

## Problem: Python `requests` package unavailable

Testing with:

``` python
import requests
```

failed because `requests` was not installed.

Solution:

Use PowerShell's built-in:

``` powershell
Invoke-RestMethod
```

for local API testing.

------------------------------------------------------------------------

## Problem: giant API response

The route response contains complete geometry with many coordinates.

Printing the entire response made the terminal unreadable.

Solution:

Select only useful fields:

``` powershell
$response.routes | Select-Object routeId, distanceKm, estimatedTimeHours
```

and inspect risk separately:

``` powershell
$response.routes[0].risk | ConvertTo-Json
```

------------------------------------------------------------------------

## Problem: missing vehicleType

A request without `vehicleType` returned:

``` text
vehicleType is required.
```

This confirmed MERN validation occurs before the request reaches the
Python service.

------------------------------------------------------------------------

## Problem: invalid date

``` text
2025-13-40
```

was rejected with HTTP 400.

Missing date was also rejected.

------------------------------------------------------------------------

## Problem: invalid coordinates

``` text
lat = 100
```

was rejected:

``` text
Input should be less than or equal to 90
```

The FastAPI Pydantic model enforces:

``` python
lat: -90 to 90
lon: -180 to 180
```

------------------------------------------------------------------------

# 19. Why MERN + Python?

Interview answer:

> The MERN layer is responsible for application APIs, persistence,
> validation and frontend integration. Python is better suited to the ML
> and geospatial stack because the project uses pandas, GeoPandas,
> SciPy, NetworkX and scikit-learn. Separating the services also makes
> the routing/ML engine independently testable and deployable.

------------------------------------------------------------------------

# 20. Why Not Everything in Node?

The routing and ML stack naturally fits Python:

``` text
pandas
GeoPandas
SciPy
NetworkX
scikit-learn
```

Node remains the application-facing service.

This is a service-boundary decision, not a limitation of Node.

------------------------------------------------------------------------

# 21. Why Dijkstra?

Interview answer:

> The road network is a weighted graph and the current edge costs are
> non-negative. Dijkstra therefore gives a correct shortest path for the
> configured graph weights. A\* could be introduced later using
> geographic coordinates as a heuristic for better performance.

------------------------------------------------------------------------

# 22. Why cKDTree?

Interview answer:

> The graph contains about 1.8 million nodes. A linear nearest-node
> search for every API request would be expensive. cKDTree provides an
> efficient spatial nearest-neighbor lookup using projected coordinates.

------------------------------------------------------------------------

# 23. Why Mean + Maximum Risk?

Mean risk answers:

> How risky is the route overall?

Maximum risk answers:

> What is the worst segment?

A route could have low average risk but contain one extremely hazardous
segment, so both are useful.

------------------------------------------------------------------------

# 24. Why Risk After Route Generation?

Current design:

``` text
Generate candidate routes
        ↓
Enrich with risk
        ↓
Score candidates
```

This separates the physical road-network routing problem from
environmental-risk analysis.

Advantages:

-   preserves the true shortest route,
-   provides alternatives,
-   makes risk weights configurable,
-   makes debugging easier,
-   avoids rebuilding graph weights for every date.

A future design could put dynamic environmental risk directly into edge
weights.

------------------------------------------------------------------------

# 25. Why Not Directly Optimize Risk?

Current route selection balances:

``` text
distance
+
mean environmental risk
```

A future safety-focused implementation could use:

``` text
edge_cost =
distance_weight × distance
+
risk_weight × environmental_risk
```

or use hard constraints such as:

``` text
reject any route containing riskScore > 95
```

This would prevent a very short route from being recommended when it
contains an extremely dangerous segment.

------------------------------------------------------------------------

# 26. Important Model Limitation

Do not say:

> "Risk score 95 means 95% probability of a landslide."

That is incorrect.

Correct statement:

> "The score is a relative environmental anomaly/risk index derived from
> the Isolation Forest output."

A calibrated probability model would require appropriate historical
labels and calibration.

------------------------------------------------------------------------

# 27. Important Future-Date Limitation

Current:

``` text
2026-01-01 → 2025-01-01 analog
```

This is not a true weather forecast.

Production improvement:

``` text
forecast rainfall
+
terrain
+
historical events
+
seasonality
+
soil/geology
+
road features
        ↓
temporal/spatiotemporal risk model
```

------------------------------------------------------------------------

# 28. Model Improvements

Possible future approaches:

-   XGBoost / LightGBM
-   Random Forest
-   calibrated supervised classifiers
-   temporal models
-   spatiotemporal models

The correct choice depends on the quality and availability of historical
labeled events.

------------------------------------------------------------------------

# 29. Performance Improvements

Potential improvements:

1.  Replace Dijkstra with A\* where appropriate.
2.  Cache date-specific risk lookups.
3.  Store predictions in a structure optimized for
    `(road_segment_id, date)` lookup.
4.  Use vectorized joins for bulk risk enrichment.
5.  Keep the Python service persistent.
6.  Add route/result caching.
7.  Profile graph loading and candidate-route generation.
8.  Horizontally scale the Python service.
9.  Add structured logging and timing metrics.

------------------------------------------------------------------------

# 30. Production Security

Before production:

-   authenticate protected endpoints,
-   authorize route-history access,
-   restrict CORS,
-   keep secrets in environment variables,
-   use HTTPS,
-   remove `/debug/*` endpoints,
-   add structured logging,
-   add request IDs,
-   monitor service health,
-   protect MongoDB,
-   rate-limit APIs,
-   validate both public and internal service inputs.

The current Express server already uses:

``` text
helmet
cors
express-rate-limit
express.json
```

------------------------------------------------------------------------

# 31. Startup Strategy

Python startup loads:

``` python
get_risk_service()
get_engine()
engine.gcc_index()
```

The graph is large:

``` text
1,787,359 nodes
3,524,679 edges
```

Loading it at startup avoids making the first user request pay the full
graph-loading cost and helps prevent MERN → Python request timeouts.

------------------------------------------------------------------------

# 32. Important Files to Know

## MERN

``` text
backend/src/server.js
```

Application bootstrap, middleware and route mounting.

``` text
backend/src/routes/route.routes.js
```

Route definitions.

``` text
backend/src/routes/risk.routes.js
```

Risk definitions.

``` text
backend/src/controllers/route.controller.js
```

Route request handling.

``` text
backend/src/controllers/risk.controller.js
```

Risk request handling.

``` text
backend/src/services/route.service.js
```

MERN → Python communication.

``` text
backend/src/services/risk.service.js
```

Segment risk application service.

``` text
backend/src/middleware/validation.middleware.js
```

Input validation.

``` text
backend/src/middleware/error.middleware.js
```

Centralized errors.

## Python

``` text
route-engine/src/api.py
```

FastAPI HTTP layer.

``` text
route-engine/src/route_finder.py
```

Snapping, routing, candidate route construction.

``` text
route-engine/src/graph_builder.py
```

Road graph construction.

``` text
route-engine/src/risk/risk_service.py
```

Risk data loading and segment lookup.

``` text
route-engine/src/risk/route_risk.py
```

Route risk aggregation and route scoring.

``` text
route-engine/src/risk/config.py
```

Thresholds and weights.

## ML

``` text
ml/scripts/train_isolation_forest.py
```

Isolation Forest training.

``` text
ml/scripts/generate_risk_predictions.py
```

Anomaly → risk score conversion.

``` text
ml/scripts/integrate_features.py
```

Feature integration.

``` text
ml/scripts/optimize_dataset.py
```

Dataset optimization.

``` text
ml/scripts/validate_risk_features.py
```

Feature validation.

``` text
ml/src/model/predict.py
```

Prediction-related model code.

------------------------------------------------------------------------

# 33. Useful Local Commands

Run Python from:

``` text
logistics/route-engine
```

Example:

``` powershell
uvicorn src.api:app --host 127.0.0.1 --port 8001
```

MERN:

``` text
http://127.0.0.1:5000
```

Python:

``` text
http://127.0.0.1:8001
```

Health:

``` powershell
Invoke-RestMethod "http://127.0.0.1:5000/api/health" | ConvertTo-Json
Invoke-RestMethod "http://127.0.0.1:8001/health" | ConvertTo-Json
```

Risk:

``` powershell
Invoke-RestMethod `
  "http://127.0.0.1:5000/api/risk/segment/road_1?date=2025-01-01" |
  ConvertTo-Json
```

Graph:

``` powershell
Invoke-RestMethod `
  "http://127.0.0.1:8001/routes/graph/stats" |
  ConvertTo-Json -Depth 10
```

------------------------------------------------------------------------

# 34. Interview 30-Second Explanation

> This is a logistics route-planning system that combines a road graph
> with environmental anomaly detection. The React frontend talks to an
> Express/MERN backend. Express validates the request and calls a Python
> FastAPI service. Python snaps the coordinates to a large NetworkX road
> graph and generates multiple candidate routes using Dijkstra with edge
> penalties for alternatives. Each route contains road segment IDs,
> which are matched against date-specific environmental risk predictions
> generated offline using Isolation Forest over rainfall, terrain and
> nearby landslide features. We calculate mean risk, maximum risk and
> risk coverage, then combine normalized distance and risk into a route
> score. The lowest eligible score becomes the recommended route, and
> the result is returned through the MERN backend.

------------------------------------------------------------------------

# 35. High-Value Interview Questions

### What does your model predict?

Environmental anomaly/risk score, not a guaranteed landslide
probability.

### Why unsupervised?

Reliable labels were not available for every segment/date.

### Why Isolation Forest?

It is an efficient unsupervised anomaly detector suitable for large
feature datasets.

### How are ML predictions connected to roads?

Through the common `road_segment_id`.

### What if a segment has no prediction?

It is marked unavailable and contributes to route coverage. No
artificial risk value is created.

### Why Dijkstra?

Non-negative graph weights and correctness for shortest path.

### Why cKDTree?

Fast nearest-node lookup for a graph containing about 1.8M nodes.

### Why three routes?

The system needs alternatives so it can compare distance and
environmental risk instead of returning only the shortest path.

### Why is a HIGH-risk route sometimes recommended?

Risk level is based on maximum segment risk, while current route
selection uses normalized mean risk plus distance. A production safety
policy could add a hard maximum-risk constraint.

### What is your biggest limitation?

Future dates currently use a 2025 analog rather than true forecast data.

### What would you improve first?

Use real forecast data and a supervised/temporal risk model if reliable
historical labels are available, then integrate dynamic risk into
routing more directly.

------------------------------------------------------------------------

# 36. Verified Test Checklist

``` text
ML dataset validation              PASS
Isolation Forest training          PASS
Anomaly score generation           PASS
Risk prediction generation        PASS
Graph loading                      PASS
Coordinate snapping                PASS
Route generation                   PASS
Segment risk lookup                PASS
Route risk aggregation             PASS
Route scoring                      PASS
MERN → Python communication        PASS
Future-date handling               PASS
Invalid-date validation            PASS
Missing-date validation            PASS
Invalid-coordinate validation      PASS
Missing vehicle validation         PASS
Unknown-segment handling           PASS
History saving                     PASS
End-to-end route planning          PASS
```

## Final Status

The current prototype's **routing + environmental-risk integration is
functioning end-to-end**.

The main limitations to remember for an interview are:

1.  Future dates use a 2025 analog rather than a live forecast.
2.  Risk score is an anomaly index, not a calibrated disaster
    probability.
3.  Graph/ML segment coverage is 95.57%.
4.  Alternative routes use a practical Dijkstra + penalty approach
    rather than full Yen's algorithm.
5.  Environmental risk is currently applied after candidate route
    generation rather than directly as a dynamic edge cost.
