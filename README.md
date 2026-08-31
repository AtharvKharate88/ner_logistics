# NER Logistics AI

A logistics intelligence project focused on route planning and risk prediction for North-East region transportation scenarios. The system includes a backend API, frontend interface structure, ML risk model components, and a route optimization engine.

## Project Overview

This project is designed to support:
- route planning between locations
- risk prediction for terrain and weather-related disruption
- route reliability analysis
- incident reporting
- future integration with a mapping and optimization engine

## Tech Stack

- Backend: Node.js + Express
- Frontend: React (structure prepared)
- ML: Python, scikit-learn style workflow (data processing, feature engineering, training, prediction)
- Route Engine: Python-based graph and route analysis modules
- Database: MongoDB-ready models and configuration
- Version Control: GitHub with dataset placeholders and large raw files excluded from the repo

## Repository Structure

```text
ner-logistics-ai/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docs/
│   ├── problem-statement.md
│   ├── solution.md
│   ├── architecture.md
│   ├── datasets.md
│   ├── api-contract.md
│   └── demo-flow.md
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
├── backend/
│   ├── src/
│   └── package.json
├── ml/
│   ├── data/
│   ├── notebooks/
│   ├── src/
│   ├── models/
│   ├── requirements.txt
│   └── README.md
├── route-engine/
│   ├── data/
│   ├── src/
│   └── README.md
├── scripts/
│   ├── download_data.py
│   ├── preprocess_data.py
│   └── seed_database.py
└── .gitattributes
```

## Backend API

The backend includes route and risk endpoints matching the project API contract.

### Health Check
- GET /api/health

### Route Planning
- POST /api/routes/plan

### Risk Prediction
- POST /api/risk/predict

### Route Details
- GET /api/routes/:routeId

### Incident Reporting
- POST /api/incidents

Example route-response behavior includes:
- recommended route with reliability and risk score
- alternative routes
- low/high risk classification

## ML Module

The ML folder contains the structure for:
- raw data storage
- processed data storage
- feature engineering
- model training
- evaluation
- prediction pipeline

Files include:
- preprocessing.py
- features.py
- train.py
- predict.py
- evaluate.py

## Route Engine

The route-engine module contains high-level route logic for:
- graph generation
- route finding
- route scoring
- alternative route generation

This part is designed to support route optimization and disruption-aware route analysis.

## Data Handling

The repository keeps the folder structure for local datasets, while large raw data files are excluded from version control to avoid GitHub upload limits.

The project is set up so that datasets can be kept locally while the repo remains pushable and shareable.

## Setup

### Backend
```bash
cd backend
npm install
node src/server.js
```

### ML Environment
```bash
cd ml
pip install -r requirements.txt
```

## Notes

This project is currently structured as a working starter implementation with API contracts and project scaffolding ready for future expansion.

The current backend provides static response payloads that match the required integration contract, while the model, ML, and route-engine folders are prepared for real implementation.

## Future Scope

- connect backend to MongoDB collections for persisted route and incident data
- integrate real ML model inference
- build route graph logic from geospatial files
- connect frontend dashboard to backend API
- add map visualization and route rendering

## License

This project is intended for academic / project use and is not yet assigned a formal license.
