
const ensureHR = (req, res, next) => {
    if (req.user.role === "HR") {
        return next();
    } else {
        return res.status(403).end();
    }
}

const ensureManagerAndAbove = (req, res, next) => {
    if (req.user.role === "Manager" || req.user.role === "HR") {
        return next();
    } else {
        return res.status(403).end();
    }
}

const ensureManager = (req, res, next) => {
    if (req.user.role === "Manager") {
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

module.exports = {
    ensureLoggedIn,
    ensureManager,
    ensureHR
};