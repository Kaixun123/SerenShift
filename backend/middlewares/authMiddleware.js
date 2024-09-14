const EmployeeModel = require("../models/EmployeeModel")

const get_account_entity_by_id_public = async (id) => {
    return new Promise(async (resolve, reject) => {
        let user = await EmployeeModel.findOne({
            where: {
                id: id
            },
            attributes: ["first_name", "last_name","user_bio"]
        }).then((user) => {
            resolve(user?.dataValues)
        }).catch((err) => {
            reject(err)
        })
    })
}

const get_account_entity_by_id_admin = async (id) => {
    return new Promise(async (resolve, reject) => {
        let user = await EmployeeModel.findOne({
            where: {
                id: id
            },
            attributes: ["id","first_name", "last_name","user_bio", "email", "contact_number", "account_type", "account_remarks"]
        }).then((user) => {
            resolve(user?.dataValues)
        }).catch((err) => {
            reject(err)
        })
    })
}

const get_account_entity_by_id = async (id) => {
    return new Promise(async (resolve, reject) => {
        let user = await EmployeeModel.findOne({
            where: {
                id: id
            },
            attributes: {
                exclude: ["password","salt"]
            }
        }).then((user) => {
            resolve(user?.dataValues)
        }).catch((err) => {
            reject(err)
        })
    })
}


module.exports = {
    get_account_entity_by_id,
    get_account_entity_by_id_public,
    get_account_entity_by_id_admin
}