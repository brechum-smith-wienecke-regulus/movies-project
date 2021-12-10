"use strict";
const movieAPI= "https://pushy-paint-hippopotamus.glitch.me/movies"
const options= {
    method: 'GET',
    headers: {
        "Content-Type": "application/json",
    }
}
const getMovies = ()
{
    fetch(movieAPI, options)
        .then(response => response.json())
        .then(movies => {
            movies.forEach(movie => {
                console.log(movie);
            })
        })
}
