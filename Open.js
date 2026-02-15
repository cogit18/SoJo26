// --- CONFIGURATION & OBFUSCATION ---
// Target: 40.56674, -112.00842
// const _0x1a = "NDAuNTY2NzQ="; 
// const _0x2b = "LTExMi4wMDg0Mg==";

// Home testing coordinates, 40.5558421,-111.983518 (currently active)
const _0x1a = "NDAuNTU1ODQyMQ=="
const _0x2b = "LTExMS45ODM1MTg=";

const TARGET_DISTANCE_FEET = 10; 
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
function updatePosition(position) {
    if (puzzleSolved) return;

    const crd = position.coords;
    const targetLat = decodeCoord(_0x1a);
    const targetLon = decodeCoord(_0x2b);
    
    // Calculate Distance
    const dist = getDistanceInFeet(crd.latitude, crd.longitude, targetLat, targetLon);
    
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

    if (hintInterval) {
        clearInterval(hintInterval);
        timeRemaining = 0; 
        transformTimerToButton(); 
    }
    const congratsModal = document.getElementById("congratsModal");
    const viewCongratsBtn = document.getElementById("viewCongratsBtn");
    if (congratsModal) congratsModal.style.display = "block";
    if (viewCongratsBtn) viewCongratsBtn.style.display = "inline-block";
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
    
    const congratsMsg = "PGgyPllvdSBtYWRlIGl0ITwvaDI+CiAgICAgICAgPHA+Tm93IGdldCByZWFkeSBmb3IgdGhlIG9wZW5pbmcgY2VyZW1vbmllcy4gSGF2ZSBhIHRlYW0gbWVtYmVyIGdvIGdldCB0aGUgU3BlZWRRdWl6emluZyBhcHAuIE9ubHkgb25lIHBlcnNvbiBwZXIgdGVhbSBuZWVkcyBpdC48L3A+";
    const hintMsg = "PGgyPkhpbnQ8L2gyPgogICAgICAgIDxwPklmIHlvdSdyZSBzdHVyZ2dsaW5nIHRvIG1ha2UgaXQgd29yayBvbiBvbmUgcGhvbmUsIGhhdmUgYW5vdGhlciB0ZWFtIG1lbWJlciB0cnkuIFlvdSBjYW4gYWxzbyBnbyBsb29rIGF0IHlvdXIgc2V0dGluZ3MuPC9wPgogICAgICAgIDxwPmlPUzogU2V0dGluZ3MgPiBQcml2YWN5ICYgU2VjdXJpdHkgPiBMb2NhdGlvbiBTZXJ2aWNlcyA+IHlvdXIgd2ViIGJyb3dzZXIgKFNhZmFyaSwgQ2hyb21lLCBldGMuKSA+IEFzayBOZXh0IFRpbWU7IHRoZW4gcmVmcmVzaCB0aGUgd2Vic2l0ZSBhbmQgY2hvb3NlIGFsbG93LjwvcD4KICAgICAgICA8cD5BbmRyb2lkOiBTZXR0aW5ncyA+IExvY2F0aW9uID4gVHVybiBPTiBVc2UgTG9jYXRpb24gYW5kIGNoZWNrIEFwcCBwZXJtaXNzaW9ucyB0byBtYWtlIHN1cmUgeW91ciB3ZWIgYnJvd3NlciAoQ2hyb21lLCBldGMuKSBpcyBhbGxvd2VkIHRvIGFjY2VzcyBsb2NhdGlvbjsgdGhlbiByZWZyZXNoIHRoZSB3ZWJzaXRlIGFuZCBjaG9vc2UgYWxsb3cuPC9wPg==";
    
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