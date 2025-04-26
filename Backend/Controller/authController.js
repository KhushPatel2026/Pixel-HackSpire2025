const User = require('../Model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        const token = jwt.sign(
            {
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({ status: 'ok', user: token });
    } catch (err) {
        res.json({ status: 'error', error: 'Duplicate email' });
    }
};

const login = async (req, res) => {
    const user = await User.findOne({
        email: req.body.email,
    });

    if (!user) {
        return res.json({ status: 'error', error: 'Invalid login' });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);

    if (isPasswordValid) {
        const token = jwt.sign(
            {
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({ status: 'ok', user: token });
    } else {
        return res.json({ status: 'error', user: false });
    }
};

const verifyToken = (req, res) => {
    const token = req.headers['x-access-token'];

    if (!token) {
        return res.json({ status: 'error', error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ status: 'ok', decoded });
    } catch (error) {
        console.log(error);
        res.json({ status: 'error', error: 'Invalid or expired token' });
    }
};

module.exports = { register, login, verifyToken };
