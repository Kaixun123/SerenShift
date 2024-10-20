'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //Create Blacklist table
    await queryInterface.createTable('Blacklist', {
      blacklist_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(),
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('Blacklist');
  }
};
