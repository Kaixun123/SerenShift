const { Op } = require("sequelize")
const EmployeeModel = require("../models/EmployeeModel")
const { ERROR_CODE } = require("../services/error/errorHandling")
const bcrypt = require("bcryptjs")
const { get_account_entity_by_id_admin, get_account_entity_by_id_public } = require("../middlewares/authMiddleware")
const jwt = require("jsonwebtoken");
const { get_user_id } = require("../services/database/accountService")

const login = async (req, res) => {
    try {
        let { user, password } = req.body
        let userAccount = await EmployeeModel.findOne({
            where: {
                [Op.or]: [
                    { email: user.toLowerCase() },
                    { contact_number: user.toLowerCase() }
                ]
            }
        }).then((result) => {
            return result.dataValues
        }).catch((err) => {
            throw new Error(err)
        })

        if (!userAccount) {
            throw new Error("Invalid credentials")
        }

        let hash = await bcrypt.hash(password, userAccount.salt)

        if (userAccount.account_lock_till) {
            let now = new Date()
            if (now < userAccount.account_lock_till) {
                throw new Error("Account is locked")
            }
        }

        if (hash !== userAccount.password) {
            let update_account = await EmployeeModel.update({
                password_retries: userAccount.password_retries + 1,
                account_lock_till: userAccount.password_retries + 1 >= 5 ? new Date(new Date().getTime() + 5 * 60000) : null
            }, {
                where: {
                    id: userAccount.id
                }
            }).then((result) => {
                return result
            }).catch((err) => {
                throw new Error(err)
            })
            throw new Error("Invalid credentials")
        } else {
            // Check if account is locked
            let update_account = await EmployeeModel.update({
                password_retries: 0,
                account_lock_till: null,
                last_login: new Date()
            }, {
                where: {
                    id: userAccount.id
                }
            }).then((result) => {
                return result
            }).catch((err) => {
                console.log(err)
                throw new Error(err)
            })

            // Generate JWT
            let user_data = await get_account_entity_by_id_admin(userAccount?.id)
            // Setting Cookie
            const token = jwt.sign({
                id: user_data.id,
                email: user_data.email,
                first_name: user_data.first_name,
                account_type: user_data.account_type
            }, process.env.TOKEN_KEY, {
                expiresIn: "7d"
            })
            res.cookie("user", {
                id: user_data.id,
                email: user_data.email,
                first_name: user_data.first_name,
                last_name: user_data.last_name,
                account_type: user_data.account_type,
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
        console.log({err})
        return res.status(500).send({
            status: 500,
            ...ERROR_CODE.INTERNAL_SERVER_ERROR
        })
    }
}
const logout = async (req, res) => {
    try {

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
            contact_number,
        } = req.body

        let account_search = await EmployeeModel.findAll({
            where: {
                [Op.or]: [
                    { email },
                    { contact_number }
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

        let account_creation = await EmployeeModel.create({
            first_name,
            last_name,
            email: email.toLowerCase(),
            contact_number,
            password: hash,
            salt
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
        let user_id = await get_user_id(req)
        let user_data = await get_account_entity_by_id_admin(user_id)
        return res.status(200).json({
            status: 200,
            message: "Authentication Successful",
            data: user_data
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