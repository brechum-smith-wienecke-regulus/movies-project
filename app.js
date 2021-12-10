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
