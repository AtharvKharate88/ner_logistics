const express = require('express');
const routeRoutes = require('./routes/routeRoutes');
const riskRoutes = require('./routes/riskRoutes');
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
dotenv.config();
connectDB();


const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NER Logistics API'
  });
});

app.use('/api', routeRoutes);
app.use('/api', riskRoutes);

app.listen(PORT, () => {
  console.log(`NER Logistics API running on port ${PORT}`);
});
