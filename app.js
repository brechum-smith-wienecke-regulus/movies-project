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
                // we can change the order here
                // movieList.
                // draw movies on screen
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
                    addPoster(movie)
                        .then(movie => {
                            if (DEBUG.verbose) console.log(movie);
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
                        })
                        .catch(movie => {
                            movie.poster = 'noimage';
                            if (DEBUG.verbose) console.log(movie);
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
                        });
                } catch (error) {
                    console.error(error)
                }
            });
    }

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
            genre: $("#genre").val().split(','),
            poster: $("#poster").val(),
            plot: $("#plot").val(),
            actors: $("#actors").val().split(','),
            // the id is here an edge case. users are not able to see/manipulate these ids directly
            // here we are retrieving it from a jQuery data method instead of taking user input
            id: editForm.data('movie').id,
        }

        // we are done with the edit form contents, destroy them
        destroyElementContents(editForm);

        // addPoster(newMovie).then(movie => {
        // if (newMovie.poster === 'undefined' || newMovie.poster === '') {
        //
        //     let query = newMovie.title.split('+');
        //     const options = {
        //         method: 'GET',
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //     }
        //     fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}`, options)
        //         .then(response => response.json())
        //         .then(data => {
        //             let url = `https://image.tmdb.org/t/p/w500/${data.results[0].poster_path}`
        //             newMovie.poster = url;
        //             return newMovie;
        //         })
        //         .then(newMovie => {
        //             const options = {
        //                 method: 'PUT',
        //                 headers: {
        //                     "Content-Type": "application/json",
        //                 },
        //                 body: JSON.stringify(newMovie)
        //             }
        //             fetch(`${movieAPI}/${newMovie.id}`, options).then(response => response.json()).then(data => {
        //                 if (DEBUG.verbose) console.log(data)
        //                 getMovies();
        //             });
        //         });
        // } else {
        addPoster(newMovie)
            .then(movie => {
                console.log(movie);
                const options = {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(movie)
                }
                fetch(`${movieAPI}/${movie.id}`, options)
                    .then(response => response.json())
                    .then(data => {
                        if (DEBUG.verbose) console.log(data)
                        getMovies();
                    });
            })
            .catch(movie => {
                movie.poster = 'noimage';
                console.log(movie);
                const options = {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(movie)
                }
                fetch(`${movieAPI}/${movie.id}`, options)
                    .then(response => response.json())
                    .then(data => {
                        if (DEBUG.verbose) console.log(data)
                        getMovies();
                    });
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

    const filterMovieList = () => {
       $("#movie-filter").on("keyup", function() {
            let value = $(this).val().toLowerCase();
            $("#movie-display>*").filter(function() {
              $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
            });
          });
    }

    const dynamicSort = (property) => {
        var sortOrder = 1;

        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }

        return function (a,b) {
            if(sortOrder == -1){
                return b[property].localeCompare(a[property]);
            }else{
                return a[property].localeCompare(b[property]);
            }
        }
    }

    const sortMovieProperties = () => {
        $('#sort-select').on('change', function () {
            // dynamicSort($(this).val())
            getMovies();
        });
    }

    const addPoster = (movie) => {
        // if (movie.poster === 'undefined' || movie.poster === '') {
        //


        // fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}`, options)
        //     .then(response => response.json())
        //     .then(data => {
        //         let url = `https://image.tmdb.org/t/p/w500/${data.results[0].poster_path}`
        //         movie.poster = url;
        //         return Promise.resolve(movie);
        //     });
        // } else {
        //     return Promise.resolve(movie);
        // }
        return new Promise((resolve, reject) => {
            if (movie.poster === 'undefined' || movie.poster === '') {
                let query = movie.title.split('+');
                const options = {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
                fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}`, options)
                    .then(response => response.json())
                    .then(data => {
                        if (data.results.length === 0) return reject(movie);
                        let url = `https://image.tmdb.org/t/p/w500/${data.results[0].poster_path}`
                        movie.poster = url;
                        console.log(data);
                        return resolve(movie);
                    });
            } else {
                return resolve(movie);
            }
        })
    }

    // all actual work done that is not simply function definitions should go in here to keep organized :)
    (() => {
        // grab movies and do setup work as soon as page loads
        getMovies();
        filterMovieList();


        // fetch(`https://api.themoviedb.org/3/movie/550?api_key=${TMDB_KEY}&`, options)
        //     .then(response => response.json())
        //     .then(data => {
        //     console.log(data);
        // });


        // fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=Jack+Reacher`, options)
        //     .then(response => response.json())
        //     .then(data => {
        //         console.log(data.results[0].poster_path);
        //     });
        // {api_key}
    })();
});