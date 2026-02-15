// --- CONFIGURATION & OBFUSCATION ---
// Target: 40.56674, -112.00842
// const _0x1a = "NDAuNTY2NzQ="; 
// const _0x2b = "LTExMi4wMDg0Mg==";

// Home testing coordinates (currently active)
const _0x1a = "NDAuNTU1ODgzNA=="
const _0x2b = "LTExMS45ODM0Nzg1";

const TARGET_DISTANCE_FEET = 20; 
let timeRemaining = 180; 
let hintInterval = null;
let puzzleSolved = false;

// Map & Marker variables
let map = null;
let userMarker = null;
let accuracyCircle = null;

// UI References
const congratsModal = document.getElementById("congratsModal");
const hintModal = document.getElementById("hintModal");
const closeCongratsBtn = document.getElementById("closeCongrats");
const closeHintBtn = document.getElementById("closeHint");
const viewCongratsBtn = document.getElementById("viewCongratsBtn");
const gpsStatus = document.getElementById("gps-status");
const distanceDisplay = document.getElementById("distance-display");

function decodeCoord(str) { return parseFloat(atob(str)); }

// --- GPS & MAP LOGIC ---

// Haversine Formula for accurate distance
function getDistanceInFeet(lat1, lon1, lat2, lon2) {
    const R = 20902231; // Radius of Earth in feet
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(Value) {
    return Value * Math.PI / 180;
}

function initMap(lat, lon) {
    // Initialize Leaflet Map
    map = L.map('map').setView([lat, lon], 18); // Zoom level 18 is good for walking

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Create User Marker (Blue)
    userMarker = L.marker([lat, lon]).addTo(map).bindPopup("You are here").openPopup();
    
    // Create Accuracy Circle (Blue, translucent)
    accuracyCircle = L.circle([lat, lon], {radius: 10}).addTo(map);
}

function updatePosition(position) {
    if (puzzleSolved) return;

    const crd = position.coords;
    const targetLat = decodeCoord(_0x1a);
    const targetLon = decodeCoord(_0x2b);
    
    // Calculate Distance
    const dist = getDistanceInFeet(crd.latitude, crd.longitude, targetLat, targetLon);
    
    // Update Map
    if (!map) {
        initMap(crd.latitude, crd.longitude);
    } else {
        const newLatLng = new L.LatLng(crd.latitude, crd.longitude);
        userMarker.setLatLng(newLatLng);
        accuracyCircle.setLatLng(newLatLng);
        accuracyCircle.setRadius(crd.accuracy); // Visualizes GPS accuracy
        map.setView(newLatLng); // Keeps map centered on user
    }

    // Update UI Text
    gpsStatus.innerText = "Tracking Active";
    gpsStatus.style.color = "#007bff";
    
    distanceDisplay.innerText = `Distance: ${Math.round(dist)} ft`;
    
    // Console log for debugging
    console.log(`Lat: ${crd.latitude}, Lon: ${crd.longitude}, Dist: ${dist} ft`);

    // Check Win Condition
    if (dist <= TARGET_DISTANCE_FEET) {
        handleSuccess();
    }
}

function handleSuccess() {
    if (puzzleSolved) return;
    puzzleSolved = true;
    gpsStatus.innerText = "Target Reached!";
    gpsStatus.style.color = "#009f3c";
    distanceDisplay.innerText = "Distance: 0 ft";

    if (hintInterval) clearInterval(hintInterval);
    congratsModal.style.display = "block";
    viewCongratsBtn.style.display = "inline-block";
}

function handleError(error) {
    let msg = "GPS Error: ";
    switch(error.code) {
        case 1: msg = "Location Access Denied."; break;
        case 2: msg = "Position Unavailable."; break;
        case 3: msg = "GPS Timeout."; break;
        default: msg = "Unknown GPS Error.";
    }
    gpsStatus.innerText = msg;
    gpsStatus.style.color = "red";
}

function initGPS() {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        gpsStatus.innerText = "HTTPS required for GPS.";
        gpsStatus.style.color = "red";
        return;
    }

    const options = { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updatePosition, handleError, options);
    } else {
        gpsStatus.innerText = "Geolocation not supported.";
    }
}

// --- TIMER & MODAL LOGIC (Unchanged) ---

function showHint() { hintModal.style.display = "block"; }

function transformTimerToButton() {
    const display = document.getElementById('hint-timer');
    if(display) {
        display.innerHTML = `<button id="hint-button" style="cursor:pointer; padding: 5px 10px;">View Hint</button>`;
        document.getElementById('hint-button').addEventListener('click', showHint);
    }
}

function startTimer() {
    const display = document.getElementById('hint-timer');
    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            if (!puzzleSolved) showHint();
            transformTimerToButton();
            return;
        }
        timeRemaining--;
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        if(display) display.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    startTimer();
    initGPS();
    
    const congratsMsg = "PGgyPkdldCB0byB0aGUgbmV4dCBldmVudCE8L2gyPgogICAgICAgIDxwPjxhIGhyZWY9Imh0dHBzOi8vd2hhdDN3b3Jkcy5jb20vamVsbHkueWVhcnMuY2hpcHMiIHRhcmdldD0iX2JsYW5rIj4vLy9qZWxseS55ZWFycy5jaGlwczwvYT4uIEhlYWQgdG8gYSBzcG9ydGluZyB2ZW51ZSBwcmFjdGljZSBncm91bmRzIGluIFdlc3QgSm9yZGFuLiBMb29rIGluIHRoZSBlcXVpcG1lbnQgeW91IGZpbmQgYXQgdGhlIGxvY2F0aW9uLjwvcD4=";
    const hintMsg = "PGgyPkhpbnQ8L2gyPgogICAgICAgIDxwPlRoaW5rIGNyb3Nzd29yZCBjbHVlcy4gSnVzdCB0cnkgc29tZSBsZXR0ZXJzIGlmIHlvdSdyZSByZWFsbHkgc3R1Y2sgYW5kIGxvb2sgdG8gdGhlIGNvbG9ycyB0byBoZWxwIHlvdSBvdXQuPC9wPg==";
    
    document.getElementById('congratsContent').innerHTML = atob(congratsMsg);
    document.getElementById('hintContent').innerHTML = atob(hintMsg);
});

// Modal Events
if(closeCongratsBtn) closeCongratsBtn.onclick = () => congratsModal.style.display = "none";
if(closeHintBtn) closeHintBtn.onclick = () => hintModal.style.display = "none";
if(viewCongratsBtn) viewCongratsBtn.onclick = () => congratsModal.style.display = "block";
window.onclick = (e) => {
    if (e.target == congratsModal || e.target == hintModal) {
        congratsModal.style.display = "none";
        hintModal.style.display = "none";
    }
};