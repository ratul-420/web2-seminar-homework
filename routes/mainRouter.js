const router = require("express").Router();
const controller = require("../controllers/mainController");
const contactController = require("../controllers/contactController");
const messagesController = require("../controllers/messagesController");

isLoggedIn=(req,res,next)=>{
    if(req.session.user){return next();}
    res.redirect("/login");
}
isAdmin=(req,res,next)=>{
    if(req.session.user && req.session.user.role==="admin"){return next();}
    res.redirect("/");
}

router.get("/", controller.homeIndex);
router.get("/register", controller.registerGet);
router.post("/register", controller.registerPost);
router.get("/login", controller.loginGet);
router.post("/login", controller.loginPost);
router.get("/logout", controller.logout);
router.get("/user", isLoggedIn, controller.userIndex);
router.get("/admin", isAdmin, controller.adminIndex);
router.get("/contact", contactController.showContact);
router.post("/contact", contactController.submitContact);
router.get("/messages", isLoggedIn, messagesController.showMessages);
module.exports = router;