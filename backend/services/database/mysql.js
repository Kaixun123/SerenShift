const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+08:00',
    logging: false,
  }
);

sequelize.authenticate().then(async () => {
  if (process.env.DB_SYNC === "true") {
    await sequelize.sync({ alter: true }).then(() => {
      console.log("Database synchrnoised");
    })
  }
  console.log("Connection has been established successfully,", process.env.DB_HOST, process.env.DB_NAME);
})
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = {
  sequelize,
};