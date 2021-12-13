//
let DEBUG = {
    verbose: true,
    noPost: false,
    noPut: false,
}

$(document).ready(() => {

    "use strict";
    const movieAPI = "https://pushy-paint-hippopotamus.glitch.me/movies"

    const movieDisplay = $("#movie-display")

    // this function destroys all children of an element
    const destroyElementContents = (element) => {
        if (DEBUG.verbose) console.log('Destroying element:', element);
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
        $('#create-add-form, #movie-display, #add-movie, #edit-movie').hide();
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
                if (DEBUG.verbose) console.log(movies);
                // now we can show our movie database data and controls
                $('#create-add-form, #movie-display, #add-movie, #edit-movie').show()
                // hide loading
                $('#loading').hide();
                // map each movie returned from db into a new array of html strings
                const movieList = movies.map(movie => renderMovie(movie));
                movieDisplay.append(movieList);

                // setup event listener for edit buttons
                $('.movie-edit').on('click', function () {
                    if (DEBUG.verbose) console.log('User Edit event')
                    // here we get the parent div of the clicked movie edit button, which
                    // contains a jQuery data value that has had the corresponding movie object stored
                    editMovie($(this).parent().data('movie'));
                    document.querySelector('#edit-movie').scrollIntoView();
                });

                // setup event listener for delete buttons
                $('.movie-delete').on('click', function () {
                    if (DEBUG.verbose) console.log('User Delete event');
                    if (confirm(`Are you sure you want to delete ${$(this).parent().data('movie').title}?`)) {
                        deleteMovie($(this).parent().data('movie').id)
                    }
                });

                // enable input for user to show form to add a film
                enableUserFormInput();
            })
    }

    const hideLoading = () => {
        $("#loading").hide();
    }

    // build a single movie element for the page
    // takes a movie, returns a string made from that movie formatted in html
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
                // now we work through the existing ids looking for the first available unused number for the new id
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
                    if (DEBUG.verbose) console.log('Adding:', movie);
                    return fetch(movieAPI, options)
                        .then(response => response.json())
                        .then(getMovies);
                } catch (error) {
                    console.error(error)
                }
            });

    }

    // this function is essentially useless and we probably won't need it again
    // const getMovieById = (id) => {
    //     const options = {
    //         method: 'GET',
    //         headers: {
    //             "Content-Type": "application/json",
    //         }
    //     }
    //
    //     return fetch(`${movieAPI}/${id}`)
    //         .then(response => response.json())
    //     .then(data => console.log(data));
    // }


    const editMovie = (movie) => {
        // selecting our form area for movie listing editing
        // using jquery data to preserve info about user movie selection
        // this data is retrieved when rebuilding the movie object before edit submission
        const editForm = $('#edit-movie').data('movie', movie);
        // destroy old form (if any) before preparing the new one
        destroyElementContents(editForm);

        // all styling and structure for the edit form is done here
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
        // editForm is the form presented to the user to allow changing movie contents
        const editForm = $('#edit-movie');
        let newMovie = {
            title: $("#title").val(),
            rating: $("#new-rating").val(),
            director: $("#director").val(),
            year: $("#year").val(),
            genre: $("#genre").val(),
            poster: $("#poster").val(),
            plot: $("#plot").val(),
            actors: $("#actors").val(),
            // the id is here an edge case. users are not able to see/manipulate these ids directly
            // here we are retrieving it from a jQuery data method instead of taking user input
            id: editForm.data('movie').id,
        }
        // we are done with the edit form contents, destroy them
        destroyElementContents(editForm);

        // make the put request
        const options = {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newMovie)
        }
        fetch(`${movieAPI}/${newMovie.id}`, options).then(response => response.json()).then(data => {
            if (DEBUG.verbose) console.log(data)
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
        fetch(`${movieAPI}/${id}`, options)
            .then(response => response.json())
            .then(data => {
                if (DEBUG.verbose) console.log(data);
                getMovies()
            });
    }

    const buildAddForm = () => {
        // build our form to take user input for adding movies here
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

        // display form for users
        $('#add-movie').append(addForm);

        // setup click event
        $('#submit-add').on('click', (e) => {
            e.preventDefault();
            if (DEBUG.verbose) console.log('Submit Add event', e)
            // pass the two input fields to our addMovie function
            addMovie($('#add-rating').val(), $('#add-title').val());
            // destroy old form
            destroyElementContents($('#add-movie'));
        });
    }

    const enableUserFormInput = () => {
        // userAddMovieButton toggles display of user's add movie form
        const userAddMovieButton = $('#create-add-form');
        userAddMovieButton.show();
        userAddMovieButton.on('click', (e) => {
            e.preventDefault();
            if (DEBUG.verbose) console.log('Create Add event', e)
            buildAddForm();
            userAddMovieButton.hide();
        });

    }

    // all actual work done that is not simply function definitions should go in here to keep organized :)
    (() => {
        // grab movies and do setup work as soon as page loads
        getMovies();

    })();
});