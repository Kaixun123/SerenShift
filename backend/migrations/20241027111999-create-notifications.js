'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //Create Notifications table
    await queryInterface.createTable('Notifications', {
      notification_id: {
        type: Sequelize.INTEGER(),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      notification_type: {
        type: Sequelize.STRING(25),
        allowNull: false,
      },
      content: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      read_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sender_id: {
        type: Sequelize.INTEGER(6),
        allowNull: true,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      recipient_id: {
        type: Sequelize.INTEGER(6),
        allowNull: true,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      deleted_timestamp: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Notifications');
  }
};
