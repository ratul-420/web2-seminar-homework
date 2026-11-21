const Message = require("../models/Message");

exports.showMessages = async (req, res, next) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: -1, _id: -1 })
            .lean();

        res.render("messages", { messages });
    } catch (error) {
        next(error);
    }
};