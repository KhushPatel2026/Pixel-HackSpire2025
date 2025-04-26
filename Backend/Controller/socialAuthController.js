const jwt = require('jsonwebtoken');

const handleGoogleCallback = (req, res) => {
    const token = jwt.sign(
      {
        name: req.user.name,
        email: req.user.email,
      },
      process.env.JWT_SECRET,
    );
    res.redirect(`http://localhost:5173/profile?token=${token}`);
  };

const handleGithubCallback = (req, res) => {
    const token = jwt.sign(
        {
            name: req.user.name,
            email: req.user.email
        },
        process.env.JWT_SECRET,
    );
    res.redirect(`http://localhost:5173/profile?token=${token}`);
}

module.exports = { 
    handleGoogleCallback,
    handleGithubCallback
 };