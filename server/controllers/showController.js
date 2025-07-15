import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import axiosRetry from 'axios-retry';


//API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'en-US',
        page: 1
      },
      timeout: 15000,
      headers: {
    'Connection': 'keep-alive'
   }
    });

    const movies = data.results;
    return res.json({ success: true, movies });

  } catch (error) {
    // Log the error details
    console.error("Axios Error:", error.message);

    if (error.code === 'ECONNRESET') {
      console.error('❌ ECONNRESET: TMDB server forcibly closed the connection');
    } else if (error.response) {
      console.error(`❌ TMDB API error: ${error.response.status} - ${error.response.statusText}`);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("❌ No response received:", error.request);
    } else {
      console.error('❌ Request setup error:', error.message);
    }

    // Send single error response
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch now playing movies',
      error: error.message
    });
  }
};

axiosRetry(axios, { 
  retries: 3,
  retryCondition: (error) => error.code === 'ECONNRESET' || axiosRetry.isNetworkError(error)
});


//API to add new show to the database

export const addShow = async (req,res) => {
  try {
    const {movieId, showsInput, showPrice} = req.body

    let movie = await Movie.findById(movieId)

    if(!movie) {
      //Fetch Movie details and credits from TMDB API
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
            params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`,{
          params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'en-US'
          }
        })
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,

      }

      movie = await Movie.create(movieDetails);

    }

    const showsToCreate = [];
     console.log("🚨 showsInput:", JSON.stringify(showsInput, null, 2));
    // showsInput.forEach(show => {
    //   const showDate = show.date;
    //   if (!Array.isArray(show.time)) {
    //   throw new Error(`Invalid input: 'time' should be an array for show date ${showDate}`);
    //   }
    //   show.time.forEach((time) => {
    //     const dateTimeString = `${showDate}T${time}`;
    //     showsToCreate.push({
    //       movie: movieId,
    //       showDateTime: new Date(dateTimeString),
    //       showPrice,
    //       occupiedSeats: {}
    //     })
    //   })
    // });
    
  showsInput.forEach((show, idx) => {
  const showDate = show.date;

  let times = [];
  if (Array.isArray(show.time)) {
    times = show.time;
  } else if (typeof show.time === "string") {
    console.warn(`⚠️ Coercing 'time' from string to array at index ${idx}`);
    times = [show.time];
  } else {
    throw new Error(`Invalid input at index ${idx}: 'time' should be a string or array. Received: ${JSON.stringify(show.time)}`);
  }

  times.forEach((time) => {
    const dateTimeString = `${showDate}T${time}`;
    showsToCreate.push({
      movie: movieId,
      showDateTime: new Date(dateTimeString),
      showPrice,
      occupiedSeats: {}
    });
  });
});

    


    if(showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({ success: true, message: 'Show Added Successfully.' });
    
  }catch(error) {
    console.error("❌ Add Show Error:", error.message);
     console.error(error);
    res.json({ success: false, message: error.message });
  }
}

//API to get all shows from database
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDateTime: 1 });

    const uniqueMoviesMap = new Map();

    shows.forEach(show => {
      const movieId = show.movie._id.toString();
      if (!uniqueMoviesMap.has(movieId)) {
        uniqueMoviesMap.set(movieId, show.movie);
      }
    });

    res.status(200).json({ success: true, shows: Array.from(uniqueMoviesMap.values()) });
  } catch (error) {
    console.error("Get Shows Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//API to get single show from database
export const getShow = async (req, res) => {
  try {
    const {movieId} = req.params;
    //get all upcoming shows for the movie
    const shows = await Show.find({movie: movieId, showDateTime: {$gte: new Date() }})

    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if(!dateTime[date]) {
        dateTime[date] = []
      }
      dateTime[date].push({ time: show.showDateTime, showId: show._id})
    })

    res.json({ success: true, movie, showsByDate: dateTime });


  } catch(error) {
       console.error(error);
       res.json({ success: false, message: error.message });
  }
}
