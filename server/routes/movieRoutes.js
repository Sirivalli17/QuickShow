import express from "express";
import { getAllMovies } from "../controllers/movieController.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin/movies", protectAdmin, getAllMovies);

export default router;
