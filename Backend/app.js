require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const socialAuthRoutes = require("./routes/socialAuthRoute");
const learningRoutes = require("./Routes/learningRoutes");
const quizRoutes = require("./Routes/quizRoutes");
const analyticsRoutes = require("./Routes/analyticsRoutes");
const cbseCourseRoutes = require("./Routes/cbseCourseRoutes");
const passport = require("./utils/passportConfig");
const session = require("express-session");
const path = require("path");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.static("public"));
app.use("/audio", express.static(path.join(__dirname, "public/audio")));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connection open"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/auth", socialAuthRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", cbseCourseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server started");
});
