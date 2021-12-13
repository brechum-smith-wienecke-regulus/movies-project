// this debug object has several flags that can be useful for debugging different parts of the app
let DEBUG = {
    // verbose: when true, many different important steps of the app will have details printed into the console
    //          default - false
    verbose: true,
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
        $('#create-add-form, #movie-display').hide();
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
                $('#create-add-form, #movie-display').show()
                // hide loading
                $('#loading').hide();
                // map each movie returned from db into a new array of html strings
                const movieList = movies.map(movie => renderMovie(movie));
                movieDisplay.append(movieList);

                // setup event listener for edit buttons
                $('.movie-edit').on('click', function (e) {
                    e.preventDefault();
                    if (DEBUG.verbose) console.log('User Edit event')
                    // here we get the parent div of the clicked movie edit button, which
                    // contains a jQuery data value that has had the corresponding movie object stored
                    editMovie($(this).parent().parent().data('movie'));
                });

                // setup event listener for delete buttons
                $('.movie-delete').on('click', function (e) {
                    e.preventDefault();
                    if (DEBUG.verbose) console.log('User Delete event');
                    if (confirm(`Are you sure you want to delete ${$(this).parent().parent().data('movie').title}?`)) {
                        deleteMovie($(this).parent().parent().data('movie').id)
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

    /*  <div class="card" style="width: 18rem;">
            <img src="..." class="card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title">Movie title</h5>
                <p class="card-text">rating</p>
                <a href="#" class="btn btn-primary">Edit</a>
                <a href="#" class="btn btn-danger">Delete</a>
            </div>
        </div>
     */
    const renderMovie = (movie) => {
        let movieHtml = `<img class="movie-poster" src="${movie.poster}">
                            <div class="card-body">
                             <h5 class="card-title">${movie.title}</h5>`;
        movieHtml +=        `<p class="card-text">rating: ${movie.rating}</p>`;
        movieHtml +=        `<p class="card-text">genre: ${movie.genre}</p>`;
        movieHtml +=        `<button type="button" class="movie-edit btn btn-primary" data-toggle="modal" data-target="#edit-form-modal">Edit</button>`
        movieHtml +=        `<button class="movie-delete btn btn-danger">Delete</button>`;
        movieHtml +=    `</div>`
        const movieContainer = $(document.createElement('div'))
            .data('movie', movie)
            .addClass('movie-container card col-3 p-1')
            .css('width', '23vw')
            .append(movieHtml);

        return movieContainer;
    }

    const addMovie = (rating, title, genre) => {
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
                    // if newId is still null, we throw and exit the request
                    if (newId === null) throw 'ID assignment issue, cancelling post request';
                    const movie = {
                        title: title,
                        rating: rating,
                        director: "",
                        year: "",
                        genre: genre,
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
        const editForm = $('#edit-form-modal').data('movie', movie);
        // destroy old form (if any) before preparing the new one
        console.log($('#edit-form-modal').data('movie'))
        destroyElementContents(editForm);

        /*

         */
        // all styling and structure for the edit form is done here
        let formHtml = `
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editFormTitle">Editing ${movie.title}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
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
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal" id="reset-edit">Close</button>
                <button type="button" class="btn btn-primary" id="submit-edit">Save</button>
            </div>
        </div>
    </div>`;

        editForm.append(formHtml);

        $('#submit-edit').on('click', e => {
            e.preventDefault();
            $('#edit-form-modal').modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            submitEdit(e)
        })
        // reset button destroys the form and refreshes the content
        $('#reset-edit').on('click', e => {
            e.preventDefault();
            $('#edit-form-modal').modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            if (DEBUG.verbose) console.log('Reset edit form event');
            destroyElementContents(editForm);
            getMovies();
        });
    }

    const submitEdit = (e) => {
        // if there was an event that called this function, prevent page refresh
        if (e) e.preventDefault();
        // editForm is the form presented to the user to allow changing movie contents
        const editForm = $('#edit-form-modal');
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
        destroyElementContents($('#add-movie-modal'));
        // build our form to take user input for adding movies here
        let addForm = `
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="addFormTitle">Add a Movie</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body" id="add-movie">
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
                <label for="add-genre">Genre</label>
                <input id="add-genre" type="text" placeholder="">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal" id="reset-add">Close</button>
                <button type="button" class="btn btn-primary" data-dismiss="modal" id="submit-add">Save</button>
            </div>
        </div>
    </div>`;

        // display form for users
        $('#add-movie-modal').append(addForm);

        // setup click event
        $('#submit-add').on('click', (e) => {
            e.preventDefault();
            $('#add-form-modal').modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            if (DEBUG.verbose) console.log('Submit Add event', e)
            // grab genres field and convert to array
            let genres = $('#add-genre').val().split(',');
            console.log(genres);
            // pass the three input fields to our addMovie function
            addMovie($('#add-rating').val(), $('#add-title').val(), genres);
            // destroy old form
            destroyElementContents($('#add-movie-modal'));
        });
        $('#reset-add').on('click', e => {
            e.preventDefault();
            $('#add-form-modal').modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            if (DEBUG.verbose) console.log('Reset edit form event');
            destroyElementContents($('#add-movie-modal'));
            getMovies();
        });
    }

    const enableUserFormInput = () => {
        destroyElementContents($('#add-movie-modal'));

        // userAddMovieButton toggles display of user's add movie form
        const userAddMovieButton = $('#create-add-form');
        userAddMovieButton.show();
        userAddMovieButton.on('click', (e) => {
            e.preventDefault();
            if (DEBUG.verbose) console.log('Create Add event', e)
            buildAddForm();
        });

    }

    // all actual work done that is not simply function definitions should go in here to keep organized :)
    (() => {
        // grab movies and do setup work as soon as page loads
        getMovies();
    })();
});