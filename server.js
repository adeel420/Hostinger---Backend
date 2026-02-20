const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();
const db = require("./db");
const userRoutes = require("./routes/UserRoutes");
const hostingRoutes = require("./routes/hostingRoutes");
const domainRoutes = require("./routes/domainRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const passport = require("./middleware/auth");
const socialPassport = require("./middleware/socialAuth");
const cors = require("cors");
const path = require("path");

// Packages
app.use(cors());
const PORT = process.env.PORT || 8080;
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(passport.initialize());
app.use(socialPassport.initialize());
const authMiddleware = passport.authenticate("local", { session: false });

// Routes
app.use("/user", userRoutes);
app.use("/hosting", hostingRoutes);
app.use("/domain", domainRoutes);
app.use("/api", orderRoutes);
app.use("/contact", contactRoutes);
app.use("/service", serviceRoutes);

app.listen(PORT, () => {
  console.log(`Listening the port ${PORT}`);
});
