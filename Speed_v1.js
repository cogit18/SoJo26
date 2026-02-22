// --- CONFIGURATION & OBFUSCATION ---
const TARGET_DISTANCE_FEET = 15; // Slightly increased tolerance for multi-point outdoor GPS mapping
let timeRemaining = 180; 
let hintInterval = null;

// Base64 Encoded Checkpoints
const checkpoints = [
    {
        id: "stanza1",
        lat: "NDAuNTc4Mjc=", // 40.57827
        lon: "LTExMi4wMDI5NA==", // -112.00294
        text: "T3V0IG9mIHRoZSBuaWdodCB0aGF0IGNvdmVycyBtZSw8YnI+Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7QmxhY2sgYXMgdGhlIHBpdCBmcm9tIHBvbGUgdG8gcG9sZSw8YnI+SSB0aGFuayB3aGF0ZXZlciBnb2RzIG1heSBiZTxicj4mbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtGb3IgbXkgdW5jb25xdWVyYWJsZSBzb3VsLg==",
        reached: false
    },
    {
        id: "stanza2",
        lat: "NDAuNTc2NTk=", // 40.57659
        lon: "LTExMi4wMDI5NA==", // -112.00294
        text: "SW4gdGhlIGZlbGwgY2x1dGNoIG9mIGNpcmN1bXN0YW5jZTxicj4mbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtJIGhhdmUgbm90IHdpbmNlZCBub3IgY3JpZWQgYWxvdWQuPGJyPlVuZGVyIHRoZSBibHVkZ2VvbmluZ3Mgb2YgY2hhbmNlPGJyPiZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO015IGhlYWQgaXMgYmxvb2R5LCBidXQgdW5ib3dlZC4=",
        reached: false
    },
    {
        id: "stanza3",
        lat: "NDAuNTc2ODE=", // 40.57681
        lon: "LTExMi4wMDE4OQ==", // -112.00189
        text: "QmV5b25kIHRoaXMgcGxhY2Ugb2Ygd3JhdGggYW5kIHRlYXJzPGJyPiZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO0xvb21zIGJ1dCB0aGUgSG9ycm9yIG9mIHRoZSBzaGFkZSw8YnI+QW5kIHlldCB0aGUgbWVuYWNlIG9mIHRoZSB5ZWFyczxicj4mbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtGaW5kcyBhbmQgc2hhbGwgZmluZCBtZSB1bmFmcmFpZC4=",
        reached: false
    },
    {
        id: "stanza4",
        lat: "NDAuNTc4NDU=", // 40.57845
        lon: "LTExMi4wMDE5", // -112.0019
        text: "SXQgbWF0dGVycyBub3QgaG93IHN0cmFpdCB0aGUgZ2F0ZSw8YnI+Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7SG93IGNoYXJnZWQgd2l0aCBwdW5pc2htZW50cyB0aGUgc2Nyb2xsLDxicj5JIGFtIHRoZSBtYXN0ZXIgb2YgbXkgZmF0ZSw8YnI+Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7SSBhbSB0aGUgY2FwdGFpbiBvZiBteSBzb3VsLg==",
        reached: false
    }
];

// UI References
const congratsModal = document.getElementById("congratsModal");
const hintModal = document.getElementById("hintModal");
const closeCongratsBtn = document.getElementById("closeCongrats");
const closeHintBtn = document.getElementById("closeHint");
const viewCongratsBtn = document.getElementById("viewCongratsBtn");
const gpsStatus = document.getElementById("gps-status");

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
    const crd = position.coords;
    let reachedCount = 0;

    checkpoints.forEach((cp) => {
        if (cp.reached) {
            reachedCount++;
            return;
        }

        const targetLat = decodeCoord(cp.lat);
        const targetLon = decodeCoord(cp.lon);
        const dist = getDistanceInFeet(crd.latitude, crd.longitude, targetLat, targetLon);
        
        // Console log for debugging
        console.log(`Checking ${cp.id} | Dist: ${dist} ft`);

        if (dist <= TARGET_DISTANCE_FEET) {
            cp.reached = true;
            document.getElementById(cp.id).innerHTML = atob(cp.text);
            document.getElementById(cp.id).classList.add("found");
            reachedCount++;
        }
    });

    if (reachedCount === checkpoints.length) {
        handleSuccess();
    } else {
        gpsStatus.innerText = `Tracking Active - ${reachedCount}/${checkpoints.length} Checkpoints Reached`;
        gpsStatus.style.color = "#007bff";
    }
}

function handleSuccess() {
    gpsStatus.innerText = "All Checkpoints Reached!";
    gpsStatus.style.color = "#009f3c";

    if (hintInterval) {
        clearInterval(hintInterval);
        timeRemaining = 0; 
        transformTimerToButton(); 
    }
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
            // Only auto-show hint if they haven't found everything
            const allReached = checkpoints.every(cp => cp.reached);
            if (!allReached) showHint();
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
    
    // Decoded using atob natively inside the JS execution
    const congratsMsg = "PGgyPlRpbWUgdG8gcGVyZm9ybTwvaDI+PHA+SGVhZCBiYWNrIHRvIHRoZSBzdGFydGluZyBsaW5lIGFuZCByZWNpdGUgdGhlIHBvZW0gZnJvbSBtZW1vcnkuIERpdmlkZSB1cCB0aGUgcG9lbSBob3dldmVyIHlvdSB3YW50LCBidXQgZWFjaCB0ZWFtIG1lbWJlciBuZWVkcyB0byBwYXJ0aWNpcGF0ZS48L3A+";
    const hintMsg = "PGgyPkhpbnQ8L2gyPjxwPk9seW1waWMgc3BlZWQgc2thdGluZyBhbHdheXMgZ29lcyBpbiBhIGNvdW50ZXItY2xvY2t3aXNlIGRpcmVjdGlvbi4gRmluZCB0aGUgZ3JlZW5iZWx0IHBhdGgganVzdCB0byB0aGUgd2VzdCBvZiB0aGUgS2xpbXVpciBQYXJrIHRoYXQgaGVhZHMgYmFjayB0byBTa3llIERyaXZlIGJldHdlZW4gdGhlIGhvdXNlcy4gQ3Jvc3MgdGhlIHN0cmVldCBhbmQgbG9vayBmb3IgYWxsIG9mIHlvdXIgY2hlY2twb2ludHMgYmVmb3JlIHlvdSBoZWFkIGJhY2sgdG93YXJkcyB0aGUgc3RhcnRpbmcgcG9pbnQgaW4gb25lIGJpZyBsb29wLjwvcD4=";
    
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