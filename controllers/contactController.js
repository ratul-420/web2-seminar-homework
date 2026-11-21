const Message = require("../models/Message");

exports.showContact = (req, res) => {
    res.render("contact", { values: {}, error: "" });
};

exports.submitContact = async (req, res, next) => {
    const values = {};
    for (const field of ["name", "email", "subject", "message"]) {
        const value = req.body?.[field];
        values[field] = typeof value === "string" ? value.trim() : "";
    }

    try {
        await Message.create(values);
        req.session.message = "Your message was sent successfully.";
        return res.redirect("/contact");
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).render("contact", {
                values,
                error: "Complete all fields, enter a valid email, and stay within the character limits."
            });
        }
        return next(error);
    }
};