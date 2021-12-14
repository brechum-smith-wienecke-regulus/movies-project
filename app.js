
"use strict";

// this debug object has several flags that can be useful for debugging different parts of the app

let DEBUG = {
    // verbose: when true, many different important steps of the app will have details printed into the console
    //          default - false
    verbose: true,
}

$(document).ready(() => {

    const movieAPI = "https://pushy-paint-hippopotamus.glitch.me/movies/"

    // movieDisplay is the container for all of our movie card elements
    const movieDisplay = $("#movie-display")
    // loading is a little div that we show while waiting for a get request to our database
    const loading = $('#loading');
    // main content is everything outside of the nav, loading, and the modal forms
    const mainContent = $('#create-add-form, #movie-display');

    // this function destroys all children of an element
    const destroyElementContents = (element) => {
        while (element.get(0).firstChild) {
            // using .get(0) here unwraps the element out of jQuery and back into vanilla JS
            element.get(0).removeChild(element.get(0).lastChild);
        }
        return element;
    }

    // getMovies dumps the current contents of movieDisplay, fetches from our database, sorts and redraws the contents,
    // and sets up the first layer of event listeners
    const getMovies = async () => {
        // might as well switch the loading element back in while waiting for response
        loading.show();
        // only loading element should be visible, all elements depending on response should be hidden
        mainContent.hide();
        // clear out the old contents of movie-display while we prepare to build the new contents from response
        destroyElementContents(movieDisplay);

        // we grab the contents of our database
        const movies = await sendDatabaseRequest('GET')
        // now we can show our movie database data and controls
        mainContent.show()
        // hide loading
        loading.hide();
        // we can change the order here
        const sortBy = $('#sort-select').val();
        const sortIn = $('#order-select').val();
        // if sort-select is left on default we skip sorting our movie content
        if (sortBy !== 'default') {
            movies.sort(dynamicSort(`${sortIn}${sortBy}`));
        } else if (sortIn === '-') { // unless the order is set to '-'/descending where we just reverse it
            movies.reverse();
        }

        // map each movie returned from db into a new array of html strings
        const movieList = movies.map(movie => renderMovie(movie));
        // draw movies on screen
        movieDisplay.append(movieList);

        // layer 1 event listener setup
        // setup card controls
        showMovieControls();

        // enable input for user to show form to add a film
        enableUserFormInput();
    }

    // build a single movie element for the page
    // takes a movie object, returns a string made from that movie formatted into html
    const renderMovie = (movie) => {
        const movieHtml = `
            <img class="movie-poster mr-2 pr-2 card-img-top" src="${(movie.poster === 'noimage') ? 
                'https://dummyimage.com/200x400/BBB/202020.png&text=No+Poster+Available' : movie.poster}">
            <div class="card-body">
                <h5 class="card-title">${movie.title}</h5>
                <p class="card-text">Rating: ${movie.rating}/5</p>
                <p class="card-text">Genre: ${movie.genre}</p>
            </div>
            <div class="card-footer justify-content-between d-flex">
               <button class="movie-details btn btn-primary">Details</button>
            </div>`
        const movieContainer = $(document.createElement('div'))
            .data('movie', movie)
            .addClass('movie-container col card')
            .append(movieHtml);

        return movieContainer;
    }

    // this builds out a second hidden card containing the rest of each movie object's content
    const buildMovieDetails = (movie) => {
        const movieDetailHtml = `
            <div class="card-body overflow-auto">
                <p class="card-text card-details">${movie.year}</p>
                <p class="card-text card-details">Director: ${movie.director}</p>
                <p class="card-text card-details">Actors: ${movie.actors}</p>
                <p class="card-text card-details">${movie.plot}</p>
            </div>
            <div class="card-footer justify-content-between d-flex">
                <button class="movie-delete btn btn-primary">Delete</button>
                <button type="button" class="movie-edit btn btn-primary" data-toggle="modal" data-target="#edit-form-modal">Edit</button>
                <button class="movie-details-done btn btn-primary">Done</button>
            </div>`;
        const movieDetailContainer = $(document.createElement('div'))
            .data('movie', movie)
            .addClass('movie-container movie-details-container col card')
            .append(movieDetailHtml);

        return movieDetailContainer

    }

    const addMovie = async (rating, title, genre) => {
        // we look up the latest status from the database regarding movies so we avoid id collision
        const movies = await sendDatabaseRequest('GET');
        // get an array of all existing ids in database
        const existingIds = movies.map(movie => movie.id);
        // now we work through the existing ids looking for the first available unused number for the new id that isn't 0
        let newId = null;
        // iterate from 0 to length of existing IDs
        for (let i = 0; i < existingIds.length; i++) {
            // if existing IDs do not include the current value of i + 1 (keeping offset from 0)...
            if (!existingIds.includes(i + 1)) {
                // ...i + 1 is our new ID, exit early
                newId = i + 1;
                break;
            }
            // if we've checked all values between 1 and the length of the array, new ID will be 1 more
            // than the last existing id
            if (i + 1 === existingIds.length) newId = existingIds.length + 1;
        }
        // we can go through with the request so long as the id assignment was successful
        if (newId !== null) {
            // blast off our new movie's provided details for property inflation by omdb
            const movie = await addMovieDetails({title: title, rating: rating, id: newId});
            // add the completed film to our database and get it all in our browser
            sendDatabaseRequest('POST', movie.id, movie)
                .then(getMovies);
        } else {
            console.error('Post request aborted, id assignment error.');
        }
    }

    const showMovieControls = () => {
        // this is kind of ridiculous
        $('.movie-container').hover(function () {
            $(this).children('.card-footer')
                .css('visibility', 'visible')
                .css('position', 'relative');
            $(this).children().children('.card-text')
                .css('display', 'block');
            $(this).children('.card-img-top')
                .css('display', 'none');
            $(this)
                .css('background-color', 'rgba(255,255,255,.7)')
                .prepend($(document.createElement('div'))
                    .addClass('movie-container-bg-img')
                    .css('background-image', `url(${ $(this).data('movie').poster })`))
        }, function () {
            $(this).children('.card-footer')
                .css('visibility', 'hidden')
                .css('position', 'absolute');
            $(this).children('.card-img-top')
                .css('display', 'inline-block');
            $(this).children().children('.card-text')
                .css('display', 'none');
            $(this)
                .css('background-color', 'var(--bg-color-light)');
            $('.movie-container-bg-img').remove();
        });

        $('.movie-details').on('click', function (e) {
            $('.movie-details-container').each(function () {
                $(this).remove();
            });
            e.preventDefault();
            const currentCard = $(this).parent().parent();
            console.log(currentCard)
            currentCard.after(buildMovieDetails(currentCard.data('movie')));
            movieEditControlsListeners();
            $(this).remove();

            $('.movie-details-done').on('click', function (e) {
                e.preventDefault();
                getMovies();
            });
        });
    }

    const movieEditControlsListeners = () => {
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
    }

    const editMovie = (movie) => {
        // selecting our form area for movie listing editing
        // using jquery data to preserve info about user movie selection
        // this data is retrieved when rebuilding the movie object before edit submission
        const editForm = $('#edit-form-modal').data('movie', movie);
        // destroy old form (if any) before preparing the new one
        console.log($('#edit-form-modal').data('movie'))
        destroyElementContents(editForm);

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
                <div class="modal-body d-flex">
                    <div class="flex-grow-1">
                        <label class="mt-2" for="title">Title</label>
                        <input class="form-control" type="text" id="title" value="${movie.title}">
                        <label class="mt-2" for="new-rating">Rating</label>
                        <input class="form-control" type="number" id="new-rating" name="new-rating" min="1" max="5" value="${movie.rating}">
                        <label class="mt-2" for="director">Director</label>
                        <input class="form-control" type="text" id="director" value="${movie.director}">
                        <label class="mt-2" for="year">Year</label>
                        <input class="form-control" type="text" id="year" value="${movie.year}">
                        <label class="mt-2" for="genre">Genre</label>
                        <input class="form-control" type="text" id=genre value="${movie.genre}">
                        <label class="mt-2" for="poster">Poster</label>
                        <input class="form-control" type="text" id="poster" value="${movie.poster}">
                        <label class="mt-2" for="plot">Plot</label>
                        <textarea class="form-control" id="plot" rows="4">${movie.plot}</textarea>
                        <label class="mt-2" for="actors">Actors</label>
                        <input class="form-control" type="text" id="actors" value="${movie.actors}">
                    </div>
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
        // fill out any missing details from omdb
        addMovieDetails(newMovie)
            .then(movie => {
                sendDatabaseRequest('PUT', movie.id, movie)
                    .then(getMovies);
            })
            .catch(movie => {
                // general catch-all for issues with editing. picture will break
                console.error('Some issue with movie editing.', movie);
                sendDatabaseRequest('PUT', movie.id, movie)
                    .then(getMovies);
            });
    }

    const deleteMovie = (id) => {
        sendDatabaseRequest('DELETE', id)
            .then(getMovies);
    }

    const sendDatabaseRequest = async (method, id, movie) => {
        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
        }
        let url = movieAPI;
        switch (method) {
            case 'PUT':
                url += id;
            case 'POST':
                options.body = JSON.stringify(movie);
                break;
            case 'DELETE':
                url += id;
        }
        const response = await fetch(url, options);
        return await response.json();
    }

    const buildAddForm = () => {
        const addModal = $('#add-movie-modal');
        destroyElementContents(addModal);
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
                <div class="modal-body d-flex" id="add-movie">
                    <div class="flex-grow-1">
                        <label for="add-title">Title</label>
                        <input class="form-control" id="add-title" type="text" placeholder="">
                        <label for="rating">Rating</label>
                        <select class="form-control" id="add-rating" name="rating">
                            <option value="1"> 1</option>
                            <option value="2">2</option>
                            <option selected value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                        <label for="add-genre">Genre</label>
                        <input class="form-control" id="add-genre" type="text" placeholder="">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal" id="reset-add">Close</button>
                    <button type="button" class="btn btn-primary" data-dismiss="modal" id="submit-add">Save</button>
                </div>
            </div>
        </div>`;

        // display form for users
        addModal.append(addForm);

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

        $('#sort-select, #order-select').on('change', getMovies);

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
        if(DEBUG.verbose) console.log(property)
        let sortOrder = 1;

        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }

        return function (a, b) {
            if(sortOrder === -1){
                return b[property].toString().localeCompare(a[property]);
            }else{
                return a[property].toString().localeCompare(b[property]);
            }
        }
    }

    const addMovieDetails = async (movie) => {
        return await fetchMovie(movie.title)
            .then(data => {
                movie.year = data['Year'];
                movie.plot = data['Plot'];
                movie.poster = data['Poster'];
                movie.actors = data['Actors'];
                movie.director = data['Director'];
                movie.genre = data['Genre'];
                movie.title = data['Title'];
                return movie;
            });
    }

    const fetchMovie = async (title) => {
        const response = await fetch(`http://www.omdbapi.com/?t=${title}&apikey=${OMDB_KEY}`);
        if (!response.ok) throw new Error (`${response.status}`)
        return await response.json();
    }

    // all actual work done that is not simply function definitions should go in here to keep organized :)
    (() => {
        // grab movies and do setup work as soon as page loads
        getMovies();
        filterMovieList();
    })();
});