// --- CONFIGURATION & OBFUSCATION ---
// Target: 40.56674, -112.00842
// const _0x1a = "NDAuNTY2NzQ="; 
// const _0x2b = "LTExMi4wMDg0Mg==";

// Home testing, 40.5558834,-111.9834785
const _0x1a = "NDAuNTU1ODgzNA=="
const _0x2b = "LTExMS45ODM0Nzg1";

// Increased to 20ft for mobile GPS reliability (standard jitter is ~15ft)
const TARGET_DISTANCE_FEET = 20; 
let timeRemaining = 180; 
let hintInterval = null;
let puzzleSolved = false;

// UI References
const congratsModal = document.getElementById("congratsModal");
const hintModal = document.getElementById("hintModal");
const closeCongratsBtn = document.getElementById("closeCongrats");
const closeHintBtn = document.getElementById("closeHint");
const viewCongratsBtn = document.getElementById("viewCongratsBtn");
const gpsStatus = document.getElementById("gps-status");

function decodeCoord(str) { return parseFloat(atob(str)); }

// --- GPS LOGIC (Optimized for Mobile Stability) ---

function getDistanceInFeet(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) return 0;
    var radlat1 = Math.PI * lat1/180;
    var radlat2 = Math.PI * lat2/180;
    var theta = lon1-lon2;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) dist = 1;
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515 * 5280; // Miles to Feet
    return dist;
}

function updatePosition(position) {
    if (puzzleSolved) return;

    const crd = position.coords;
    const targetLat = decodeCoord(_0x1a);
    const targetLon = decodeCoord(_0x2b);
    const dist = getDistanceInFeet(crd.latitude, crd.longitude, targetLat, targetLon);
    
    // Update UI with real-time feedback
    // Note: Showing accuracy helps users know if they need to move away from buildings
    gpsStatus.innerText = `Tracking active (Accuracy: ±${Math.round(crd.accuracy * 3.28)}ft). Move toward the target...`;
    gpsStatus.style.color = "#007bff"; 

    console.log(`Distance: ${Math.round(dist)} ft`); 

    if (dist <= TARGET_DISTANCE_FEET) {
        handleSuccess();
    }
}

function handleSuccess() {
    if (puzzleSolved) return;
    puzzleSolved = true;
    gpsStatus.innerText = "Target Found!";
    gpsStatus.style.color = "#009f3c";

    if (hintInterval) clearInterval(hintInterval);
    congratsModal.style.display = "block";
    viewCongratsBtn.style.display = "inline-block";
}

function handleError(error) {
    let msg = "GPS Error: ";
    switch(error.code) {
        case 1: // PERMISSION_DENIED
            msg = "Location Access Denied. Please enable location permissions in your browser/phone settings and refresh.";
            alert("This game requires GPS. Please allow location access.");
            break;
        case 2: // POSITION_UNAVAILABLE
            msg = "Position Unavailable. Check your signal or Wi-Fi.";
            break;
        case 3: // TIMEOUT
            msg = "GPS Timeout. Standing in a clear area for a moment might help.";
            break;
        default:
            msg = "An unknown GPS error occurred.";
    }
    
    gpsStatus.innerText = msg;
    gpsStatus.style.color = "red";
}

function initGPS() {
    // SECURITY CHECK: Geolocation strictly requires HTTPS on mobile
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        gpsStatus.innerText = "Error: Use HTTPS to enable GPS tracking.";
        gpsStatus.style.color = "red";
        return;
    }

    const options = { 
        enableHighAccuracy: true, // Forces phone to use GPS hardware, not just Cell Towers
        timeout: 10000,           // 10 seconds before giving up on a single "look"
        maximumAge: 0             // Do not use a cached location
    };
    
    if (navigator.geolocation) {
        // watchPosition is better for mobile as it stays active while the user walks
        navigator.geolocation.watchPosition(updatePosition, handleError, options);
    } else {
        gpsStatus.innerText = "Geolocation not supported by this browser.";
    }
}

// --- TIMER & MODAL LOGIC ---

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