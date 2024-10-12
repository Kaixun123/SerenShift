const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class Blacklist extends Model { }

Blacklist.init(
    {
        blacklist_id: {
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
        blacklist_type: {
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
    },
    {
        sequelize,
        timestamps: true,
        createdAt: 'created_timestamp',
        updatedAt: 'last_update_timestamp',
        tableName: "Blacklist",
    }
);

module.exports = Blacklist;