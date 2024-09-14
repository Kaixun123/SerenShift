const jwt = require("jsonwebtoken");
require("dotenv").config();
const config = process.env;


const authorisation = (role) => {
    return (req, res, next) => {
        let user = req.signedCookies;
        let xAccessToken = req.headers["x-access-token"];
        if (xAccessToken) {
            token = xAccessToken
            token = JSON.stringify(token).replaceAll('"', '').replaceAll(' ', '').replaceAll("\\", "")
            const decoded = jwt.verify(token, config.TOKEN_KEY);
            user = decoded.account_type;
        }else{
            user = user?.user?.account_type
        }

        if (convertToRole(user) >= convertToRole(role)) {
            return next();
        } else {
            console.log("Not authorised.");
            return res.status(404).send({
                auth: false,
                message: "You are not authorised to access this page.",
                status: 404,
                payload: null
            });
        }

    };
};

const convertToRole = (role) => {
    switch (role) {
        case "HR":
            return 1;
        case "Staff":
            return 2;
        case "Manager":
            return 3;
        default:
            return 0;
    }
}

module.exports = authorisation;