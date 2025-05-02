import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import userCtlr from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", userCtlr.signup);
router.post("/login", userCtlr.login);
router.get("/user", authMiddleware, userCtlr.user);
router.get("/dashboard", authMiddleware, userCtlr.dashboard);

export default router;
