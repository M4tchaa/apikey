const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const usersRoute = require('./routes/users')

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use('/api/users', usersRoute);

module.exports = app;