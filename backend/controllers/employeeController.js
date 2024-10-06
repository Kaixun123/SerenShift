const { Employee } = require('../models');
const { fetchColleagues, fetchSubordinates } = require('../services/common/employeeHelper');

// Function to return colleagues via res
const retrieveColleagues = async (req, res, next) => {
    try {
        const colleagues = await fetchColleagues(req.user.id);
        return res.status(200).json(colleagues);
    } catch (error) {
        console.error("Error retrieving colleagues:", error);
        return res.status(500).json({ error: "An error occurred while retrieving colleagues" });
    }
}

// New function to return subordinates via res
const retrieveSubordinates = async (req, res, next) => {
    try {
        const subordinates = await fetchSubordinates(req.user.id);
        return res.status(200).json(subordinates);
    } catch (error) {
        console.error("Error retrieving subordinates:", error);
        return res.status(500).json({ error: "An error occurred while retrieving subordinates" });
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
    retrieveSubordinates,
    getEmployee,
};

