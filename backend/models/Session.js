const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class Session extends Model { }

Session.init(
    {
        sid: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        expires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        timestamps: true,
        createdAt: 'created_timestamp',
        updatedAt: 'last_update_timestamp',
        modelName: 'Sessions',
    }
);

module.exports = Session;