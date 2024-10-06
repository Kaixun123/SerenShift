const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../services/database/mysql");

class File extends Model { }

File.init(
    {
        file_id: {
            type: DataTypes.INTEGER(),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        file_extension: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        s3_key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        related_entity: {
            type: DataTypes.ENUM,
            values: ['Application', 'Blacklist'],
            allowNull: false,
            defaultValue: 'Application',
        },
        related_entity_id: {
            type: DataTypes.INTEGER(6),
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
        tableName: "Files",
    }
);

module.exports = File;