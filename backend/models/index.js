const Application = require('./Application');
const Blacklist = require('./Blacklist');
const Employee = require('./Employee');
const File = require('./File');
const Notification = require('./Notification');
const Schedule = require('./Schedule');
const Session = require('./Session');

Employee.hasMany(Employee, {
    foreignKey: 'reporting_manager',
    as: 'subordinates',
});

Employee.belongsTo(Employee, {
    foreignKey: 'reporting_manager',
    as: 'manager',
});

Employee.hasMany(Employee, {
    foreignKey: 'created_by',
})

Employee.belongsTo(Employee, {
    foreignKey: 'created_by',
});

Employee.hasMany(Employee, {
    foreignKey: 'last_update_by',
})

Employee.belongsTo(Employee, {
    foreignKey: 'last_update_by',
});

Employee.hasMany(Application, {
    foreignKey: 'created_by',
    as: 'applications',
});

Application.belongsTo(Employee, {
    foreignKey: 'created_by',
    as: 'creator',
});

Employee.hasMany(Application, {
    foreignKey: 'last_update_by',
    as: 'applications_updated',
});

Application.belongsTo(Employee, {
    foreignKey: 'last_update_by',
    as: 'updater',
});

Employee.hasMany(Application, {
    foreignKey: 'verify_by',
    as: 'applications_verified',
});

Application.belongsTo(Employee, {
    foreignKey: 'verify_by',
    as: 'verifier',
});

Employee.hasMany(Schedule, {
    foreignKey: 'created_by',
    as: 'schedules',
});

Schedule.belongsTo(Employee, {
    foreignKey: 'created_by',
    as: 'creator',
});

Employee.hasMany(Schedule, {
    foreignKey: 'last_update_by',
    as: 'schedules_updated',
});

Schedule.belongsTo(Employee, {
    foreignKey: 'last_update_by',
    as: 'updater',
});

Employee.hasMany(Schedule, {
    foreignKey: 'verify_by',
    as: 'schedules_verified',
});

Schedule.belongsTo(Employee, {
    foreignKey: 'verify_by',
    as: 'verifier',
});

Employee.hasMany(Blacklist, {
    foreignKey: 'created_by',
    as: 'blacklists',
});

Blacklist.belongsTo(Employee, {
    foreignKey: 'created_by',
    as: 'creator',
});

Employee.hasMany(Blacklist, {
    foreignKey: 'last_update_by',
    as: 'blacklists_updated',
});

Blacklist.belongsTo(Employee, {
    foreignKey: 'last_update_by',
    as: 'updater',
});

Employee.hasMany(File, {
    foreignKey: 'created_by',
    as: 'files',
});

File.belongsTo(Employee, {
    foreignKey: 'created_by',
    as: 'creator',
});

Employee.hasMany(File, {
    foreignKey: 'last_update_by',
    as: 'files_updated',
});

File.belongsTo(Employee, {
    foreignKey: 'last_update_by',
    as: 'updater',
});

Employee.hasMany(Notification, {
    foreignKey: 'sender_id',
    as: 'sent_notifications',
});

Notification.belongsTo(Employee, {
    foreignKey: 'sender_id',
    as: 'sender',
});

Employee.hasMany(Notification, {
    foreignKey: 'recipient_id',
    as: 'received_notifications',
});

Notification.belongsTo(Employee, {
    foreignKey: 'recipient_id',
    as: 'recipient',
});

Employee.hasMany(Notification, {
    foreignKey: 'created_by',
});

Notification.belongsTo(Employee, {
    foreignKey: 'created_by',
});

Employee.hasMany(Notification, {
    foreignKey: 'last_update_by',
});

Notification.belongsTo(Employee, {
    foreignKey: 'last_update_by',
});


module.exports = {
    Application,
    Blacklist,
    Employee,
    File,
    Notification,
    Schedule,
    Session,
};