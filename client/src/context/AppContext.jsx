import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEffect } from "react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

export const AppContext = createContext()

export const AppProvider = ({ children }) => {

    const [isAdmin, setIsAdmin] = useState()
    const [shows, setShows] = useState([])
    const [favoriteMovies, setFavoriteMovies] = useState([])

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const {user} = useUser()
    const {getToken} = useAuth()
    const location = useLocation() 
    const navigate = useNavigate()

    const fetchIsAdmin = async () => {
  try {
    const token = await getToken(); 
    console.log("Clerk Token from Frontend:", token); 
    if (!token) {
      console.warn("Token not ready yet, skipping isAdmin check.");
      return;
    }

    const response = await axios.get('/api/admin/is-admin', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setIsAdmin(response.data.isAdmin); // ✅ FIXED

    if (!response.data.isAdmin && location.pathname.startsWith('/admin')) {
      navigate('/');
      toast.error('You are not authorized to access Admin Dashboard.');
    }

  } catch (error) {
    console.error(error);
    if (error.response && error.response.status === 401) {
      toast.error("Unauthorized: Please sign in again.");
    } else {
      toast.error("Something went wrong fetching admin status.");
    }
  }
}


    const fetchShows = async ()=> {
        try {

            const {data} = await axios.get('/api/show/all')
            if(data.success) {
                setShows(data.shows)
            }else {
                toast.error(data.message)
            }

        }catch (error) {
            console.error(error);
        }
    }

    const fetchFavoriteMovies = async ()=> {
        try {
            
            console.log("CLERK TOKEN", await getToken());
            const { data } = await axios.get('/api/user/favorites', 
            {headers: 
                {Authorization: `Bearer ${await getToken()}`}
            })

            if(data.success) {
                setFavoriteMovies(data.movies)
            }else {
                toast.error(data.message)
            }

        } catch(error) {
            console.error(error);
        }
    }

    useEffect(()=> {
        fetchShows()
    },[])

    useEffect(()=> {
        if(user) {
        fetchIsAdmin()
        fetchFavoriteMovies()
        }
    },[user])

    const value = {
        axios,
        fetchIsAdmin,
        user, getToken, navigate, isAdmin, shows,
        favoriteMovies, fetchFavoriteMovies, image_base_url
    }

    return (
        <AppContext.Provider value={value}>
            { children }
        </AppContext.Provider>
    )
}

export const useAppContext = ()=> useContext(AppContext)