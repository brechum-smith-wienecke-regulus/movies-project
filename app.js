"use strict";
const movieAPI = "https://pushy-paint-hippopotamus.glitch.me/movies"

const movieDisplay = $("#movie-display")
const getMovies = () => {
    // might as well switch the loading element back in while waiting for response
    $('#loading').show();
    // only loading element should be visible, all elements depending on response should be hidden
    $('#movie-display #create-add-form #create-edit-form #user-input').hide();
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
    let movieHtml =     `<h1>${movie.title}</h1>`;
    movieHtml       +=  `<p>rating: ${movie.rating}</p>`;
    // movieHtml       +=  `<p data-id="${movie.id}"></p>`;
    movieHtml += `<button class="movie-delete">Delete</button>`;
    movieHtml += `<button class="movie-edit">Edit</button>`;
    const movieContainer = $(document.createElement('div'))
        .data('movie', movie)
        .addClass('movie-container')
        .append(movieHtml);

    return movieContainer;
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

const editMovie = (movie) => {

    // destroy old form contents
    // destroyElementContents()
    // selecting our form area for movie listing editing
    // using jquery data to preserve info about user movie selection
    const editForm = $('#edit-movie').data('movie', movie);
    // destroy old form (if any) before preparing the new one
    destroyElementContents(editForm);



    /*  */
    let formHtml = `<input type="text" id="title" value="${movie.title}">
                    <input type="number" id="new-rating" name="new-rating" min="1" max="5" value="${movie.rating}">
                    <input type="text" id="director" value="${movie.director}">
                    <input type="text" id="year" value="${movie.year}">
                    <input type="text" id=genre value="${movie.genre}">
                    <input type="text" id="poster" value="${movie.poster}">
                    <textarea id="plot">${movie.plot}</textarea>
                    <input type="text" id="actors" value="${movie.actors}">
                    <button id="submit-edit">Submit</button>
                    <button id="reset-edit">Reset</button>`;

    editForm.append(formHtml);

    $('#submit-edit').on('click', (e) => submitEdit(e))
        // const title = $(document.createElement('input'))
        //     .attr('id', 'title', 'type', 'text')
        //     .val()
    // getMovieById(id).then(movie => {
    //     console.log(movie);
    //     $("#title").val(movie.title);
    //     $("#new-rating").val(movie.rating);
    //     $("#director").val(movie.director);
    //     $("#year").val(movie.year);
    //     $("#genre").val(movie.genre);
    //     $("#poster").val(movie.poster);
    //     $("#plot").val(movie.plot);
    //     $("#actors").val(movie.actors);
    //     $("#id").val(movie.id);
    // })
}

const submitEdit = (e) => {
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
    destroyElementContents();
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

const buildAddForm = () => {

    let addForm =
        `<form id="add-movie">
            <input type="text" placeholder="movie title">
            <label for="rating">Rating</label>
            <select id="rating" name="rating">
                <option value="1"> 1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
          </select>
          <button id="submit-add">Submit</button>
        </form>`;

    $('#user-input').append(addForm);
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

const buildEditForm = (id) => {

}

// this function destroys all children of an element
const destroyElementContents = (element) => {
    while (element.get(0).firstChild) {
        // using .get(0) here unwraps the element out of jQuery and back into vanilla JS
        element.get(0).removeChild(element.get(0).lastChild);
    }
    // returns itself to allow chaining
    return element;
}