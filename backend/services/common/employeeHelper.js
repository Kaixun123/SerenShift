const { Employee } = require('../../models');

// Function to fetch colleagues
const fetchColleagues = async (userId) => {
    let currentEmployee = await Employee.findByPk(userId);
    let colleagues = await Employee.findAll({
        where: {
            reporting_manager: currentEmployee.reporting_manager,
        }
    });

    let response = colleagues
        .filter(colleague => colleague.id != userId)
        .map(colleague => ({
            user_id: colleague.id,
            first_name: colleague.first_name,
            last_name: colleague.last_name,
            department: colleague.department,
            position: colleague.position,
            country: colleague.country,
            email: colleague.email,
        }));

    return response;
};

// Function to fetch subordinates
const fetchSubordinates = async (userId) => {
    let subordinates = await Employee.findAll({
        where: {
            reporting_manager: userId,
        }
    });

    let response = subordinates.map(subordinate => ({
        user_id: subordinate.id,
        first_name: subordinate.first_name,
        last_name: subordinate.last_name,
        department: subordinate.department,
        position: subordinate.position,
        country: subordinate.country,
        email: subordinate.email,
    }));

    return response;
};

module.exports = {
    fetchColleagues,
    fetchSubordinates,
};
