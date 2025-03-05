const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const usersRoute = require('./routes/users');
const groupRoutes = require("./routes/group");
const userProfiles = require('./routes/userProfiles');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use('/users', usersRoute);
app.use("/group", groupRoutes);
app.use("/userProfiles", userProfiles);

module.exports = app;