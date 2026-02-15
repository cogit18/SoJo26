function setViewportScale(scale) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', `width=device-width, initial-scale=${scale}, maximum-scale=${scale}`);
    }
}

// --- CONFIGURATION & OBFUSCATION ---
// Target: 40.56674, -112.00842
// Base64 Encoded to prevent casual reading of source code
// const _0x1a = "NDAuNTY2NzQ="; 
// const _0x2b = "LTExMi4wMDg0Mg==";
// Home testing, 40.5558834,-111.9834785
const _0x1a = "NDAuNTU1ODgzNA=="
const _0x2b = "LTExMS45ODM0Nzg1";

// Target distance in feet
const TARGET_DISTANCE_FEET = 10;

let timeRemaining = 180; // 3:00 minutes
let hintInterval = null;
let puzzleSolved = false;

// Modal Logic References
const congratsModal = document.getElementById("congratsModal");
const hintModal = document.getElementById("hintModal");
const closeCongratsBtn = document.getElementById("closeCongrats");
const closeHintBtn = document.getElementById("closeHint");
const viewCongratsBtn = document.getElementById("viewCongratsBtn");
const gpsStatus = document.getElementById("gps-status");

// --- UTILITIES ---

function decodeCoord(str) {
    return parseFloat(atob(str));
}

function showHint() {
    hintModal.style.display = "block";
}

function transformTimerToButton() {
    const display = document.getElementById('hint-timer');
    if(display) {
        display.innerHTML = `<button id="hint-button" style="cursor:pointer; padding: 2px 5px;">View Hint</button>`;
        document.getElementById('hint-button').addEventListener('click', showHint);
    }
}

function startPersistentTimer() {
    if (hintInterval) return; 
    const display = document.getElementById('hint-timer');
    
    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            if (!puzzleSolved) {
                showHint();
            }
            transformTimerToButton();
            return;
        }
        
        timeRemaining--;
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        if(display) {
            display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// --- GPS LOGIC (Adapted from dist.html) ---

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
    dist = dist * 60 * 1.1515;
    dist = dist * 5280; // Convert Miles to Feet
    return dist;
}

function updatePosition(position) {
    if (puzzleSolved) return;

    const targetLat = decodeCoord(_0x1a);
    const targetLon = decodeCoord(_0x2b);
    
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    const dist = getDistanceInFeet(currentLat, currentLon, targetLat, targetLon);
    
    // Debug log in console only, not on screen
    console.log(`Distance: ${Math.round(dist)} feet`);

    // Update status text to show it is working, without giving the number
    gpsStatus.innerText = "Tracking location...";
    gpsStatus.style.color = "#009f3c";

    if (dist <= TARGET_DISTANCE_FEET) {
        handleSuccess();
    }
}

function handleSuccess() {
    if (puzzleSolved) return;
    puzzleSolved = true;
    
    gpsStatus.innerText = "Target Location Reached!";
    gpsStatus.style.fontWeight = "bold";

    // 1. Handle Timer Logic (Silent stop)
    if (hintInterval) {
        clearInterval(hintInterval);
        timeRemaining = 0; 
        transformTimerToButton(); 
    }

    // 2. Show Congrats
    congratsModal.style.display = "block";
    viewCongratsBtn.style.display = "inline-block";
}

function handleError(error) {
    console.warn("GPS Error: " + error.code);
    gpsStatus.innerText = "Please enable GPS to find the target.";
    gpsStatus.style.color = "red";
}

function initGPS() {
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updatePosition, handleError, options);
    } else {
        gpsStatus.innerText = "Geolocation is not supported by this browser.";
    }
}

// --- INITIALIZATION ---

// Modal closing logic
if(closeCongratsBtn) closeCongratsBtn.onclick = () => { congratsModal.style.display = "none"; }
if(closeHintBtn) closeHintBtn.onclick = () => { hintModal.style.display = "none"; }
window.onclick = (event) => {
    if (event.target == congratsModal) congratsModal.style.display = "none";
    if (event.target == hintModal) hintModal.style.display = "none";
}
if(viewCongratsBtn) viewCongratsBtn.onclick = () => { congratsModal.style.display = "block"; }

document.addEventListener('DOMContentLoaded', () => {
    startPersistentTimer();
    initGPS(); // Start the GPS tracking immediately
    
    // Populate Modal Content
    const congratsMsg = "PGgyPkdldCB0byB0aGUgbmV4dCBldmVudCE8L2gyPgogICAgICAgIDxwPjxhIGhyZWY9Imh0dHBzOi8vd2hhdDN3b3Jkcy5jb20vamVsbHkueWVhcnMuY2hpcHMiIHRhcmdldD0iX2JsYW5rIj4vLy9qZWxseS55ZWFycy5jaGlwczwvYT4uIEhlYWQgdG8gYSBzcG9ydGluZyB2ZW51ZSBwcmFjdGljZSBncm91bmRzIGluIFdlc3QgSm9yZGFuLiBMb29rIGluIHRoZSBlcXVpcG1lbnQgeW91IGZpbmQgYXQgdGhlIGxvY2F0aW9uLjwvcD4=";
    const hintMsg = "PGgyPkhpbnQ8L2gyPgogICAgICAgIDxwPlRoaW5rIGNyb3Nzd29yZCBjbHVlcy4gSnVzdCB0cnkgc29tZSBsZXR0ZXJzIGlmIHlvdSdyZSByZWFsbHkgc3R1Y2sgYW5kIGxvb2sgdG8gdGhlIGNvbG9ycyB0byBoZWxwIHlvdSBvdXQuPC9wPg==";

    const congratsContent = document.getElementById('congratsContent');
    const hintContent = document.getElementById('hintContent');
    
    if(congratsContent) congratsContent.innerHTML = atob(congratsMsg);
    if(hintContent) hintContent.innerHTML = atob(hintMsg);
});