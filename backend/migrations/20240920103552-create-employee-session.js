'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Sessions table
    await queryInterface.createTable('Sessions', {
      sid: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      last_update_timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Create Employees table
    await queryInterface.createTable('Employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(6),
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      position: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      reporting_manager: {
        type: Sequelize.INTEGER(6),
        allowNull: true,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      role: {
        type: Sequelize.ENUM('HR', 'Staff', 'Manager'),
        allowNull: false,
        defaultValue: 'Staff',
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      salt: {
        type: Sequelize.STRING,
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
      created_by_system: {
        type: Sequelize.STRING(100),
        allowNull: true,
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
      last_update_by_system: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      created_timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      last_update_timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_timestamp: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Sessions');
    await queryInterface.dropTable('Employees');

  }
};
