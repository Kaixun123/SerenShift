const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class Schedule extends Model { }

Schedule.init(
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
            allowNull: false,
        },
        verify_timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        linked_schedule: {
            type: DataTypes.INTEGER(6),
            allowNull: true,
        }
    },
    {
        sequelize,
        timestamps: true,
        createdAt: 'created_timestamp',
        updatedAt: 'last_update_timestamp',
        modelName: 'Schedules',
    }
);

module.exports = Schedule;