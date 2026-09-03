require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const createUser = async () => {
  const [
    ,
    ,
    username,
    password,
    role,
    name,
    officerId
  ] = process.argv;

  if (!username || !password || !role || !name) {
    console.log(
      'Usage: node scripts/createUser.js <username> <password> <role> <name> [officerId]'
    );
    process.exit(1);
  }

  if (!['ADMIN', 'FIELD_OFFICER'].includes(role)) {
    console.log('Role must be ADMIN or FIELD_OFFICER.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      console.log(`User "${username}" already exists.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      passwordHash,
      role,
      name,
      officerId: officerId || null
    });

    console.log('User created successfully.');
    console.log({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      name: user.name,
      officerId: user.officerId
    });

    process.exit(0);
  } catch (error) {
    console.error('Failed to create user:', error.message);
    process.exit(1);
  }
};

createUser();