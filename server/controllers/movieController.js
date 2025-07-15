import Movie from "../models/Movie.js";

export const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, movies });
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
