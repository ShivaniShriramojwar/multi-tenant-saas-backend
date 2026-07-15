import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import { searchService } from "./search.service";

const searchController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const results = await searchService(req.user!, req.query as any);

    return res.status(200).json({
      message: "Search results fetched successfully",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export { searchController };
