const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class EmployeeModel extends Model {}

EmployeeModel.init(
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
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      reporting_manager: {
        type: DataTypes.INTEGER(6),
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id'
        }
      },
      role: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: 1
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      salt: {
        type: DataTypes.STRING,
        allowNull: false
      },
      created_by:{
        type: DataTypes.STRING(100),
        allowNull: false
      },
      created_by_system:{
        type: DataTypes.STRING(100),
      },
      created_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      last_update_by:{
        type: DataTypes.STRING(100),
        allowNull: false
      },
      last_update_by_system:{
        type: DataTypes.STRING(100),
      },
      last_update_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
        sequelize,
        modelName: "EmployeeModel",
        modelName: "employees"
    }
);

module.exports = EmployeeModel;