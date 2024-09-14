const { validationResult } = require("express-validator");


const ensureLoggedIn = (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        return next();
    }
    else if (req.user) {
        return next();
    } else {
        return res.status(401).end();
    }
}

const vaildateParameters = (req, res, next) => {
    let errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    let extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
    return res.status(422).json({
        errors: extractedErrors,
    });
};

module.exports = {
    ensureLoggedIn,
    vaildateParameters,
};