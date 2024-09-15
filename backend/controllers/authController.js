const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Employee } = require('../models');

const login = (req, res) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ error: err });
        if (!user) return res.status(401).json({ message: info.message });
        req.logIn(user, (err) => {
            if (err)
                return res.status(500).json({ error: err });
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: false
            });
            return res.status(200).json({ message: 'Login successfully' });
        });
    })(req, res);

};

const me = async (req, res) => {
    let retrievedEmployee = await Employee.findByPk(req.user.id);
    let retrievedManager = await Employee.findByPk(retrievedEmployee.reporting_manager);
    if (!retrievedEmployee)
        req.logout(() => {
            res.clearCookie('jwt');
            res.status(404).json({ message: 'Employee not found' });
        });
    else {
        let response = {
            id: retrievedEmployee.id,
            first_name: retrievedEmployee.first_name,
            last_name: retrievedEmployee.last_name,
            department: retrievedEmployee.department,
            position: retrievedEmployee.position,
            country: retrievedEmployee.country,
            email: retrievedEmployee.email,
            role: retrievedEmployee.role,
        }
        if (retrievedManager) {
            response.manager = {
                first_name: retrievedManager.first_name,
                last_name: retrievedManager.last_name,
                department: retrievedManager.department,
                position: retrievedManager.position,
                country: retrievedManager.country,
                email: retrievedManager.email,
            }
        }
        return res.status(200).json(response);
    }
}

const logout = (req, res) => {
    req.logout(() => {
        res.clearCookie('jwt');
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
}

module.exports = {
    login,
    logout,
    me
};