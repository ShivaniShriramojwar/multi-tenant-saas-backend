import { Router } from "express";
import { registerController } from "./register.controller";

const router = Router();

// ✅ ONLY "/"
router.post("/", registerController);

export default router;
