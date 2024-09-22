const { Employee } = require('../models');
const { fetchColleagues } = require('../services/common/employeeHelper');

// Original function to return colleagues directly via res
const retrieveColleagues = async (req, res, next) => {
    try {
        const colleagues = await fetchColleagues(req.user.id);
        return res.status(200).json(colleagues);
    } catch (error) {
        console.error("Error retrieving colleagues:", error);
        return res.status(500).json({ error: "An error occurred while retrieving colleagues" });
    }
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
    retrieveColleagues,
    getEmployee,
};
