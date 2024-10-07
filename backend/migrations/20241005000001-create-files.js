'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //Create Files table
    await queryInterface.createTable('Files', {
      file_id: {
        type: Sequelize.INTEGER(),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      file_name: {
        type: Sequelize.STRING(),
        allowNull: false,
      },
      file_extension: {
        type: Sequelize.STRING(),
        allowNull: false,
      },
      s3_key: {
        type: Sequelize.STRING(),
        allowNull: false,
        unique: true,
      },
      related_entity: {
        type: Sequelize.ENUM,
        values: ['Application', 'Blacklist'],
        allowNull: false,
        defaultValue: 'Application',
      },
      related_entity_id: {
        type: Sequelize.INTEGER(6),
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER(6),
        allowNull: true,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      last_update_by: {
        type: Sequelize.INTEGER(6),
        allowNull: true,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      last_update_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Files');
  }
};
