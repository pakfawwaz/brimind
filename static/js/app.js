// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibWJva25lZmF3d2F6IiwiYSI6ImNsenI3NGlyMDBvaDQybHB5ZW1qYXl5c2kifQ.XOWtDVjujchdVVccT4sARA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [113.9213, -0.7893], // Center on Indonesia
    zoom: 4 // Adjust zoom level to show Indonesia
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
    drawCircle(sample.lat, sample.lng);
    updateSampleList();

    // Clear chemical inputs after adding a sample
    document.getElementById('chemical-inputs').innerHTML = '';
    chemicals = {};
});

function updateSampleList() {
    const sampleListDiv = document.getElementById('samples');
    sampleListDiv.innerHTML = ''; // Clear the list
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
    circleLayers.push(circleId); // Store the circle layer for later reference
}

function removeSample(index) {
    console.log("Removing sample at index:", index);

    // Remove the sample from the array
    samples.splice(index, 1);

    // Remove the corresponding marker from the map
    markers[index].remove();
    markers.splice(index, 1);

    // Remove the corresponding circle from the map
    const circleId = circleLayers[index].id;
    map.removeLayer(circleId);
    map.removeSource(circleId);
    circleLayers.splice(index, 1);

    // Update the sample list in the UI
    updateSampleList();
}

function removeChemical(chemical) {
    delete chemicals[chemical];
    document.getElementById(`chemical-${chemical}`).parentElement.remove();
}

// Handle circle hover effect
map.on('mousemove', function (e) {
    const features = map.queryRenderedFeatures(e.point, {
        layers: circleLayers.map(circle => circle.id)
    });

    map.getCanvas().style.cursor = features.length ? 'pointer' : '';

    if (features.length) {
        const hoveredCircleId = features[0].layer.id;
        map.setPaintProperty(hoveredCircleId, 'fill-color', 'rgba(200, 0, 0, 0.5)');
    } else {
        circleLayers.forEach(circle => {
            map.setPaintProperty(circle.id, 'fill-color', 'rgba(0, 200, 0, 0.5)');
        });
    }
});