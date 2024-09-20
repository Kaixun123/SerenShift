const { Employee } = require('../../models');

async function fetchColleagues (userId) {
    let currentEmployee = await Employee.findByPk(userId);
    let colleagues = await Employee.findAll({
        where: {
            reporting_manager: currentEmployee.reporting_manager,
        }
    });
    
    let response = [];
    colleagues.forEach(colleague => {
        response.push({
            user_id: colleague.id,
            first_name: colleague.first_name,
            last_name: colleague.last_name,
            department: colleague.department,
            position: colleague.position,
            country: colleague.country,
            email: colleague.email,
        });
    });

    return response;  // Return the colleague data instead of sending a response
}

module.exports = {
    fetchColleagues
};