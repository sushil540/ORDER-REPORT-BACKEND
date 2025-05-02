import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import orderCtlr from "../controllers/orderController.js";

const router = express.Router();

router.post("/create", authMiddleware, orderCtlr.create);
router.post("/view", authMiddleware, orderCtlr.view);
router.get("/get-all", authMiddleware, orderCtlr.getAllOrders);
router.put("/update", authMiddleware, orderCtlr.update);
router.delete("/delete", authMiddleware, orderCtlr.delete);

export default router;
