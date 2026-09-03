const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

dotenv.config();

const createFieldOfficer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const username = 'officer01';
    const password = 'Officer@123';
    const passwordHash = await bcrypt.hash(password, 12);

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      console.log(`User "${username}" already exists.`);
      process.exit(0);
    }

    const user = await User.create({
      username,
      passwordHash,
      role: 'FIELD_OFFICER',
      officerId: 'FO001',
      name: 'Field Officer 01',
      active: true
    });

    console.log('Field Officer created successfully.');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Officer ID:', user.officerId);

    process.exit(0);
  } catch (error) {
    console.error('Failed to create Field Officer:', error.message);
    process.exit(1);
  }
};

createFieldOfficer();