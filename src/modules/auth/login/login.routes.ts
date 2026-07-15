import { Router } from "express";
import { validate } from "../../../common/middleware/validate.middleware";
import { loginController } from "./login.controller";
import { loginSchema } from "./login.validation";

const router = Router();

// Login API
router.post("/", validate({ body: loginSchema }), loginController);

export default router;
