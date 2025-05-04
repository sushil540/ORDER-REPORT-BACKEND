import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import reportCtlr from "../controllers/reportController.js";

const router = express.Router();

router.post("/create", authMiddleware, reportCtlr.report);
// router.post("/download", authMiddleware, reportCtlr.download);

export default router;
