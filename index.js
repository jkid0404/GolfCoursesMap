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

var map, popup, datasourceUnplayedPublic, datasourceUnplayedPrivate, datasourcePlayed, iconLayerUnPlayedPublic, iconLayerUnPlayedPrivate, iconLayerPlayed, centerMarker;

var featuresAll = [];

function initialize() {
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
                showPopup(shape.getProperties(), shape.getCoordinates());
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
                    ID: course.ID
                });

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
        displayList(subSetFeatures, isFromMap=false);
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

function updateListItems(idToMarkPlayed=-1) {
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
        displayList(listData, isFromMap=true, idToMarkPlayed);
    }
}

function displayList(listData, isFromMap, idToMarkPlayed=-1) {
    var listPanel = document.getElementById('listPanel');
    var html = [], properties;
    listData.forEach(function (shape) {
        properties = isFromMap ? shape.getProperties() : shape.properties;
        var isPlayed = properties.Played == 1;

        if (properties.ID == idToMarkPlayed) {
            shape.setProperties({
                Course: properties.Course,
                Address: properties.Address,
                City: properties.City,
                State: properties.State,
                Info: properties.Info,
                Access: properties.Access,
                ZIP: properties.ZIP,
                Played: 1,
                ID: properties.ID
            })
        }

        html.push('<div class="', (isPlayed ? 'listPlayedItem' : 'listItem'), '" onclick="itemSelected(\'', properties.ID, '\')"><div class="listItem-title">',
                getCorrectFlagIconForList(properties),
                properties['Course'],
                '</div>',

                //Get a formatted address
                getAddress(properties),
                '<br />',

                //Convert the course info into a nicely formated time.
                getCourseInfo(properties));

        if (!isPlayed) {
            html.push('<br />',
                '<button id="markPlayedButton" onClick="markPlayed(', properties.ID, ')">Mark Played</button>');
        }
        html.push('</div>');
        });
        
        listPanel.innerHTML = html.join('');

        //Scroll to the top of the list panel in case the user has scrolled down.
        listPanel.scrollTop = 0;
}

function markPlayed(id) {
    var feature = featuresAll[id - 1];
    
    // Update the database first
    fetch(`https://golfcoursesfunctionapp-bpd8cjfratg7a2br.westus2-01.azurewebsites.net/api/courses/${id}/played`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ played: 1 })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Only update the frontend if the database update was successful
        console.log('Database updated:', data.message);
        feature.properties.Played = 1;
        
        // Remove the course from its current data source and add it to the played data source
        if (feature.properties.Access === 'Private') {
            datasourceUnplayedPrivate.remove(feature);
        } else {
            datasourceUnplayedPublic.remove(feature);
        }
        datasourcePlayed.add(feature);
        
        updateListItems(idToMarkPlayed=id);
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
    var feature = featuresAll[id - 1];
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

//Initialize the application when the page is loaded.
window.onload = initialize;
