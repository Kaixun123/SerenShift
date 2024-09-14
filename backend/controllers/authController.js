const { Op } = require("sequelize")
const Employee = require("../models")
const { ERROR_CODE } = require("../services/error/errorHandling")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
    try {
        let { user, password } = req.body
        let userAccount = await Employee.findOne({
            where: {
                email: user
            }
        }).then((result) => {
            return result.dataValues
        }).catch((err) => {
            throw new Error(err)
        })

        if (!userAccount) {
            return res.status(403).json({
                status: 403,
                message: "Invalid credentials"
            })
        }
        let hash = await bcrypt.hash(password, userAccount.salt)
        if (hash !== userAccount.password) {
            return res.status(403).json({
                status: 403,
                message: "Invalid credentials"
            })
        } else {
            // Generate JWT
            let retrievedEmployee = await Employee.findOne({
                where: {
                    email: user
                }
            });
            // Setting Cookie
            const token = jwt.sign({
                id: retrievedEmployee.id,
                email: retrievedEmployee.email,
                first_name: retrievedEmployee.first_name,
                last_name: retrievedEmployee.last_name,
                role: retrievedEmployee.role
            }, process.env.TOKEN_KEY, {
                expiresIn: "7d"
            })
            res.cookie("user", {
                id: retrievedEmployee.id,
                email: retrievedEmployee.email,
                first_name: retrievedEmployee.first_name,
                last_name: retrievedEmployee.last_name,
                role: retrievedEmployee.role,
                token: token
            }, {
                maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
                httpOnly: true,
                signed: true,
                secure: process.env.NODE_ENV === "production" ? true : false,
            })

            return res.status(200).json({
                status: 200,
                message: "Login Successful",
                data: user_data
            })
        }

    } catch (err) {
        console.log({ err })
        return res.status(500).send({
            status: 500,
            ...ERROR_CODE.INTERNAL_SERVER_ERROR
        })
    }
}
const logout = async (req, res) => {
    try {
        res.clearCookie("user")
        return res.status(200).send({
            status: 200,
            message: "Logout Successful"
        })
    } catch (err) {
        console.log(`ERROR: ${JSON.stringify(err)}`)
        return res.status(500).send({
            status: 500,
            ...ERROR_CODE.INTERNAL_SERVER_ERROR
        })
    }
}
const register = async (req, res) => {
    try {
        let {
            first_name,
            last_name,
            email,
            password,
            country,
            department,
            position,

        } = req.body

        let account_search = await Employee.findAll({
            where: {
                [Op.or]: [
                    { email },
                ]
            }
        }).then((result) => {
            return result
        }).catch((err) => {
            throw new Error(err)
        })

        if (account_search.length > 0) {
            throw new Error("Account already exists")
        }

        let salt = await bcrypt.genSalt(10)
        let hash = await bcrypt.hash(password, salt)

        let account_creation = await Employee.create({
            first_name,
            last_name,
            email: email.toLowerCase(),
            password: hash,
            salt,
            country,
            department,
            position,
        }).then((result) => {
            return result
        }).catch((err) => {
            throw new Error(err)
        })

        return res.status(200).send({
            status: 200,
            message: "Account created successfully"
        })
    } catch (err) {
        console.log(`ERROR: ${err}`)
        return res.status(500).send({
            status: 500,
            ...ERROR_CODE.INTERNAL_SERVER_ERROR
        })
    }
}
const authorisation = async (req, res) => {
    try {
        return res.status(200).json({
            status: 200,
            message: "Authentication Successful",
        })
    } catch (err) {
        console.log(`ERROR: ${err}`)
        return res.status(500).send({
            status: 500,
            ...ERROR_CODE.INTERNAL_SERVER_ERROR
        })
    }
}

module.exports = {
    login,
    logout,
    register,
    authorisation
}