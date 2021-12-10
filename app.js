"use strict";
const movieAPI= "https://pushy-paint-hippopotamus.glitch.me/movies"

const movieDisplay = $("#movie-display")
const getMovies = () =>
{const options= {
    method: 'GET',
    headers: {
        "Content-Type": "application/json",
    }
}
    fetch(movieAPI, options)
        .then(response => response.json())
        .then(movies => {
            hideLoading()
            movies.forEach(movie => {
                movieDisplay.append(renderMovie(movie))
                console.log(movie);
            })
        })
}
getMovies();

const hideLoading = () => {
    $("#loading").hide();
}

const renderMovie = (movie) => {
    let movieHtml = `<h1>${movie.title}</h1>`
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
    const options= {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    }

    return fetch(movieAPI, options)
        .then(response => response.json())
        .then(data => data.filter(movie => parseFloat(movie.id) === id)[0]);

}

getMovieById()
// <input type="text" id="title">
//     <input type="text" id="new-rating">
//     <input type="text" id="director">
//     <input type="text" id="year">
//     <input type="text" id="poster">
//     <input type="text" id="plot">
//     <input type="text" id="actors">
const editMovie =(id) => {
    getMovieById(id).then(movie => {
        const id = movie.id;
        console.log(movie);
             $("#title").val(movie.title);
            $("#new-rating").val(movie.rating);
            $("#director").val(movie.director);
            $("#year").val(movie.year);
            $("#genre").val(movie.genre);
           $("#poster").val(movie.poster);
           $("#plot").val(movie.plot);
           $("#actors").val(movie.actors);
    })
}



