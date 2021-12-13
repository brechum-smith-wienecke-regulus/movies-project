"use strict";
const movieAPI = "https://pushy-paint-hippopotamus.glitch.me/movies"


const movieDisplay = $("#movie-display")

// this function destroys all children of an element
const destroyElementContents = (element) => {
    while (element.get(0).firstChild) {
        // using .get(0) here unwraps the element out of jQuery and back into vanilla JS
        element.get(0).removeChild(element.get(0).lastChild);
    }
    return element;
}

const getMovies = () => {
    // might as well switch the loading element back in while waiting for response
    $('#loading').show();
    // only loading element should be visible, all elements depending on response should be hidden
    $('#movie-display #create-add-form #create-edit-form #user-input').hide();
    // clear out the old contents of movie-display while we prepare to build the new contents from response
    destroyElementContents(movieDisplay);

    const options = {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    }
    fetch(movieAPI, options)
        .then(response => response.json())
        .then(movies => {
            $('#movie-display', '#create-add-form', '#user-input').show()
            console.log(movies);
            hideLoading();
            // movieDisplay.show();
            // map each movie returned from db into a new array of html strings
            const movieList = movies.map(movie => renderMovie(movie));
            movieDisplay.append(movieList);

            // setup event listener for edit buttons
            $('.movie-edit').on('click', function () {
                // here we get the parent div of the clicked movie edit button, which
                // contains a jQuery data value that has had the corresponding movie object stored
                editMovie($(this).parent().data('movie'));
                document.querySelector('#edit-movie').scrollIntoView();

            });

            // enable input for user to show form to add a film
            enableUserFormInput();
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
    const movieContainer = $(document.createElement('div'))
        .data('movie', movie)
        .addClass('movie-container')
        .append(movieHtml);

    return movieContainer;
}

const addMovie = (rating, title) => {
    // we look up the latest status from the database regarding movies so we avoid id collision
    fetch(movieAPI, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then(response => response.json())
        .then(movies => {
            // get an array of all existing ids in database
            const existingIds = movies.map(movie => movie.id);

            let newId = null;
            for (let i = 0; i < existingIds.length; i++) {
                if (!existingIds.includes(i + 1)) {
                    newId = i + 1;
                    break;
                }
            }
            // we really do not want to push objects to our database that have bad ids
            // using try catch here to prevent submitting new films with unset IDs
            try {
                if (newId === null) throw 'ID assignment issue, cancelling post request';
                const movie = {
                    title: title,
                    rating: rating,
                    director: "",
                    year: "",
                    genre: "",
                    poster: "",
                    plot: "",
                    actors: "",
                    id: newId,
                }
                const options = {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(movie)
                }
                console.log(movie);
                return fetch(movieAPI, options)
                    .then(response => response.json())
                    .then(getMovies)
            }
            catch(error) {
                console.error(error)
            }
        });

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


const editMovie = (movie) => {

    // selecting our form area for movie listing editing
    // using jquery data to preserve info about user movie selection
    const editForm = $('#edit-movie').data('movie', movie);
    // destroy old form (if any) before preparing the new one
    destroyElementContents(editForm);

    let formHtml = `
    <label for="title">Title</label>
    <input type="text" id="title" value="${movie.title}">
    <label for="new-rating">Rating</label>
    <input type="number" id="new-rating" name="new-rating" min="1" max="5" value="${movie.rating}">
    <label for="director">Director</label>
    <input type="text" id="director" value="${movie.director}">
    <label for="year">Year</label>
    <input type="text" id="year" value="${movie.year}">
    <label for="genre">Genre</label>
    <input type="text" id=genre value="${movie.genre}">
    <label for="poster">Poster</label>
    <input type="text" id="poster" value="${movie.poster}">
    <label for="plot">Plot</label>
    <textarea id="plot">${movie.plot}</textarea>
    <label for="actors">Actors</label>
    <input type="text" id="actors" value="${movie.actors}">
    <br>
    <button id="submit-edit">Submit</button>
    <button id="reset-edit">Reset</button>`;

    editForm.append(formHtml);

    $('#submit-edit').on('click', (e) => submitEdit(e))
}

const submitEdit = (e) => {
    // if there was an event that called this function, prevent page refresh
    if (e) e.preventDefault();
    let newMovie = {
        title: $("#title").val(),
        rating: $("#new-rating").val(),
        director: $("#director").val(),
        year: $("#year").val(),
        genre: $("#genre").val(),
        poster: $("#poster").val(),
        plot: $("#plot").val(),
        actors: $("#actors").val(),
        id: $('#edit-movie').data('movie').id,
    }
    // we are done with the form contents, destroy them
    destroyElementContents($('#edit-movie'));

    // make the put request
    const options = {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newMovie)
    }
    fetch(`${movieAPI}/${newMovie.id}`, options).then(response => response.json()).then(data => {
        console.log(data)
        getMovies();
    });
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

const buildAddForm = () => {
    let addForm =
        `<form id="add-movie">
            <label for="add-title">Title</label>
            <input id="add-title" type="text" placeholder="">
            <label for="rating">Rating</label>
            <select id="add-rating" name="rating">
                <option value="1"> 1</option>
                <option value="2">2</option>
                <option selected value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
          </select>
          <button id="submit-add">Submit</button>
        </form>`;

    $('#user-input').append(addForm);

    $('#submit-add').on('click', (e) => {
        e.preventDefault();
        addMovie($('#add-rating').val(), $('#add-title').val());
    });
}

const enableUserFormInput = () => {
    // userAddMovieButton toggles display of user's add movie form
    const userAddMovieButton = $('#create-add-form');
    userAddMovieButton.show();
    userAddMovieButton.on('click', (e) => {
        e.preventDefault();
        buildAddForm();
        userAddMovieButton.hide();
    });

}

