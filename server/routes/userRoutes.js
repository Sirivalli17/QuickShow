import express from "express";
import { getFavorite, getUserBookings, updateFavorite } from "../controllers/userController.js";
import { requireAuth } from "@clerk/express";

const userRouter = express.Router();

userRouter.use(requireAuth());
userRouter.get('/bookings', getUserBookings)
userRouter.post('/update-favorite', updateFavorite)
userRouter.get('/favorites', getFavorite)

export default userRouter;
