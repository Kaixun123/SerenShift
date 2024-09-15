const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class Employee extends Model { }

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    position: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    reporting_manager: {
      type: DataTypes.INTEGER(6),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM,
      values: ['HR', 'Staff', 'Manager'],
      allowNull: false,
      defaultValue: 'Staff',
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER(6),
      allowNull: true,
    },
    created_by_system: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_update_by: {
      type: DataTypes.INTEGER(6),
      allowNull: true,
    },
    last_update_by_system: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: 'created_timestamp',
    updatedAt: 'last_update_timestamp',
    tableName: "Employees",
  }
);

module.exports = Employee;