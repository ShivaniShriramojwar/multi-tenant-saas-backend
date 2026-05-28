import { Router } from "express";
import { loginController } from "./login.controller";

const router = Router();

// Login API
router.post("/", loginController);

export default router;
