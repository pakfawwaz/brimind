// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibWJva25lZmF3d2F6IiwiYSI6ImNsenI3NGlyMDBvaDQybHB5ZW1qYXl5c2kifQ.XOWtDVjujchdVVccT4sARA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [113.9213, -0.7893], // Coordinates for the center of Indonesia
    zoom: 4 // Adjust zoom level to fit Indonesia
});

// Sample data handling
let samples = [];
let chemicals = {};
let markers = []; // Array to store markers
let circleLayers = []; // Array to store circle layers

document.getElementById('add-chemical').addEventListener('click', function() {
    const chemicalSelect = document.getElementById('chemical-select');
    const chemical = chemicalSelect.value;
    const chemicalText = chemicalSelect.options[chemicalSelect.selectedIndex].text;

    if (!chemicals[chemical]) {
        const chemicalInputDiv = document.createElement('div');
        chemicalInputDiv.classList.add('chemical-input');
        chemicalInputDiv.innerHTML = `
            <label>${chemicalText}:</label>
            <input type="number" step="any" id="chemical-${chemical}" name="chemical-${chemical}">
            <button type="button" class="remove-button" onclick="removeChemical('${chemical}')">Remove</button>
        `;
        document.getElementById('chemical-inputs').appendChild(chemicalInputDiv);
        chemicals[chemical] = true;
    }
});

document.getElementById('add-sample').addEventListener('click', function() {
    // Collect the form data
    let sample = {
        type: document.getElementById('sample-type').value,
        lat: parseFloat(document.getElementById('latitude').value),
        lng: parseFloat(document.getElementById('longitude').value),
        geochemistry: {}
    };

    // Collect geochemistry data
    for (let chemical in chemicals) {
        const value = parseFloat(document.getElementById(`chemical-${chemical}`).value) || 0;
        sample.geochemistry[chemical] = value;
    }

    samples.push(sample);
    let marker = plotOnMap(sample);
    markers.push(marker); // Store the marker for later removal
    updateSampleList();
   
    // Draw circle around the sample
    drawCircle(sample.lat, sample.lng);
   
    // Clear chemical inputs after adding a sample
    document.getElementById('chemical-inputs').innerHTML = '';
    chemicals = {};
});

function calculateMidpoint(lat1, lng1, lat2, lng2) {
    const latMid = (lat1 + lat2) / 2;
    const lngMid = (lng1 + lng2) / 2;
    return [latMid, lngMid];
}

function updateSampleList() {
    const sampleListDiv = document.getElementById('samples');
    sampleListDiv.innerHTML = '';
    samples.forEach((sample, index) => {
        const sampleDiv = document.createElement('div');
        sampleDiv.classList.add('sample-item');
        let geochemistryText = '';
        for (let chemical in sample.geochemistry) {
            geochemistryText += `${chemical.toUpperCase()} = ${sample.geochemistry[chemical]}, `;
        }
        sampleDiv.innerHTML = `
            <strong>Sample ${index + 1}</strong><br>
            Type: ${sample.type}<br>
            Latitude: ${sample.lat}<br>
            Longitude: ${sample.lng}<br>
            Geochemistry: ${geochemistryText.slice(0, -2)}<br>
            <button type="button" class="remove-button" onclick="removeSample(${index})">Remove Sample</button>
        `;
        sampleListDiv.appendChild(sampleDiv);
    });
}

function plotOnMap(sample) {
    let marker = new mapboxgl.Marker()
        .setLngLat([sample.lng, sample.lat])
        .addTo(map);
    return marker;
}

function drawCircle(lat, lng) {
    const radiusInMeters = 30; // 30 meters
    const circleId = `circle-${circleLayers.length}`;

    const newCircle = {
        lat: lat,
        lng: lng,
        radius: radiusInMeters
    };

    // Check for overlaps
    for (let i = 0; i < circleLayers.length; i++) {
        const existingCircle = circleLayers[i];
        const distance = getDistanceFromLatLonInMeters(existingCircle.lat, existingCircle.lng, lat, lng);

        if (distance < radiusInMeters * 2) {
            // Calculate midpoint and create a new marker
            const [midLat, midLng] = calculateMidpoint(existingCircle.lat, existingCircle.lng, lat, lng);
            new mapboxgl.Marker({ color: "red" }) // Different color for overlap
                .setLngLat([midLng, midLat])
                .addTo(map);
        }
    }

    const circleLayer = {
        id: circleId,
        type: 'fill',
        source: {
            type: 'geojson',
            data: createGeoJSONCircle([lng, lat], radiusInMeters)
        },
        layout: {},
        paint: {
            'fill-color': 'rgba(0, 200, 0, 0.5)',
            'fill-outline-color': '#007cbf'
        }
    };

    map.addLayer(circleLayer);
    circleLayers.push(newCircle); // Store the circle's lat, lng, and radius
}

// Function to calculate the distance between two coordinates in meters
function getDistanceFromLatLonInMeters(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Radius of the Earth in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function createGeoJSONCircle(center, radiusInMeters, points = 64) {
    const coords = {
        latitude: center[1],
        longitude: center[0]
    };

    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);

        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [ret]
        }
    };
}

function removeSample(index) {
    samples.splice(index, 1);
    markers[index].remove(); // Remove the marker from the map
    markers.splice(index, 1); // Remove the marker from the array

    // Remove the circle from the map
    const circleId = circleLayers[index];
    map.removeLayer(circleId);
    map.removeSource(circleId);
    circleLayers.splice(index, 1);

    updateSampleList();
}

function removeChemical(chemical) {
    delete chemicals[chemical];
    document.getElementById(`chemical-${chemical}`).parentElement.remove();
}

// Handle circle hover effect
map.on('mousemove', function (e) {
    const features = map.queryRenderedFeatures(e.point, {
        layers: circleLayers
    });

    map.getCanvas().style.cursor = features.length ? 'pointer' : '';

    if (features.length) {
        // Change overlapping parts of circles on hover
        const hoveredCircleId = features[0].layer.id;
        map.setPaintProperty(hoveredCircleId, 'fill-color', 'rgba(200, 0, 0, 0.5)');
    } else {
        // Reset color for all circles
        circleLayers.forEach(circleId => {
            map.setPaintProperty(circleId, 'fill-color', 'rgba(0, 200, 0, 0.5)');
        });
    }
});
