const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  const payload = {
    sub: user._id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (user) => {
  const payload = {
    sub: user._id
  };
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET);

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
