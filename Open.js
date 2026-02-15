// --- CONFIGURATION & OBFUSCATION ---
// Target: 40.56674, -112.00842
// const _0x1a = "NDAuNTY2NzQ="; 
// const _0x2b = "LTExMi4wMDg0Mg==";

// Home testing, 40.5558834,-111.9834785
const _0x1a = "NDAuNTU1ODgzNA=="
const _0x2b = "LTExMS45ODM0Nzg1";


const TARGET_DISTANCE_FEET = 10;
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

// --- GPS LOGIC (Adapted for Mobile Stability) ---

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

    // Update UI to show we are actively receiving data
    gpsStatus.innerText = "Tracking active. Move toward the target...";
    gpsStatus.style.color = "#007bff"; 

    const targetLat = decodeCoord(_0x1a);
    const targetLon = decodeCoord(_0x2b);
    const dist = getDistanceInFeet(position.coords.latitude, position.coords.longitude, targetLat, targetLon);
    
    console.log(`Distance: ${Math.round(dist)} ft`); // Hidden from user

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
    if (error.code == 1) msg += "Permission Denied. Please enable location.";
    else if (error.code == 2) msg += "Position Unavailable.";
    else if (error.code == 3) msg += "Request Timed Out. Stand in a clear area.";
    
    gpsStatus.innerText = msg;
    gpsStatus.style.color = "red";
}

function initGPS() {
    // SECURITY CHECK: Geolocation fails on HTTP.
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        gpsStatus.innerText = "Error: Use HTTPS to enable GPS tracking.";
        gpsStatus.style.color = "red";
        return;
    }

    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    
    if (navigator.geolocation) {
        // Kickstart GPS hardware (Logic from dist.html)
        navigator.geolocation.getCurrentPosition(updatePosition, handleError, options);
        // Continuous tracking
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
        display.innerHTML = `<button id="hint-button" style="cursor:pointer; padding: 2px 5px;">View Hint</button>`;
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