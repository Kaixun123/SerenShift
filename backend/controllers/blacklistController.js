const { Blacklist, Employee } = require('../models');


// GET -  Retrieve Blacklist Dates When Indivdual Employee Is Applying
const getBlacklistDates = async (req, res) => {
    try {
        let requestor = await Employee.findByPk(req.user.id);
        if (!requestor) {
            return res.status(404).json({ message: "Employee Not Found" });
        }
        else if (requestor.reportingManager == null) {
            return res.status(400).json({ message: "Unable to determine Blacklisted Dates Due To No Reporitng Manager" });
        }
        let approver = await Employee.findByPk(requestor.reportingManager);
        if (!approver) {
            return res.status(400).json({ message: "Reporting Manager Not Found" });
        }
        let blacklistDates = [];
        if (req.body.start_date && req.body.end_date) {
            let normalisedStartDate = new Date(req.body.start_date);
            normalisedStartDate.setHours(0, 0, 0, 0);
            let normalisedEndDate = new Date(req.body.end_date);
            normalisedEndDate.setHours(23, 59, 59, 999);
            blacklistDates = await Blacklist.findAll({
                where: {
                    created_by: approver.id,
                    start_date: {
                        [Op.between]: [normalisedStartDate, normalisedEndDate]
                    },
                    end_date: {
                        [Op.between]: [normalisedStartDate, normalisedEndDate]
                    }
                }
            });
        } else if (req.body.start_date) {
            let normalisedStartDate = new Date(req.body.start_date);
            normalisedStartDate.setHours(0, 0, 0, 0);
            blacklistDates = await Blacklist.findAll({
                where: {
                    created_by: approver.id,
                    start_date: {
                        [Op.gte]: normalisedStartDate
                    }
                }
            });
        } else if (req.body.end_date) {
            let normalisedEndDate = new Date(req.body.end_date);
            normalisedEndDate.setHours(23, 59, 59, 999);
            blacklistDates = await Blacklist.findAll({
                where: {
                    created_by: approver.id,
                    end_date: {
                        [Op.lte]: normalisedEndDate
                    }
                }
            });
        } else {
            let normalisedStartDate = new Date();
            normalisedStartDate.setHours(0, 0, 0, 0);
            blacklistDates = await Blacklist.findAll({
                where: {
                    created_by: approver.id,
                    start_date: {
                        [Op.gte]: normalisedStartDate
                    }
                }
            });
        }
        if (!blacklistDates)
            return res.status(404).json({ message: "No Blacklist Dates Found" });
        else
            return res.status(200).json(blacklistDates);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// GET - Retrieve Blacklist Dates For Reporting Manager
const getBlacklistDatesManager = async (req, res) => {
    try {
        let manager = await Employee.findByPk(req.user.id);
        if (!manager)
            return res.status(404).json({ message: "Manager Not Found" });
        let blacklistDates = await Blacklist.findAll({
            where: {
                created_by: manager.id,
                start_date: {
                    [Op.gte]: new Date().setHours(0, 0, 0, 0)
                }
            }
        });
        if (!blacklistDates)
            return res.status(200).json([]);
        else
            return res.status(200).json(blacklistDates);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


// GET - Retrieve A Specific Blacklist Date
const getBlacklistDate = async (req, res) => {
    try {
        let blacklistDate = await Blacklist.findByPk(req.params.blacklist_id);
        if (!blacklistDate)
            return res.status(404).json({ message: "Blacklist Date Not Found" });
        else
            return res.status(200).json(blacklistDate);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


// POST - Create A New Blacklist Date
const createBlacklistDate = async (req, res) => {
    try {
        let conflictingDates = await Blacklist.findAll({
            where: {
                start_date: {
                    [Op.between]: [req.body.start_date, req.body.end_date]
                },
                end_date: {
                    [Op.between]: [req.body.start_date, req.body.end_date]
                },
                created_by: req.user.id
            }
        });
        if (conflictingDates.length > 0)
            return res.status(400).json({ message: "A Conflicting Blacklist Date Entry Already Exists" });
        let blacklistDate = await Blacklist.create({
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            created_by: req.user.id,
            last_update_by: req.user.id,
            remarks: req.body.remarks
        });
        return res.status(201).json({ message: "Blacklist Date Created Successfully", blacklist_id: blacklistDate.blacklist_id });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// PATCH - Update An Existing Blacklist Date
const updateBlacklistDate = async (req, res) => {
    try {
        let blacklistDate = await Blacklist.findByPk(req.params.blacklist_id);
        if (!blacklistDate)
            return res.status(404).json({ message: "Blacklist Date Not Found" });
        else if (blacklistDate.created_by != req.user.id)
            return res.status(403).json({ message: "Forbidden" });
        else if (new Date() > blacklistDate.start_date)
            return res.status(400).json({ message: "Blacklist Date Has Already Passed" });
        let conflictingDates = await Blacklist.findAll({
            where: {
                blacklist_id: {
                    [Op.ne]: req.params.blacklist_id
                },
                start_date: {
                    [Op.between]: [req.body.start_date, req.body.end_date]
                },
                end_date: {
                    [Op.between]: [req.body.start_date, req.body.end_date]
                },
                created_by: req.user.id
            }
        });
        if (conflictingDates.length > 0)
            return res.status(400).json({ message: "A Conflicting Blacklist Date Entry Already Exists" });
        blacklistDate.start_date = req.body.start_date;
        blacklistDate.end_date = req.body.end_date;
        blacklistDate.last_update_by = req.user.id;
        blacklistDate.remarks = req.body.remarks;
        await blacklistDate.save();
        return res.status(200).json({ message: "Blacklist Date Updated Successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// DELETE - Delete An Existing Blacklist Date
const deleteBlacklistDate = async (req, res) => {
    try {
        let blacklistDate = await Blacklist.findByPk(req.params.blacklist_id);
        if (!blacklistDate)
            return res.status(404).json({ message: "Blacklist Date Not Found" });
        else if (blacklistDate.created_by != req.user.id)
            return res.status(403).json({ message: "Forbidden" });
        else if (new Date() > blacklistDate.start_date)
            return res.status(400).json({ message: "Blacklist Date Has Already Passed" });
        await blacklistDate.destroy();
        return res.status(200).json({ message: "Blacklist Date Deleted Successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    getBlacklistDates,
    getBlacklistDatesManager,
    getBlacklistDate,
    createBlacklistDate,
    updateBlacklistDate,
    deleteBlacklistDate
}