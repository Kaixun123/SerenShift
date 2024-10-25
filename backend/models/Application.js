const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class Application extends Model { }

Application.init(
  {
    application_id: {
      type: DataTypes.INTEGER(),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    application_type: {
      type: DataTypes.ENUM,
      values: ['Regular', 'Ad Hoc'],
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
    },
    last_update_by: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
    },
    verify_by: {
      type: DataTypes.INTEGER(6),
      allowNull: true,
    },
    verify_timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM,
      values: ['Pending', 'Approved', 'Rejected', 'Withdrawn'],
      allowNull: false,
    },
    requestor_remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    approver_remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    withdrawal_remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }
  },
  {
    sequelize,
    timestamps: true,
    createdAt: 'created_timestamp',
    updatedAt: 'last_update_timestamp',
    tableName: "Applications",
  }
);

module.exports = Application;