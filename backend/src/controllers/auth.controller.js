const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const result = await authService.login(username, password);

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.message === 'Invalid username or password.') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    return next(error);
  }
};

module.exports = {
  login
};