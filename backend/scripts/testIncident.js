require('dotenv').config();

const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

const token = process.argv[2];
const imagePath = process.argv[3];

if (!token || !imagePath) {
  console.error(
    'Usage: node scripts/testIncident.js <JWT> <image-path>'
  );
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(1);
}

const form = new FormData();

form.append('latitude', '28.0380227');
form.append('longitude', '94.6790063');
form.append('type', 'LANDSLIDE');
form.append('severity', 'HIGH');
form.append('description', 'Landslide reported with photo.');

form.append(
  'photo',
  fs.createReadStream(imagePath)
);

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/incidents',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    ...form.getHeaders()
  }
};

const request = http.request(options, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    console.log('Status:', response.statusCode);
    console.log('Response:', data);
  });
});

request.on('error', (error) => {
  console.error('Request failed:', error.message);
});

form.pipe(request);