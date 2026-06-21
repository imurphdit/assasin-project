require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bp = require("body-parser");
const session = require("express-session");
const api = require("./routes/api");
const sequelize = require("./sequelizeConfig");
const Agent = require("./models/agent.model");
const { auth, adminAuth, agentPageAuth } = require("./middleware");
const { setup } = require("./controllers/setup.controller");
const {
  agentPage,
  handleLogin,
  adminPage,
} = require("./controllers/auth.controller");

// Copied this from web :( adds timestamps to all console logs.
const originalConsoleLog = console.log;
console.log = function (...args) {
  const timestamp = new Date().toLocaleString();
  originalConsoleLog.apply(console, [`[${timestamp}]`, ...args]);
};

//SYNC DATABASE
sequelize.sync({ force: process.env.NODE_ENV !== "production" }).then(() => {
  console.log("Database is connected");
  checkSetup();
});

const checkSetup = async () => {
  const users = await Agent.findAll();
  if (users.length === 0) {
    console.log("Run Setup @ /setup");
  }
};

app.enable("trust proxy");

app.set("view engine", "ejs");
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

app.use(
  session({
    secret: process.env.KEY || "aUniqueKeyLol",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    },
  }),
);

app.get("/admin", adminAuth, adminPage);

app.get("/login", (req, res) => {
  res.render("login");
});

// REDIRECT TO AGENT PAGE VIA PIN
app.post("/login", handleLogin);

//LOAD AGENT PAGE VIA UUID
app.get("/agent/:id", auth, agentPageAuth, agentPage);

//API ROUTES
app.use("/api", api);

//Setup
app.get("/setup", setup);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
