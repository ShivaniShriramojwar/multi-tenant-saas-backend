import { Router } from "express";
import { verifyToken } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { searchController } from "./search.controller";
import { searchQuerySchema } from "./search.validation";

const router = Router();

router.get(
  "/",
  verifyToken,
  validate({ query: searchQuerySchema }),
  searchController,
);

export default router;
