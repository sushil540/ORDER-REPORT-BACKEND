import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import salesPersonCtlr from "../controllers/salesPersonController.js";

const router = express.Router();

router.post("/create", authMiddleware, salesPersonCtlr.create);
router.post("/view", authMiddleware, salesPersonCtlr.view);
router.get("/get-all", authMiddleware, salesPersonCtlr.getAllSalesPersons);
router.put("/update", authMiddleware, salesPersonCtlr.update);
router.delete("/delete", authMiddleware, salesPersonCtlr.delete);

export default router;
