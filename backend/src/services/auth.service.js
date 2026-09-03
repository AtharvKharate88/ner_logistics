const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (username, password) => {
  const user = await User.findOne({
    username,
    active: true
  });

  if (!user) {
    throw new Error('Invalid username or password.');
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error('Invalid username or password.');
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d'
    }
  );

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      officerId: user.officerId,
      name: user.name
    }
  };
};

module.exports = {
  login
};