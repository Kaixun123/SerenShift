const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class Notification extends Model { }

Notification.init(
    {
        notification_id: {
            type: DataTypes.INTEGER(),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        notification_type: {
            type: DataTypes.STRING(25),
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        send_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        read_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        sender_id: {
            type: DataTypes.INTEGER(6),
            allowNull: false,
        },
        recipient_id: {
            type: DataTypes.INTEGER(6),
            allowNull: false,
        },
        linked_application_id: {
            type: DataTypes.INTEGER(),
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
    },
    {
        sequelize,
        timestamps: true,
        createdAt: 'created_timestamp',
        updatedAt: 'last_update_timestamp',
        tableName: "Notifications",
        paranoid: true,
        deletedAt: 'deleted_timestamp',
    }
);

module.exports = Notification;