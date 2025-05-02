import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import customerCtlr from "../controllers/customerController.js";

const router = express.Router();

router.post("/create", authMiddleware, customerCtlr.create);
router.post("/view", authMiddleware, customerCtlr.view);
router.get("/get-all", authMiddleware, customerCtlr.getAllCustomers);
router.put("/update", authMiddleware, customerCtlr.update);
router.delete("/delete", authMiddleware, customerCtlr.delete);

export default router;
