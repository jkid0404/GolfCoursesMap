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

var map, popup, datasourceUnplayedPublic, datasourceUnplayedPrivate, datasourcePlayed, iconLayerUnPlayedPublic, iconLayerUnPlayedPrivate, iconLayerPlayed, centerMarker, searchURL;
var listItemTemplate = '<div class="listItem" onclick="itemSelected(\'{id}\')"><div class="listItem-title">{title}</div>{city}<br />Open until {closes}<br />{distance} miles away</div>';

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

    //Use MapControlCredential to share authentication between a map control and the service module.
    var pipeline = atlas.service.MapsURL.newPipeline(new atlas.service.MapControlCredential(map));

    //Create an instance of the SearchURL client.
    searchURL = new atlas.service.SearchURL(pipeline);

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
                showPopup(e.shapes[0]);
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
    //Download the store location data.
    fetch(storeLocationDataUrl)
        .then(response => response.text())
        .then(function (text) {

            //Parse the Tab delimited file data into GeoJSON features.
            var featuresUnplayedPublic = [];
            var featuresUnplayedPrivate = [];
            var featuresPlayed = [];

            //Split the lines of the file.
            var lines = text.split('\n');

            //Grab the header row.
            var row = lines[0].split(',');

            //Parse the header row and index each column, so that when our code for parsing each row is easier to follow.
            var header = {};
            var numColumns = row.length;
            var i;

            for (i = 0; i < row.length; i++) {
                header[row[i].trim()] = i;
            }
        
            //Skip the header row and then parse each row into a GeoJSON feature.
            for (i = 1; i < lines.length; i++) {
                row = lines[i].split(',');

                //Ensure that the row has the right number of columns.
                if (row.length >= numColumns) {
                    var longitude = parseFloat(row[header['Longitude']]);
                    var latitude = parseFloat(row[header['Latitude']]);
                    var played = row[header['Played']];
                    var access = row[header['Access']];
                    var feature = new atlas.data.Feature(new atlas.data.Point([longitude, latitude]), {
                        Course: row[header['Course']],
                        Address: row[header['Address']],
                        City: row[header['City']],
                        State: row[header['State']],
                        Info: row[header['Info']],
                        Access: access,
                        ZIP: row[header['ZIP']],
                        Played: played,
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
                }
            }

            //Add the features to the data source.
            datasourceUnplayedPublic.add(featuresUnplayedPublic);
            datasourceUnplayedPrivate.add(featuresUnplayedPrivate);
            datasourcePlayed.add(featuresPlayed);

            //Initially update the list items.
            updateListItems();
        });
}

function performSearch() {
    var query = document.getElementById('searchTbx').value;

    //Perform a fuzzy search on the users query.
    searchURL.searchFuzzy(atlas.service.Aborter.timeout(3000), query, {
        //Pass in the array of country ISO2 for which we want to limit the search to.
        countrySet: countrySet,
        view: 'Auto'
    }).then(results => {
        //Parse the response into GeoJSON so that the map can understand.
        var data = results.geojson.getFeatures();

        if (data.features.length > 0) {
            //Set the camera to the bounds of the results.
            map.setCamera({
                bounds: data.features[0].bbox,
                padding: 40
            });
        } else {
            document.getElementById('listPanel').innerHTML = '<div class="statusMessage">Unable to find the location you searched for.</div>';
        } 
    });
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

function updateListItems() {
    //Hide the center marker.
    centerMarker.setOptions({
        visible: false
    });

    //Get the current camera/view information for the map.
    var camera = map.getCamera();

    var listPanel = document.getElementById('listPanel');

    //Check to see if the user is zoomed out a lot. If they are, tell them to zoom in closer, perform a search or press the My Location button.
    if (camera.zoom < maxClusterZoomLevel) {
        //Close the popup as clusters may be displayed on the map. 
        //popup.close();

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

        //List the ten closest locations in the side panel.
        var html = [], properties;

        /*
            Generating HTML for each item that looks like this:
         
            <div class="listItem" onclick="itemSelected('id')">
                <div class="listItem-title">1 Microsoft Way</div>
                Redmond, WA 98052<br />
                Open until 9:00 PM<br />
                0.7 miles away
            </div>
         */

        //Get all the shapes that have been rendered in the bubble layer. 
        var data = map.layers.getRenderedShapes(map.getCamera().bounds, [iconLayerUnPlayedPrivate, iconLayerUnPlayedPublic, iconLayerPlayed]);

        //Create an index of the distances of each shape.
        // var distances = {};

        // data.forEach(function (shape) {
        //     if (shape instanceof atlas.Shape) {

        //         //Calculate the distance from the center of the map to each shape and store in the index. Round to 2 decimals.
        //         distances[shape.getId()] = Math.round(atlas.math.getDistanceTo(camera.center, shape.getCoordinates(), 'miles') * 100) / 100;
        //     }
        // });

        // //Sort the data by distance.
        // data.sort(function (x, y) {
        //     return distances[x.getId()] - distances[y.getId()];
        // });

        data.forEach(function (shape) {
            properties = shape.getProperties();

            html.push('<div class="listItem" onclick="itemSelected(\'', shape.getId(), '\')"><div class="listItem-title">',
                getCorrectFlagIconForList(properties),
                properties['Course'],
                '</div>',

                //Get a formatted address line 2 value
                getAddressLine2(properties),
                '<br />',

                //Convert the course info into a nicely formated time.
                getCourseInfo(properties),
                '</div>');
        });
        
        listPanel.innerHTML = html.join('');

        //Scroll to the top of the list panel in case the user has scrolled down.
        listPanel.scrollTop = 0;
    }
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
function getAddressLine2(properties) {
    var html = [properties['Address']];
    html.push('<br />');
    html.push(properties['City']);
    html.push(', ');
    html.push(properties['State']);
    html.push(' ');
    html.push(properties['ZIP']);

    return html.join('');
}

//When a user clicks on a result in the side panel, look up the shape by its id value and show popup.
function itemSelected(id) {
    //Get the shape from the data source using it's id. 
    var shape = datasourceUnplayedPublic.getShapeById(id);
    if (shape === null) {
        shape = datasourceUnplayedPrivate.getShapeById(id);
    }
    if (shape === null) {
        shape = datasourcePlayed.getShapeById(id);
    }
    showPopup(shape);

    //Center the map over the shape on the map.
    var center = shape.getCoordinates();
    var offset;

    //If the map is less than 700 pixels wide, then the layout is set for small screens.
    if (map.getCanvas().width < 700) {
        //When the map is small, offset the center of the map relative to the shape so that there is room for the popup to appear.
        offset = [0, -80];
    }

    map.setCamera({
        center: center,
        centerOffset: offset
    });
}

function showPopup(shape) {
    var properties = shape.getProperties();
    var html = ['<div class="storePopup">'];

    html.push('<div class="popupTitle">',
        properties['Course'],
        '<div class="popupSubTitle">',
        getAddressLine2(properties),
        '</div></div><div class="popupContent">',
        getCourseInfo(properties),
    );

    html.push('</div></div>');

    //Update the content and position of the popup for the specified shape information.
    popup.setOptions({
        //Create a table from the properties in the feature.
        content:  html.join(''),
        position: shape.getCoordinates()
    });

    //Open the popup.
    popup.open(map);
}

//Initialize the application when the page is loaded.
window.onload = initialize;
