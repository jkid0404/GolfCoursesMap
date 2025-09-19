//The maximum zoom level to cluster data point data on the map.
var maxClusterZoomLevel = 10;

//The URL to the store location data.
var storeLocationDataUrl = 'data/MasterList_USA.csv';

//The URL to the icon image. 
var unplayedPrivateIcon = 'images/BlackFlag.png';
var unplayedPublicIcon = 'images/BlueFlag.png';
var playedIcon = 'images/RedFlag.png';

//An array of country region ISO2 values to limit searches to.
var countrySet = ['US'];      

var map, popup, datasourceUnplayedPublic, datasourceUnplayedPrivate, datasourcePlayed, iconLayerUnPlayedPublic, iconLayerUnPlayedPrivate, iconLayerPlayed, centerMarker, username;

var featuresAll = [];

// Helper function to find feature by ID
function findFeatureById(id) {
    return featuresAll.find(feature => feature.properties.ID == id);
}

function initialize() {
    // username = document.getElementById('username').value;

    //Initialize a map instance.
    map = new atlas.Map('myMap', {
        center: [-90, 40],
        zoom: 4,
        view: 'Auto',

        //Add authentication details for connecting to Azure Maps.
        authOptions: {
        //     //Use Azure Active Directory authentication.
        //     authType: 'anonymous',
        //     clientId: 'e6b6ab59-eb5d-4d25-aa57-581135b927f0', //Your Azure Maps client id for accessing your Azure Maps account.
        //     getToken: function (resolve, reject, map) {
        //         //URL to your authentication service that retrieves an Azure Active Directory Token.
        //         var tokenServiceUrl = "https://samples.azuremaps.com/api/GetAzureMapsToken";

        //         fetch(tokenServiceUrl).then(r => r.text()).then(token => resolve(token));
        //     }

            //Alternatively, use an Azure Maps key. Get an Azure Maps key at https://azure.com/maps. NOTE: The primary key should be used as the key.
            authType: 'subscriptionKey',
            subscriptionKey: '1G23To7U3Qc8VQ9tQoX1tJj7PeGncP4keequbGDTMU4jWgSaatO5JQQJ99AGAC8vTInS4mi1AAAgAZMP5C4J'
        }
    });

    //Create a popup but leave it closed so we can update it and display it later.
    popup = new atlas.Popup();

    //If the user presses the search button, geocode the value they passed in.
    document.getElementById('searchBtn').onclick = performSearch;

    //If the user presses enter in the search textbox, perform a search.
    document.getElementById('searchTbx').onkeyup = function (e) {
        if (e.code === 'Enter') {
            performSearch();
        }
    };

    //If the user presses the My Location button, use the geolocation API to get the users location and center/zoom the map to that location.
    document.getElementById('myLocationBtn').onclick = setMapToUserLocation;

    //Wait until the map resources are ready.
    map.events.add('ready', function () {
        //Add the zoom control to the map.
        map.controls.add(new atlas.control.ZoomControl(), {
            position: 'top-right'
        });

        //Add an HTML marker to the map to indicate the center used for searching.
        centerMarker = new atlas.HtmlMarker({
            htmlContent: '<div class="mapCenterIcon"></div>',
            position: map.getCamera().center
        });

        map.markers.add(centerMarker);

        //Create a data source and add it to the map and enable clustering.
        datasourceUnplayedPublic = new atlas.source.DataSource(null, {
            cluster: true,
            clusterMaxZoom: maxClusterZoomLevel - 1,
            clusterRadius: 75
        });
        datasourceUnplayedPrivate = new atlas.source.DataSource(null, {
            cluster: true,
            clusterMaxZoom: maxClusterZoomLevel - 1,
            clusterRadius: 75
        });
        datasourcePlayed = new atlas.source.DataSource(null, {
            cluster: true,
            clusterMaxZoom: maxClusterZoomLevel - 1,
            clusterRadius: 75
        });

        map.sources.add(datasourceUnplayedPublic);
        map.sources.add(datasourceUnplayedPrivate);
        map.sources.add(datasourcePlayed);

        //Load all the store data now that the data source has been defined. 
        loadStoreData();

        //Create a bubble layer for rendering clustered data points.
        var clusterBubbleLayerUnplayedPublic = new atlas.layer.BubbleLayer(datasourceUnplayedPublic, null, {
            radius: 12,
            color: '#007faa',
            strokeColor: 'white',
            strokeWidth: 2,
            filter: ['has', 'point_count'] //Only render data points which have a point_count property, which clusters do.
        });

        //Create a symbol layer to render the count of locations in a cluster.
        var clusterLabelLayerUnplayedPublic = new atlas.layer.SymbolLayer(datasourceUnplayedPublic, null, {
            iconOptions: {
                image: 'none' //Hide the icon image.
            },
            textOptions: {
                textField: ['get', 'point_count_abbreviated'],
                size: 12,
                font: ['StandardFont-Bold'],
                offset: [0, 0.4],
                color: 'white',
                allowOverlap: true
            }
        });

        var clusterBubbleLayerUnplayedPrivate = new atlas.layer.BubbleLayer(datasourceUnplayedPrivate, null, {
            radius: 12,
            color: '#140d0d',
            strokeColor: 'white',
            strokeWidth: 2,
            filter: ['has', 'point_count'] //Only render data points which have a point_count property, which clusters do.
        });

        var clusterLabelLayerUnplayedPrivate = new atlas.layer.SymbolLayer(datasourceUnplayedPrivate, null, {
            iconOptions: {
                image: 'none' //Hide the icon image.
            },
            textOptions: {
                textField: ['get', 'point_count_abbreviated'],
                size: 12,
                font: ['StandardFont-Bold'],
                offset: [0, 0.4],
                color: 'white',
                allowOverlap: true
            }
        });

        var clusterBubbleLayerPlayed = new atlas.layer.BubbleLayer(datasourcePlayed, null, {
            radius: 12,
            color: '#a83432',
            strokeColor: 'white',
            strokeWidth: 2,
            filter: ['has', 'point_count'] //Only render data points which have a point_count property, which clusters do.
        });

        var clusterLabelLayerPlayed = new atlas.layer.SymbolLayer(datasourcePlayed, null, {
            iconOptions: {
                image: 'none' //Hide the icon image.
            },
            textOptions: {
                textField: ['get', 'point_count_abbreviated'],
                size: 12,
                font: ['StandardFont-Bold'],
                offset: [0, 0.4],
                color: 'white',
                allowOverlap: true
            }
        });

        //Load a custom image icon into the map resources.
        map.imageSprite.add('playedIcon', playedIcon);
        map.imageSprite.add('unplayedPublicIcon', unplayedPublicIcon);
        map.imageSprite.add('unplayedPrivateIcon', unplayedPrivateIcon).then(function () {

            iconLayerUnPlayedPublic = new atlas.layer.SymbolLayer(datasourceUnplayedPublic, null, {
                iconOptions: {
                    //Pass in the id of the custom icon that was loaded into the map resources.
                    image: 'unplayedPublicIcon',

                    //Optionally scale the size of the icon.
                    font: ['SegoeUi-Bold'],

                    //Anchor the center of the icon image to the coordinate.
                    anchor: 'center',

                    //Allow the icons to overlap.
                    allowOverlap: true,
                    ignorePlacement: true
                },
                filter: ['!', ['has', 'point_count']] //Filter out clustered points from this layer.
            });

            iconLayerUnPlayedPrivate = new atlas.layer.SymbolLayer(datasourceUnplayedPrivate, null, {
                iconOptions: {
                    //Pass in the id of the custom icon that was loaded into the map resources.
                    image: 'unplayedPrivateIcon',

                    //Optionally scale the size of the icon.
                    font: ['SegoeUi-Bold'],

                    //Anchor the center of the icon image to the coordinate.
                    anchor: 'center',

                    //Allow the icons to overlap.
                    allowOverlap: true,
                    ignorePlacement: true
                },
                filter: ['!', ['has', 'point_count']] //Filter out clustered points from this layer.
            });

            iconLayerPlayed = new atlas.layer.SymbolLayer(datasourcePlayed, null, {
                iconOptions: {
                    //Pass in the id of the custom icon that was loaded into the map resources.
                    image: 'playedIcon',

                    //Optionally scale the size of the icon.
                    font: ['SegoeUi-Bold'],

                    //Anchor the center of the icon image to the coordinate.
                    anchor: 'center',

                    //Allow the icons to overlap.
                    allowOverlap: true,
                    ignorePlacement: true
                },
                filter: ['!', ['has', 'point_count']] //Filter out clustered points from this layer.
            });

            map.layers.add([clusterBubbleLayerUnplayedPublic, clusterLabelLayerUnplayedPublic, clusterBubbleLayerUnplayedPrivate, clusterLabelLayerUnplayedPrivate, clusterBubbleLayerPlayed, clusterLabelLayerPlayed]);
            map.layers.add([iconLayerUnPlayedPublic, iconLayerUnPlayedPrivate, iconLayerPlayed]);

            //When the mouse leaves the item on the cluster and icon layers, change the cursor back to the default.
            map.events.add('mouseout', [clusterBubbleLayerUnplayedPublic, clusterBubbleLayerPlayed, clusterBubbleLayerUnplayedPrivate, iconLayerUnPlayedPublic, iconLayerUnPlayedPrivate, iconLayerPlayed], function () {
                map.getCanvasContainer().style.cursor = 'auto';
            });

            //When the mouse is over the cluster and icon layers, change the cursor to be a pointer.
            map.events.add('mouseover', [clusterBubbleLayerUnplayedPublic, clusterBubbleLayerPlayed, clusterBubbleLayerUnplayedPrivate, iconLayerUnPlayedPublic, iconLayerUnPlayedPrivate, iconLayerPlayed], function () {
                map.getCanvasContainer().style.cursor = 'pointer';
            });

            //Add a click event to the cluster layer. When someone clicks on a cluster, zoom into it by 2 levels. 
            map.events.add('click', [clusterBubbleLayerUnplayedPublic, clusterBubbleLayerPlayed, clusterBubbleLayerUnplayedPrivate], function (e) {
                map.setCamera({
                    center: e.position,
                    zoom: map.getCamera().zoom + 2
                });
            });

            //Add a click event to the icon layer and show the shape that was clicked.
            map.events.add('click', [iconLayerUnPlayedPublic, iconLayerUnPlayedPrivate, iconLayerPlayed], function (e) {
                var shape = e.shapes[0];
                showPopup(shape.properties, shape.geometry.coordinates);
            });

            //Add an event to monitor when the map has finished moving.
            map.events.add('render', function () {
                //Give the map a chance to move and render data before updating the list.
                updateListItems();
            });
        });
    });
}

function loadStoreData() {
    // Fetch golf course data from backend API (replace with your deployed endpoint)
    fetch('https://golfcoursesfunctionapp-bpd8cjfratg7a2br.westus2-01.azurewebsites.net/api/courses')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(function (courses) {
            var featuresUnplayedPublic = [];
            var featuresUnplayedPrivate = [];
            var featuresPlayed = [];

            courses.forEach((course) => {
                var longitude = parseFloat(course.Longitude);
                var latitude = parseFloat(course.Latitude);
                var played = course.Played;
                var access = course.Access;
                var feature = new atlas.data.Feature(new atlas.data.Point([longitude, latitude]), {
                    Course: course.Course,
                    Address: course.Address,
                    City: course.City,
                    State: course.State,
                    Info: course.Info,
                    Access: access,
                    ZIP: course.ZIP,
                    Played: played,
                    ID: course.ID,
                    Latitude: latitude,
                    Longitude: longitude
                },
                course.ID /*id*/);

                if (played == 0) {
                    if (access === 'Private') {
                        featuresUnplayedPrivate.push(feature);
                    } else {
                        featuresUnplayedPublic.push(feature);
                    }
                } else {
                    featuresPlayed.push(feature);
                }
                featuresAll.push(feature);
            });

            //Add the features to the data source.
            datasourceUnplayedPublic.add(featuresUnplayedPublic);
            datasourceUnplayedPrivate.add(featuresUnplayedPrivate);
            datasourcePlayed.add(featuresPlayed);

            //Initially update the list items.
            updateListItems();
        })
        .catch(error => {
            console.error('Error loading golf course data:', error);
            document.getElementById('listPanel').innerHTML = '<div class="statusMessage">Error loading golf course data. Please check that your Azure Function is running.</div>';
        });
}

function performSearch() {
    var query = String(document.getElementById('searchTbx').value).toLowerCase();

    var subSetFeatures = featuresAll.filter((feature) => String(feature.properties.Course).toLowerCase().includes(query));
    if (subSetFeatures.length > 0) {
        displayList(subSetFeatures);
        } else {
            document.getElementById('listPanel').innerHTML = '<div class="statusMessage">Unable to find the location you searched for.</div>';
        } 
}

function setMapToUserLocation() {
    //Request the user's location.
    navigator.geolocation.getCurrentPosition(function (position) {
        //Convert the geolocation API position into a longitude/latitude position value the map can understand and center the map over it.
        map.setCamera({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: maxClusterZoomLevel + 1
        });
    }, function (error) {
        //If an error occurs when trying to access the users position information, display an error message.
        switch (error.code) {
            case error.PERMISSION_DENIED:
                alert('User denied the request for Geolocation.');
                break;
            case error.POSITION_UNAVAILABLE:
                alert('Position information is unavailable.');
                break;
            case error.TIMEOUT:
                alert('The request to get user position timed out.');
                break;
            case error.UNKNOWN_ERROR:
                alert('An unknown error occurred.');
                break;
        }
    });
}

function updateListItems(idToEdit=-1) {
    //Hide the center marker.
    centerMarker.setOptions({
        visible: false
    });

    //Get the current camera/view information for the map.
    var camera = map.getCamera();

    //Check to see if the user is zoomed out a lot. If they are, tell them to zoom in closer, perform a search or press the My Location button.
    if (camera.zoom < maxClusterZoomLevel) {
        //Close the popup as clusters may be displayed on the map. 
        //popup.close();

        var listPanel = document.getElementById('listPanel');
        var html = [];
        html.push('<button class="editCourseButton" onclick="addNewCourse()">New Course</button>');
        html.push('<br /><br />');
        html.push('<img class="listPlayedIcon" src="' + playedIcon + '">Played course</img>');
        html.push('<br />');
        html.push('<img class="listUnplayedPublicIcon" src="' + unplayedPublicIcon + '">Unplayed public course</img>');
        html.push('<br />');
        html.push('<img src="' + unplayedPrivateIcon + '">Unplayed private course</img>');
        listPanel.innerHTML = html.join('');
    } else {
        //Update the location of the centerMarker.
        centerMarker.setOptions({
            position: camera.center,
            visible: true
        });

        //Get all the shapes that have been rendered in the bubble layer. 
        var listData = map.layers.getRenderedShapes(map.getCamera().bounds, [iconLayerUnPlayedPrivate, iconLayerUnPlayedPublic, iconLayerPlayed]);
        displayList(listData, idToEdit);
    }
}

function displayList(listData, idToEdit=-1) {
    var listPanel = document.getElementById('listPanel');
    var html = [], properties;
    listData.forEach(function (shape) {
        properties = shape.properties;
        if (properties.ID == idToEdit) {
            shape.setProperties({
                Course: properties.Course,
                Address: properties.Address,
                City: properties.City,
                State: properties.State,
                Info: properties.Info,
                Access: properties.Access,
                ZIP: properties.ZIP,
                Played: properties.Played,
                ID: properties.ID,
                Latitude: properties.Latitude,
                Longitude: properties.Longitude
            })
        }

        html.push('<div class="listItem" onclick="itemSelected(\'', properties.ID, '\')"><div class="listItem-title">',
                getCorrectFlagIconForList(properties),
                properties['Course'],
                '</div>',

                //Get a formatted address
                getAddress(properties),
                '<br />',

                //Convert the course info into a nicely formated time.
                getCourseInfo(properties),
                '<br />',

                '<button id="editButton" onClick="event.stopPropagation(); showEditCourseForm(', properties.ID, ')">Edit</button>',
                '</div>'
            );
        });
        
        listPanel.innerHTML = html.join('');

        //Scroll to the top of the list panel in case the user has scrolled down.
        listPanel.scrollTop = 0;
}

function showEditCourseForm(id) {
    var listPanel = document.getElementById('listPanel');
    listPanel.innerHTML = '';

    var feature = findFeatureById(id);
    if (!feature) {
        console.error('Feature not found with ID:', id);
        return;
    }
    var properties = feature.properties;
    
    var formHtml = [
        '<h3>Edit Golf Course</h3>',
        
        '<label for="editCourse">Course Name:</label>',
        '<input type="text" id="editCourse" class="editCourseItem" value="', properties.Course, '">',
        
        '<label for="editAddress">Address:</label>',
        '<input type="text" id="editAddress" class="editCourseItem" value="', properties.Address, '">',
        
        '<label for="editCity">City:</label>',
        '<input type="text" id="editCity" class="editCourseItem" value="', properties.City, '">',
        
        '<label for="editState">State:</label>',
        '<input type="text" id="editState" class="editCourseItem" value="', properties.State, '">',
        
        '<label for="editZIP">ZIP:</label>',
        '<input type="text" id="editZIP" class="editCourseItem" value="', properties.ZIP, '">',

        '<label for="editLat">Latitude:</label>',
        '<input type="text" id="editLat" class="editCourseItem" value="', properties.Latitude, '">',

        '<label for="editLong">Longitude:</label>',
        '<input type="text" id="editLong" class="editCourseItem" value="', properties.Longitude, '">',

        '<label for="editInfo">Course Info:</label>',
        '<input type="text" id="editInfo" class="editCourseItem" value="', properties.Info, '">',
        
        '<label for="editAccess">Access:</label>',
        '<select id="editAccess" class="editCourseItem">',
        '<option value="Public"', (properties.Access === 'Public' ? ' selected' : ''), '>Public</option>',
        '<option value="Private"', (properties.Access === 'Private' ? ' selected' : ''), '>Private</option>',
        '<option value="Semi-Private"', (properties.Access === 'Semi-Private' ? ' selected' : ''), '>Semi-Private</option>',
        '</select>',
        
        '<label for="editPlayed">Played:</label>',
        '<select id="editPlayed" class="editCourseItem">',
        '<option value="0"', (properties.Played == 0 ? ' selected' : ''), '>No</option>',
        '<option value="1"', (properties.Played == 1 ? ' selected' : ''), '>Yes</option>',
        '</select>',
        
        '<button class="editCourseButton" onclick="saveEditedCourse(', id, ')">Save Changes</button>',
        '<button class="editCourseButton" onclick="updateListItems()">Cancel</button>',
        '<br />',
        '<button class="editCourseButton" onclick="deleteCourse(', id, ')">Delete Course</button>',
        '</div>',
        '</div>'
    ];
    
    listPanel.innerHTML = formHtml.join('');
}

function deleteCourse(id) {
    var feature = findFeatureById(id);
    if (!feature) {
        console.error('Feature not found with ID:', id);
        return;
    }
    var courseName = feature.properties.Course;
    
    // Confirm deletion with user
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
        return;
    }
    
    // Delete from database first
    fetch(`https://golfcoursesfunctionapp-bpd8cjfratg7a2br.westus2-01.azurewebsites.net/api/courses/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Course deleted:', data.message);
        
        // Remove from appropriate data source
        if (feature.properties.Played == 1) {
            datasourcePlayed.remove(feature);
        } else if (feature.properties.Access === 'Private') {
            datasourceUnplayedPrivate.remove(feature);
        } else {
            datasourceUnplayedPublic.remove(feature);
        }
        
        // Remove from featuresAll array
        var featureIndex = featuresAll.findIndex(f => f.properties.ID == id);
        if (featureIndex !== -1) {
            featuresAll.splice(featureIndex, 1);
        }
        
        // Close the edit form and refresh the display
        updateListItems();
        popup.close();
    })
    .catch(error => {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
    });
}

function saveEditedCourse(id) {
    var feature = findFeatureById(id);
    if (!feature) {
        console.error('Feature not found with ID:', id);
        return;
    }
    var originalProperties = feature.properties;
    
    var updatedCourse = {
        Course: document.getElementById('editCourse').value,
        Address: document.getElementById('editAddress').value,
        City: document.getElementById('editCity').value,
        State: document.getElementById('editState').value,
        ZIP: document.getElementById('editZIP').value,
        Info: document.getElementById('editInfo').value,
        Access: document.getElementById('editAccess').value,
        Played: parseInt(document.getElementById('editPlayed').value),
        Latitude: document.getElementById('editLat').value,
        Longitude: document.getElementById('editLong').value
    };
    
    // Check if any values have actually changed
    var changedFields = {};
    var hasChanges = false;
    
    for (var key in updatedCourse) {
        // Compare values, handling type conversion
        var originalValue = originalProperties[key];
        var newValue = updatedCourse[key];
        
        // Convert original value to string for comparison if it's not already
        if (key === 'Played') {
            originalValue = parseInt(originalValue);
        } else {
            originalValue = String(originalValue);
            newValue = String(newValue);
        }
        
        if (originalValue !== newValue) {
            changedFields[key] = updatedCourse[key];
            hasChanges = true;
        }
    }
    
    // If no changes, just close the form
    if (!hasChanges) {
        console.log('No changes detected');
        updateListItems();
        return;
    }
    
    console.log('Fields changed:', Object.keys(changedFields));
    
    // Update the database with only changed fields
    fetch(`https://golfcoursesfunctionapp-bpd8cjfratg7a2br.westus2-01.azurewebsites.net/api/courses/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(changedFields)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Course updated:', data.message);
        console.log('Fields updated: ', data.updatedFields);
        
        // Update the frontend feature
        var feature = findFeatureById(id);
        if (!feature) {
            console.error('Feature not found with ID:', id);
            return;
        }
        
        // Remove the old feature from the appropriate datasource
        if (feature.properties.Played == 1) {
            datasourcePlayed.removeById(feature.id);
        } else if (feature.properties.Access === 'Private') {
            datasourceUnplayedPrivate.removeById(feature.id);
        } else {
            datasourceUnplayedPublic.removeById(feature.id);
        }

        // Update all properties
        Object.assign(feature.properties, updatedCourse);
        feature.properties.ID = id; // Preserve the ID

        // Add the feature back into the appropriate datasource
        if (feature.properties.Played == 1) {
            datasourcePlayed.add(feature);
        } else if (feature.properties.Access === 'Private') {
            datasourceUnplayedPrivate.add(feature);
        } else {
            datasourceUnplayedPublic.add(feature);
        }
        
        updateListItems();
    })
    .catch(error => {
        console.error('Error updating course:', error);
        alert('Failed to update course. Please try again.');
    });
}

function getCorrectFlagIconForList(properties) {
    var access = properties['Access'];
    var played = properties['Played'];
    if (played == 1) {
        return '<img class="listPlayedIcon" src="' + playedIcon + '" />'
    }
    else if (access === 'Private') {
        return '<img class="listUnplayedPublicIcon" src="' + unplayedPrivateIcon + '" />'
    }
    else {
        return '<img src="' + unplayedPublicIcon + '" />'
    }
}

//Get course info
function getCourseInfo(properties) {
    var html = [properties['Info']];
    html.push('<br />');
    html.push(properties['Access']);
    html.push('<br />');
    html.push('Played: ');
    html.push(properties['Played'] == 1 ? 'Yes' : 'No');

    return html.join('');
}

//Creates an addressLine2 string consisting of Address, City, State, and ZIP.
function getAddress(properties) {
    var html = [properties['Address']];
    html.push('<br />');
    html.push(properties['City']);
    html.push(', ');
    html.push(properties['State']);
    html.push(' ');
    html.push(properties['ZIP']);

    return html.join('');
}

//When a user clicks on a result in the side panel, look up the course by its id value and show popup.
function itemSelected(id) {
    var feature = findFeatureById(id);
    if (!feature) {
        console.error('Feature not found with ID:', id);
        return;
    }
    var coordinates = feature.geometry.coordinates
    showPopup(feature.properties, coordinates);

    //Center the map over the shape on the map.
    var offset;

    //If the map is less than 700 pixels wide, then the layout is set for small screens.
    if (map.getCanvas().width < 700) {
        //When the map is small, offset the center of the map relative to the shape so that there is room for the popup to appear.
        offset = [0, -80];
    }

    map.setCamera({
        center: coordinates,
        centerOffset: offset,
        zoom: 12,
        view: 'Auto',
    });
}

function showPopup(properties, coordinates) {
    var html = ['<div class="storePopup">'];

    html.push('<div class="popupTitle">',
        properties['Course'],
        '<div class="popupSubTitle">',
        getAddress(properties),
        '</div></div><div class="popupContent">',
        getCourseInfo(properties),
    );

    html.push('</div></div>');

    //Update the content and position of the popup for the specified shape information.
    popup.setOptions({
        //Create a table from the properties in the feature.
        content:  html.join(''),
        position: coordinates
    });

    //Open the popup.
    popup.open(map);
}

function addNewCourse() {
    var listPanel = document.getElementById('listPanel');
    listPanel.innerHTML = '';
    
    var formHtml = [
        '<h3>Add New Golf Course</h3>',
        
        '<label for="newCourse">Course Name:</label>',
        '<input type="text" id="newCourse" class="editCourseItem" value="" required>',
        
        '<label for="newAddress">Address:</label>',
        '<input type="text" id="newAddress" class="editCourseItem" value="" required>',
        
        '<label for="newCity">City:</label>',
        '<input type="text" id="newCity" class="editCourseItem" value="" required>',
        
        '<label for="newState">State:</label>',
        '<input type="text" id="newState" class="editCourseItem" value="" required>',
        
        '<label for="newZIP">ZIP:</label>',
        '<input type="text" id="newZIP" class="editCourseItem" value="" required>',

        '<label for="newLat">Latitude:</label>',
        '<input type="number" step="any" id="newLat" class="editCourseItem" value="" required>',

        '<label for="newLong">Longitude:</label>',
        '<input type="number" step="any" id="newLong" class="editCourseItem" value="" required>',

        '<label for="newInfo">Course Info:</label>',
        '<input type="text" id="newInfo" class="editCourseItem" value="">',
        
        '<label for="newAccess">Access:</label>',
        '<select id="newAccess" class="editCourseItem">',
        '<option value="Public" selected>Public</option>',
        '<option value="Private">Private</option>',
        '<option value="Semi-Private">Semi-Private</option>',
        '</select>',
        
        '<label for="newPlayed">Played:</label>',
        '<select id="newPlayed" class="editCourseItem">',
        '<option value="0" selected>No</option>',
        '<option value="1">Yes</option>',
        '</select>',
        
        '<button class="editCourseButton" onclick="saveNewCourse()">Create Course</button>',
        '<button class="editCourseButton" onclick="updateListItems()">Cancel</button>'
    ];
    
    listPanel.innerHTML = formHtml.join('');
}

function showUserSignIn() {
    var listPanel = document.getElementById('listPanel');
    listPanel.innerHTML = '';
    
    var formHtml = [
        '<h3>User Sign In</h3>',
        
        '<label for="username">User Name:</label>',
        '<input type="text" id="username" class="editCourseItem" value="" placeholder="Enter your username" required>',
        
        '<br /><br />',
        '<button class="editCourseButton" onclick="initialize()">Sign In</button>'
    ];
    
    listPanel.innerHTML = formHtml.join('');
    
    // Focus on the username input
    document.getElementById('username').focus();
}

function saveNewCourse() {
    var newCourse = {
        Course: document.getElementById('newCourse').value,
        Address: document.getElementById('newAddress').value,
        City: document.getElementById('newCity').value,
        State: document.getElementById('newState').value,
        ZIP: document.getElementById('newZIP').value,
        Info: document.getElementById('newInfo').value,
        Access: document.getElementById('newAccess').value,
        Played: parseInt(document.getElementById('newPlayed').value),
        Latitude: parseFloat(document.getElementById('newLat').value),
        Longitude: parseFloat(document.getElementById('newLong').value)
    };
    
    // Validate required fields
    if (!newCourse.Course || !newCourse.Address || !newCourse.City || !newCourse.State || 
        !newCourse.ZIP || isNaN(newCourse.Latitude) || isNaN(newCourse.Longitude)) {
        alert('Please fill in all required fields (Course, Address, City, State, ZIP, Latitude, Longitude)');
        return;
    }
    
    // Create new course in database
    fetch('https://golfcoursesfunctionapp-bpd8cjfratg7a2br.westus2-01.azurewebsites.net/api/courses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCourse)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Course created:', data.message);
        
        // Create new feature for the frontend
        var newFeature = new atlas.data.Feature(
            new atlas.data.Point([newCourse.Longitude, newCourse.Latitude]), 
            {
                Course: newCourse.Course,
                Address: newCourse.Address,
                City: newCourse.City,
                State: newCourse.State,
                Info: newCourse.Info,
                Access: newCourse.Access,
                ZIP: newCourse.ZIP,
                Played: newCourse.Played,
                ID: data.courseId,
                Latitude: newCourse.Latitude,
                Longitude: newCourse.Longitude
            },
            data.courseId
        );
        
        // Add to appropriate data source and featuresAll array
        if (newCourse.Played == 1) {
            datasourcePlayed.add(newFeature);
        } else if (newCourse.Access === 'Private') {
            datasourceUnplayedPrivate.add(newFeature);
        } else {
            datasourceUnplayedPublic.add(newFeature);
        }
        
        featuresAll.push(newFeature);
        
        // Refresh the display
        updateListItems();
        alert(`Course "${newCourse.Course}" has been created successfully!`);
    })
    .catch(error => {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
    });
}

//Initialize the application when the page is loaded.
window.onload = initialize;
