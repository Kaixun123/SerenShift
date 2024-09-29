const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Employee } = require('../models');

const login = (req, res) => {
    console.log('Request Body:', req.body);
    const { emailAddress, password } = req.body;
    if (!emailAddress || !password) {
        return res.status(422).json({ message: 'Email and password are required' });
    }

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
                secure: false,
                maxAge: 60 * 60 * 1000,
                sameSite: 'None',
            });
            return res.status(200).json({ message: 'Login successfully', token});
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

const validateToken = (req, res) => {
    console.log('Cookies:', req.cookies);
    const token = req.cookies.jwt;  // Access the JWT from cookies

    if (!token) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
        }

        // Token is valid, return success
        return res.status(200).json({ valid: true, message: 'Token is valid', user: decoded });
    });
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
    me,
    validateToken
};