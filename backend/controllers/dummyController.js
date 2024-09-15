const { Employee } = require('../models');

const manager = (req, res, next) => {
    return res.status(200).json({ message: 'Only Managers should be able to see this' });
}

const hr = (req, res, next) => {
    return res.status(200).json({ message: 'Only HR should be able to see this' });
}

const employee = (req, res, next) => {
    return res.status(200).json({ message: 'Only logged in employees should be able to see this' });
}

const anybody = (req, res, next) => {
    return res.status(200).json({ message: 'Anybody can see this' });
}

const retrieveColleagues = async (req, res, next) => {
    let currentEmployee = await Employee.findByPk(req.user.id);
    let colleagues = await Employee.findAll({
        where: {
            reporting_manager: currentEmployee.reporting_manager,
        }
    });
    let response = [];
    colleagues.forEach(colleague => {
        response.push({
            first_name: colleague.first_name,
            last_name: colleague.last_name,
            department: colleague.department,
            position: colleague.position,
            country: colleague.country,
            email: colleague.email,
        });
    });
    return res.status(200).json(response);
}

const getEmployee = async (req, res, next) => {
    let retrievedEmployee = await Employee.findByPk(req.query.id);
    let response = {
        first_name: retrievedEmployee.first_name,
        last_name: retrievedEmployee.last_name,
        department: retrievedEmployee.department,
        position: retrievedEmployee.position,
        country: retrievedEmployee.country,
        email: retrievedEmployee.email,
    }
    return res.status(200).json(response);
}

module.exports = {
    manager,
    hr,
    employee,
    anybody,
    retrieveColleagues,
    getEmployee,
};