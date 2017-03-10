var papp = {};

papp.map;

papp.googleApiKey = 'AIzaSyAIE6FNON09T5VbnCh_HfoADsz1prORR68';

papp.petApiKey = '5643b4e4140ed1e99bc21e6bbbfb3fd6';

papp.elements = {
    $petDetails: $('#petDetails'),
    $petGallery: $('#petGallery'),
    $petInfo: $('#petInfo'),
    $petName: $('.petName'),
    $petBreed: $('.petBreed'),
    $petGender: $('.petGender'),
    $petAge: $('.petAge'),
    $petDescription: $('.petDescription'),
    $petAddress: $('.petAddress')
};

papp.petData;
papp.markers=[];
papp.selectedShelterInfo = [];

papp.displayPetMedia = function(media) {
    papp.elements.$petGallery.empty();
    const $imageCarousel = $('<div>')
    .addClass('mainCarousel')
    .appendTo(papp.elements.$petGallery);

    if(media.photos !== undefined) {
        media.photos.photo.forEach(function(photo){
            // Only show the largest version of the photo
            if(photo['@size'] === 'x') {

                // Build carousel and it's items
                $('<img/>')
                .addClass('petImage carouselItem')
                .attr('src', photo.$t)
                .appendTo($imageCarousel);
            }
        }); 
    }
    else {
        $('<img/>')
        .addClass('petImage carouselItem')
        .attr('src', 'assets/images/no_images_found.jpg')
        .appendTo($imageCarousel);
    }

    $('.mainCarousel').flickity({
        contain: true,
        groupCells: true,
        groupCells: 1,
        setGallerySize: false,
        imagesLoaded: true
    });
};

papp.displayPetInfo = function(petIndex) {
    const name = papp.petData[petIndex].name.$t;
    const age = papp.petData[petIndex].age.$t;
    const gender = papp.petData[petIndex].sex.$t;
    const media = papp.petData[petIndex].media;
    const streetAddress = papp.petData[petIndex].contact.address1.$t;
    const city = papp.petData[petIndex].contact.city.$t;
    const state = papp.petData[petIndex].contact.state.$t;
    const zip = papp.petData[petIndex].contact.zip.$t;
    const email = papp.petData[petIndex].contact.email.$t;
    const address = `${streetAddress}, ${city}, ${state}, ${zip}, ${email}`;

    papp.displayPetMedia(media);

    let description = 'No description availible for this pet.'
    if(papp.petData[petIndex].description.$t !== undefined) {
        description = papp.petData[petIndex].description.$t;
    }
    papp.elements.$petName.html("<span>Name:</span> " + name);
    papp.elements.$petGender.html("<span>Gender:</span> " + gender);
    papp.elements.$petAge.html("<span>Age:</span> " + age);
    papp.elements.$petDescription.html("<span>About Me:</span> " + description);
    papp.elements.$petAddress.html("<span>Shelter Address:</span> " + address);
};

papp.initMap = function() {
    papp.map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 50.09024, lng: -95.712891},
        zoom: 4
    });

    papp.infoWindow = new google.maps.InfoWindow({map: null});
    // Try HTML5 geolocation.
}

papp.locateUser = function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // papp.infoWindow.setPosition(pos);
            // papp.infoWindow.setContent('Location found.');
            papp.map.setCenter(pos);
            papp.map.setZoom(16);
            papp.generateMapMarker(pos);
            papp.reverseGeolocation(pos);
        }, 
    function() {
        papp.handleLocationError(true, papp.infoWindow, papp.map.getCenter());
    });

    } 
    else {
        // Browser doesn't support Geolocation
        papp.handleLocationError(false, papp.infoWindow, papp.map.getCenter());
    }
}

papp.handleLocationError = function(browserHasGeolocation, infoWindow, pos) {
    papp.infoWindow.setPosition(pos);
    papp.infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

papp.generateMapMarker = function(places) {
    const marker = new google.maps.Marker({
        map: papp.map,
        position: places
    });
    

    return marker;
}

papp.assignInfoWindow = function(marker, contentInfo) {
    google.maps.event.addListener(marker, 'click', function() {
        const content= `<div class="infoBox"><h3>${contentInfo.name}</h3> <br> <button class="viewDetails" value=${contentInfo.shelterId}>View Birds</button></div>`;
        papp.infoWindow.setContent(content);
        papp.infoWindow.open(papp.map, this);
        $('.viewDetails').on('click', function(){
            papp.selectedShelterInfo = papp.petData.filter(function(pet){
                return pet.shelterId.$t === contentInfo.shelterId;
            });
            //replace this console.log to call to function to display bird data
            console.log(papp.selectedShelterInfo);
        });
    });
}

//-------------------------------------------PLACES API SEARCH ----------------------------

papp.searchFor = function(searchString) {
    const response = $.ajax({
        url: 'https://proxy.hackeryou.com',
        dataType: 'json',
        method:'GET',
        data: {
            reqUrl: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            params: {
                key: papp.googleApiKey,
                input: searchString,
                types: 'geocode',
                language: 'en',
                components: 'country:us|country:ca',
            },
            xmlToJSON: false
        }
    });
    $.when(response)
    .done(function(responseInfo) {
        papp.displayAutoCompleteResults(responseInfo.predictions);
    })
    .fail(function(error) {
        console.error('ERROR: ', error);
    });
};

papp.searchField = $('#searchField');
papp.userSearchInputResult;

// ================================================AUTOCOMPLETE FUNCTION=============

papp.displayAutoCompleteResults = (results) => {

    const autocompleteItemClass = 'autocompleteItem';
    const autocompleteList = [];
    
    if(results.length > 0) {
        results.forEach(function(result) {
            autocompleteList.push({ label: result.description, value: result.place_id });
        });

        papp.searchField.autocomplete({
            minLength:3,
            source: autocompleteList,
            select: function(event, ui) {
                event.preventDefault();
                $(this).val(ui.item.label);
                papp.userSearchInputResult = ui.item.value;
            },
            focus: function(event, ui) {
                event.preventDefault(); // or return false;
                $(this).val(ui.item.label);
                papp.userSearchInputResult = ui.item.value;
            },
            messages: {
                noResults: '',
                results: function() {}
            }
        });
    }
};

papp.placeToPos = function(placeId) {
    const results = $.ajax({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        dataType: 'json',
        method: 'GET',
        data: {
            key: papp.googleApiKey,
            place_id: placeId
        }
    });
    $.when(results)
    .done(function (result) {
        papp.userLocation = result.results[0].geometry.location;
        papp.reverseGeolocation(papp.userLocation);
        papp.map.setCenter(papp.userLocation);
        papp.map.setZoom(16);
        papp.getAddress(result);
    });
}

papp.reverseGeolocation = function(pos) {

    $.ajax({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        dataType: 'json',
        method: 'GET',
        data: {
            key: papp.googleApiKey,
            latlng: pos.lat + ',' + pos.lng
        }
    }).then(function(addressResult) {
        papp.getAddress(addressResult);
    });
}

papp.getAddress = function(addressResult) {
    if (addressResult.status !== "OK") {
        console.log("no results");
    } else {
            var address = addressResult.results[0].address_components;
            var postalCodeObject = address.filter(function(component){
                return component.types[0] === "postal_code";
            });
            var postalCode = postalCodeObject[0].long_name;
        }

        if (postalCode.length < 5) {
            var cityObject = address.filter(function(component){
                return component.types[0] === "locality";
            });
            var provinceObject = address.filter(function(component){
                return component.types[0] === "administrative_area_level_1";
            });
            var city = cityObject[0].long_name;
            var province = provinceObject[0].long_name;
            var newCity = city + ', ' + province;
            var useCity = 1;
        }

        if (useCity === 1) {
            papp.getShelters(newCity);
        } else {
            papp.getShelters(postalCode);
        }

    };

    papp.getShelters = function(location) {
        $.ajax({
         url: 'https://api.petfinder.com/pet.find',
         dataType: 'jsonp',
         method: 'GET',
         data: {
             key: papp.petApiKey,
             animal: 'bird',
             format: 'json',
             location: location
         }
     }).then(function(petfinderInfo){
         papp.petData = petfinderInfo.petfinder.pets.pet;
         let shelterAddressesArray =[];
         let shelterIdsArray =[];
         for (var i=0; i < papp.petData.length; i++) {
            shelterAddressesArray.push(papp.petData[i].contact.address1.$t + ', ' + papp.petData[i].contact.city.$t + ', ' + papp.petData[i].contact.state.$t);
            shelterIdsArray.push(papp.petData[i].shelterId.$t);
        }
        shelterAddressesArray = _.uniq(shelterAddressesArray);
        shelterIdsArray = _.uniq(shelterIdsArray);
        papp.getShelterInfo(shelterAddressesArray, shelterIdsArray);
    });
}

papp.getShelterInfo = function(shelterAddressesArray, shelterIdsArray) {
    const shelterInfoArray = shelterIdsArray.map(function(shelter){
        return $.ajax({
            url: 'https://api.petfinder.com/shelter.get',
            dataType: 'jsonp',
            method: 'GET',
            data: {
                key: papp.petApiKey,
                format: 'json',
                id: shelter
            }
        });
    });
    $.when.apply(null, shelterInfoArray)
        .then(function() {
            let shelters = Array.prototype.slice.call(arguments);
            shelters = shelters.map(function(shelter) {
                return {name: shelter[0].petfinder.shelter.name.$t, shelterId: shelter[0].petfinder.shelter.id.$t};
            });
            papp.getSheltersGeoCode(shelterAddressesArray, shelters);
        });
}

papp.getSheltersGeoCode = function(shelterAddresses, shelterNames) {
    const shelterGeoArray = shelterAddresses.map(function(shelter){
        return $.ajax({
            url:'https://maps.googleapis.com/maps/api/geocode/json',
            dataType: 'json',
            method: 'GET',
            data: {
                key: papp.googleApiKey,
                address: shelter
            }
        })
    });
    $.when.apply(null, shelterGeoArray)
        .then(function() {
            let sheltersGeo = Array.prototype.slice.call(arguments);
            sheltersGeo = sheltersGeo.map(function(shelter) {
                return shelter[0].results[0].geometry.location;
            });
            for (var x =0; x < sheltersGeo.length; x++){
                papp.markers.push(papp.generateMapMarker(sheltersGeo[x]));
            }
            for (var y=0; y < shelterNames.length; y++) {
                papp.assignInfoWindow(papp.markers[y], shelterNames[y]);
            }
            papp.setMapBounds(papp.markers);
        });
}

papp.setMapBounds = function(markers) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
     bounds.extend(markers[i].getPosition());
    }

    papp.map.fitBounds(bounds);
}

papp.events = function() {
    $('button').on('click', function() {
        const buttonClicked = $(this);
        if(buttonClicked.val() === 'pet1') {
            papp.displayPetInfo(0);
        }
        else if(buttonClicked.val() === 'pet2') {
            papp.displayPetInfo(1);
        }
        else if(buttonClicked.val() === 'pet3') {
            papp.displayPetInfo(2);
        }
        else if(buttonClicked.val() === 'pet4') {
            papp.displayPetInfo(15);
        }
    });

    $('#searchForm').on('submit', function(event) {
        event.preventDefault();

        console.log('form submitted')
        if(papp.userSearchInputResult !== undefined) {
            papp.placeToPos(papp.userSearchInputResult);
        }

        $('.searchOverlay').addClass('searchOverlayTop');
    });

    papp.searchField.on('input', function(event) {
        papp.searchFor($(this).val());
    });

    $('#autolocate').on('click', function (event){
        event.preventDefault;
        papp.locateUser();
    })
};

papp.init = function(){
    papp.searchFor();
    papp.initMap();
    papp.events();

}

$(function(){
    papp.init();
});