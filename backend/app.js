//Import Files and Modules
"use strict";
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const app = express();

require("dotenv").config();
const EXPRESS_PORT = process.env.EXPRESS_PORT;
const { sequelize } = require("./services/database/mysql");

const passport = require("passport");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
require("./services/security/passport");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new SequelizeStore({
      db: sequelize,
      checkExpirationInterval: 15 * 60 * 1000,
      expiration: 1 * 60 * 60 * 1000,
    }),
    resave: false,
    saveUninitialized: false,
    proxy: false,
    cookie: {
      secure: false,
      httpOnly: true,
      path: "/",
    },
  })
);

app.use(helmet({}));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

let corsOptions = {
  origin: true,
  credentials: true, //included credentials as true
  preflightContinue: true,
};

app.use(cors(corsOptions));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("./public"));
app.use(morgan("tiny"));

// App Routes
app.use("/auth", require("./routes/authHandling"));
app.use("/dummy", require("./routes/dummyHandling"));

//Error Handling
app.use((req, res, next) => {
  const error = new Error("Not Found");
  console.log(`Unrecognised Request: ${req.originalUrl}`);
  error.status = 404;
  next(error);
  res.status(404).json({
    status: 404,
    message: "Not Found",
  });
});

var server = null;
sequelize.sync().then(() => {
  server = app.listen(EXPRESS_PORT, () => {
    console.info(`server is running on port ${EXPRESS_PORT}`);
    if (process.send) {
      process.send("ready");
    }
  });
});

process.on("SIGINT", () => {
  console.info("SIGINT signal received");
  server.close(function (err) {
    if (err) {
      console.error(err);
    }
    process.exit(err ? 1 : 0);
  });
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received");
  server.close(function (err) {
    if (err) {
      console.error(err);
    }
    process.exit(err ? 1 : 0);
  });
});