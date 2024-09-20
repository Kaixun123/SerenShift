'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
    });

    // Create Applications table
    await queryInterface.createTable('Applications', {
      application_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(6),
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      application_type: {
        type: Sequelize.ENUM('Regular', 'Ad Hoc'),
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
      verify_by: {
        type: Sequelize.INTEGER(6),
        allowNull: true,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      verify_timestamp: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      linked_application: {
        type: Sequelize.INTEGER(6),
        references: {
          model: 'Applications',
          key: 'application_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected', 'Withdrawn'),
        allowNull: false,
      },
      requestor_remarks: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      approver_remarks: {
        type: Sequelize.STRING(255),
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

    // Create Schedules table
    await queryInterface.createTable('Schedules', {
      schedule_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(6),
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      schedule_type: {
        type: Sequelize.ENUM('Regular', 'Ad Hoc'),
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
      verify_by: {
        type: Sequelize.INTEGER(6),
        allowNull: true,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      verify_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      linked_schedule: {
        type: Sequelize.INTEGER(6),
        references: {
          model: 'Schedules',
          key: 'schedule_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Employees');
    await queryInterface.dropTable('Schedules');
    await queryInterface.dropTable('Applications');
  }
};
