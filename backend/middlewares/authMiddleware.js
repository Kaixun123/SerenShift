const jwt = require('jsonwebtoken');

const ensureHR = (req, res, next) => {
    if (req.user == null) {
        return res.status(401).end();
    }
    if (req.user.role === "HR") {
        return next();
    } else {
        return res.status(403).end();
    }
}

const ensureManagerAndAbove = (req, res, next) => {
    if (req.user == null) {
        return res.status(401).end();
    }
    else if (req.user.role === "Manager" || req.user.role === "HR") {
        return next();
    } else {
        return res.status(403).end();
    }
}

const ensureManager = (req, res, next) => {
    if (req.user == null) {
        return res.status(401).end();
    }
    else if (req.user.role === "Manager") {
        return next();
    } else {
        return res.status(403).end();
    }
}

const ensureLoggedIn = (req, res, next) => {
    if (req.user) {
        return next();
    } else {
        return res.status(401).end();
    }
}

// Middleware to authenticate JWT in cookies
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.jwt;  // Access the token from cookies

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }

        req.user = decoded;  // Attach the decoded user info to the request
        next();  // Move to the next middleware or route handler
    });
};


module.exports = {
    ensureLoggedIn,
    ensureManager,
    ensureManagerAndAbove,
    ensureHR,
    authenticateJWT
};