const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class ApplicationModel extends Model { }

ApplicationModel.init(
  {
    application_id: {
      type: DataTypes.INTEGER(6),
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
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    created_timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    last_update_by: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    last_update_timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verify_by: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    verify_timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    linked_application: {
      type: DataTypes.INTEGER(6),
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    requestor_remarks: {
      type: DataTypes.STRING(255)
    },
    approver_remarks: {
      type: DataTypes.STRING(255)
    }
  },
  {
    sequelize,
    modelName: "ApplicationModel",
    modelName: "application"
  }
);

module.exports = ApplicationModel;