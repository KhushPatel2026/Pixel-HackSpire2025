require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const socialAuthRoutes = require('./Routes/socialAuthRoute')
const MONGO_URL = process.env.MONGO_URL;
const passport = require('./Utils/passportConfig');
const session = require('express-session');

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connection open");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/auth', socialAuthRoutes);

app.listen(3000, () => {
  console.log('Server started on 3000');
});
