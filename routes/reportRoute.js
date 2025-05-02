import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import reportCtlr from "../controllers/reportController.js";

const router = express.Router();

router.post("/create", authMiddleware, reportCtlr.report);
// router.post("/view", authMiddleware, reportCtlr.view);

export default router;
