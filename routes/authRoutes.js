const express=require("express"); const c=require("../controllers/authController"); const v=require("../middleware/validate"); const router=express.Router();
router.post("/register",v.register,c.register); router.post("/login",v.login,c.login); module.exports=router;
