const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class ScheduleModel extends Model { }

ScheduleModel.init(
    {
        schedule_id: {
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
        schedule_type: {
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
        linked_schedule: {
            type: DataTypes.INTEGER(6)
        }
    },
    {
        sequelize,
        modelName: "ScheduleModel",
        modelName: "schedule"
    }
);

module.exports = ScheduleModel;