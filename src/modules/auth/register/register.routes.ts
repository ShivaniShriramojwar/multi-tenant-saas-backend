import { Router } from "express";
import { validate } from "../../../common/middleware/validate.middleware";
import { registerController } from "./register.controller";
import { registerSchema } from "./register.validation";

const router = Router();

// ✅ ONLY "/"
router.post("/", validate({ body: registerSchema }), registerController);

export default router;
