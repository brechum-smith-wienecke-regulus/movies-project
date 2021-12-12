"use strict";
const movieAPI = "https://pushy-paint-hippopotamus.glitch.me/movies"

const movieDisplay = $("#movie-display")
const getMovies = () => {
    // might as well switch the loading element back in while waiting for response
    $('#loading').show();
    // clear out the old contents of movie-display while we prepare to build the new contents from response
    while (movieDisplay.get(0).firstChild) {
        // using .get(0) here unwraps the moviesDisplay out of jQuery and back into vanilla JS
        movieDisplay.get(0).removeChild(movieDisplay.get(0).lastChild);
    }
    const options = {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    }
    fetch(movieAPI, options)
        .then(response => response.json())
        .then(movies => {
            hideLoading();

            console.log(movies);
            // map each movie returned from db into a new array of html strings
            const movieList = movies.map(movie => renderMovie(movie));
            movieDisplay.append(movieList);
        })
}
getMovies();

const hideLoading = () => {
    $("#loading").hide();
}

const renderMovie = (movie) => {
    let movieHtml = `<h1>${movie.title}</h1>`;
    movieHtml += `<p>rating: ${movie.rating}</p>`;
    movieHtml += `<button class="movie-delete">Delete</button>`;
    movieHtml += `<button class="movie-edit">Edit</button>`;
    return movieHtml
}

const addMovie = (rating, title) => {
    const movie = {
        title: title,
        rating: rating,
        director: "",
        year: "",
        genre: "",
        poster: "",
        plot: "",
        actors: "",
        id: "",
    }
    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(movie)
    }
    console.log(movie);
    return fetch(movieAPI, options).then(response => response.json())
}

const getMovieById = (id) => {
    const options = {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    }

    return fetch(`${movieAPI}/${id}`)
        .then(response => response.json())
        // .then(data => console.log(data));
}

// getMovieById()

const editMovie = (id) => {
    getMovieById(id).then(movie => {
        console.log(movie);
        $("#title").val(movie.title);
        $("#new-rating").val(movie.rating);
        $("#director").val(movie.director);
        $("#year").val(movie.year);
        $("#genre").val(movie.genre);
        $("#poster").val(movie.poster);
        $("#plot").val(movie.plot);
        $("#actors").val(movie.actors);
        $("#id").val(movie.id);
    })
}

const submitEdit = () => {
    let newMovie = {
        title: $("#title").val(),
        rating: $("#new-rating").val(),
        director: $("#director").val(),
        year: $("#year").val(),
        genre: $("#genre").val(),
        poster: $("#poster").val(),
        plot: $("#plot").val(),
        actors: $("#actors").val(),
        id: $("#id").val()
    }
    const options = {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newMovie)
    }
    fetch(`${movieAPI}/${newMovie.id}`, options).then(response => response.json()).then(data => console.log(data));
}


const deleteMovie = (id) => {
    const options = {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
        },
    }
    fetch(`${movieAPI}/${id}`, options).then(response => response.json()).then(data => console.log(data));
}