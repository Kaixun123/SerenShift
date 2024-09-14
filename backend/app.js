//Import Files and Modules
"use strict";
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
const cookieSession = require("cookie-session");
// const config = require("./server-config");
var fs = require("fs");
var proxy = require("express-http-proxy");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT | 4000;
app.use(express.static("./public"));
app.use(morgan("tiny"));

app.use(helmet({}));

app.use(cookieParser(process.env.TOKEN_KEY));

const corsOptions = {
  origin: true,
  credentials: true, //included credentials as true
  preflightContinue: true,
};

app.use(cors(corsOptions));

app.use(express.static("./public"));
app.use(morgan("tiny"));

var jsonParser = bodyParser.json();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,Content-Type, Authorization,Authentication,withCredentials, Content-Length, X-Requested-With, Accept, x-access-token,credentials, Origin, X-Content-Type-Options"
  );
  res.header(
    "Access-Control-Expose-Headers",
    "x-access-token, Authorization, Authentication, withCredentials, credentials, Set-Cookie"
  );
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

// App Routes
app.use("/auth", require("./routes/authHandling"));

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

var server = app.listen(PORT, () => {
  console.info(`server is running on port ${PORT}`);
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