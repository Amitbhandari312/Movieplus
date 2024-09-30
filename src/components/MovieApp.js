import React, { useState, useEffect } from 'react';
import './movieapp.css';
import { FaSearch } from "react-icons/fa";
import { BiExpand } from 'react-icons/bi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import Axios from 'axios';

export default function MovieApp() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [expandedMovieID, setExpandedMovieID] = useState(null);
  const [hoveredMovieId, setHoveredMovieId] = useState(null);
  const [trailers, setTrailers] = useState({});
  const [favorites, setFavorites] = useState(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteMovies');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });

  
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genreResponse = await Axios.get(
          "https://api.themoviedb.org/3/genre/movie/list",
          {
            params: {
              api_key: "6213cb13636fbd57354d4d23e86b8661",
            },
          }
        );
        setGenres(genreResponse.data.genres);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };

    fetchGenres();
  }, []);

  
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await Axios.get(
          searchQuery
            ? 'https://api.themoviedb.org/3/search/movie'
            : 'https://api.themoviedb.org/3/discover/movie',
          {
            params: {
              api_key: "6213cb13636fbd57354d4d23e86b8661",
              sort_by: sortBy,
              page: 1,
              with_genres: selectedGenre,
              query: searchQuery,
            },
          }
        );
        setMovies(response.data.results.slice(0, 20));

        
        const movieTrailers = {};
        for (const movie of response.data.results) {
          const trailerResponse = await Axios.get(
            `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
            {
              params: {
                api_key: "6213cb13636fbd57354d4d23e86b8661",
                language: "en-US",
              },
            }
          );
          const trailer = trailerResponse.data.results.find(video => video.type === 'Trailer');
          if (trailer) {
            movieTrailers[movie.id] = `https://www.youtube.com/watch?v=${trailer.key}`;
          }
        }
        setTrailers(movieTrailers);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setMovies([]);
      }
    };

    fetchMovies();
  }, [sortBy, selectedGenre, searchQuery]);

  const toggleExpandedMovie = (movieID) => {
    setExpandedMovieID(expandedMovieID === movieID ? null : movieID);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
  };

  
  const toggleFavorite = (movie) => {
    const isFavorite = favorites.some(favMovie => favMovie.id === movie.id);
    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites = favorites.filter(favMovie => favMovie.id !== movie.id);
    } else {
      updatedFavorites = [...favorites, movie];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteMovies', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (movieId) => {
    return favorites.some(movie => movie.id === movieId);
  };

  return (
    <div>
      <h1>Movieplus</h1>
      <div className='search-bar'>
        <input
          type="text"
          placeholder="Search Movies..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button className='search-button'>
          <FaSearch />
        </button>
      </div>

      <div className='filters'>
        <label htmlFor='sort-by'>Sort By</label>
        <select id='sort-by' value={sortBy} onChange={handleSortChange}>
          <option value='relevance'>Relevance</option>
          <option value='popularity.desc'>Popularity</option>
          <option value='release_date.desc'>Release Date</option>
          <option value='primary_release_date.desc'>Primary Release Date</option>
          <option value='original_title.asc'>Original Title</option>
          <option value='vote_average.desc'>Vote Average</option>
          <option value='vote_count.desc'>Vote Count</option>
          <option value='release_date.asc'>Release Date</option>
        </select>

        <label htmlFor='genre'>Genre</label>
        <select id='genre' value={selectedGenre} onChange={handleGenreChange}>
          <option value=''>All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <div className='movie-wrapper'>
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div 
              key={movie.id} 
              className='movie-item'
              onMouseEnter={() => setHoveredMovieId(movie.id)} 
              onMouseLeave={() => setHoveredMovieId(null)}
            >
              <img
                src={movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                  : '/path/to/default-image.jpg'}
                alt={movie.title}
              />
              {hoveredMovieId === movie.id && trailers[movie.id] && (
                <a href={trailers[movie.id]} target="_blank" rel="noopener noreferrer" className='trailer-button'>
                  Watch Trailer
                </a>
              )}
              <h3>{movie.title}</h3>
              <p className='rating'>Rating: {movie.vote_average}</p>
              <p className='release-date'>Release Date: {movie.release_date}</p>
              <div className='movie-details'>
                {expandedMovieID === movie.id ? (
                  <p>{movie.overview}</p>
                ) : (
                  <p>{movie.overview.substring(0, 150)}...</p>
                )}
              </div>
              <div className='button-container'>
                <button onClick={() => toggleExpandedMovie(movie.id)}>
                  <BiExpand />
                  {expandedMovieID === movie.id ? ' Read Less' : ' Read More'}
                </button>
                <button onClick={() => toggleFavorite(movie)}>
                  {isFavorite(movie.id) ? <FaHeart color='red' /> : <FaRegHeart />}
                  {isFavorite(movie.id) ? ' Remove from Favorites' : ' Add to Favorites'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No movies found.</p>
        )}
      </div>

      {/* Favorites Section */}
      <div className='favorites'>
        <h2>Your Favorite Movies</h2>
        {favorites.length > 0 ? (
          <div className='movie-wrapper'>
            {favorites.map((movie) => (
              <div key={movie.id} className='movie-item'>
                <img
                  src={movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                    : '/path/to/default-image.jpg'}
                  alt={movie.title}
                />
                <h3>{movie.title}</h3>
                <p className='rating'>Rating: {movie.vote_average}</p>
                <p className='release-date'>Release Date: {movie.release_date}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>You haven't added any favorite movies yet.</p>
        )}
      </div>
    </div>
  );
}
