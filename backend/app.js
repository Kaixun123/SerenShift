//Import Files and Modules
"use strict";
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
      table: 'Sessions',
      checkExpirationInterval: 15 * 60 * 1000, // check every 15 minutes
      expiration: 1 * 60 * 60 * 1000, // 1 hour expiry
    }),
    resave: false,
    saveUninitialized: false,
    proxy: false,
    cookie: {
      secure: false,
      httpOnly: true,
      path: "/",
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
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
app.use(cookieParser());

//API documentation
const APIdocumentation = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Serenshift Express API with Swagger",
      version: "0.1.0",
      description:
        "This is sernenshift made with Express and documented with Swagger",
      contact: {
        name: "Sereneshift",
        url: "https://www.ereceiptify.app",
        email: "serenShift@allinone.com",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
      },
    ],
  },
  apis: ["./routes/*.js", './controllers/*.js'],
}

const specs = swaggerJsdoc(APIdocumentation);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// CORN JOBS
require("./jobs");

// App Routes
app.use("/api/auth", require("./routes/authHandling"));
app.use("/api/application", require("./routes/applicationHandling"))
app.use("/api/blacklist", require("./routes/blacklistHandling"));
app.use("/api/employee", require("./routes/employeeHandling"));
app.use("/api/notification", require("./routes/notificationHandling"));
app.use("/api/schedule", require("./routes/scheduleHandling"));

//Error Handling
app.use((req, res, next) => {
  console.info(`Unrecognised Request: ${req.originalUrl}`);
  return res.status(404).json({
    status: 404,
    message: "Not Found",
  });
});

var server = null;
server = app.listen(EXPRESS_PORT, () => {
  console.info(`server is running on port ${EXPRESS_PORT}`);
  if (process.send) {
    process.send("ready");
  }
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
