// Toggle this to false for the real event
const QA_MODE = true; 

const XOR_KEY = "1415926535";

function xorDecrypt(t) {
    try {
        const e = atob(t);
        let n = "";
        for (let t = 0; t < e.length; t++) n += String.fromCharCode(e.charCodeAt(t) ^ XOR_KEY.charCodeAt(t % 10));
        return n;
    } catch (t) {
        return "";
    }
}

// GPS Constants
const TARGET_LAT = 40.58072;
const TARGET_LON = -111.9904;
const TARGET_DISTANCE_FEET = 30;

// Application State
let timeRemaining = 180;
let validationTimeRemaining = 180;
let hintInterval = null;
let validationInterval = null;

let puzzleSolved = false;
let canValidate = false;
let locationReached = false;

// --- Modal & Timer Controls ---
function showHint() { 
    const hintModal = document.getElementById("hintModal");
    if (hintModal) hintModal.style.display = "block"; 
}

function transformTimerToButton() {
    const hintWrapper = document.getElementById("hint-wrapper");
    if (!hintWrapper) return;
    hintWrapper.innerHTML = '<button id="hint-button" style="cursor:pointer; padding: 2px 5px; font-size: 0.9em;">View Hint</button>';
    const hintBtn = document.getElementById("hint-button");
    if (hintBtn) hintBtn.addEventListener("click", showHint);
}

function startValidationTimer() {
    const container = document.getElementById("validation-container");
    const valTimerSpan = document.getElementById("validation-timer");
    if (container) container.style.display = "inline";

    validationInterval = setInterval(() => {
        if (validationTimeRemaining <= 0) {
            clearInterval(validationInterval);
            if (valTimerSpan) valTimerSpan.innerHTML = '<span style="color: #009f3c; font-weight: bold;">Active</span>';
            canValidate = true;
            validateInputs(); // Trigger an immediate color update once active
            return;
        }
        validationTimeRemaining--;
        let m = Math.floor(validationTimeRemaining / 60);
        let s = validationTimeRemaining % 60;
        if (valTimerSpan) valTimerSpan.innerText = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }, 1000);
}

function startHintTimer() {
    const timerSpan = document.getElementById("hint-timer");
    if (!timerSpan) return;

    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            transformTimerToButton();
            if (!puzzleSolved) {
                startValidationTimer(); // Start the 2nd timer immediately after the 1st
            }
            return;
        }
        timeRemaining--;
        let m = Math.floor(timeRemaining / 60);
        let s = timeRemaining % 60;
        timerSpan.innerText = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }, 1000);
}

// --- GPS & Puzzle Integration Helper ---
function activateLocationMessage(showModalImmediately) {
    const gpsStatus = document.getElementById("gps-status");
    const viewLocationBtn = document.getElementById("viewLocationBtn");
    const locationModal = document.getElementById("locationModal");

    if (gpsStatus) gpsStatus.style.display = "none";
    if (viewLocationBtn) viewLocationBtn.style.display = "block"; // Flexbox handles side-by-side
    
    if (showModalImmediately && locationModal) {
        locationModal.style.display = "block";
    }
}

// --- Input Validation Logic ---
function validateInputs() {
    const table = document.getElementById("targetTable");
    if (!table) return;

    let allCorrect = true;

    table.querySelectorAll("input").forEach((input) => {
        const correctAnswer = xorDecrypt(input.getAttribute("data-answer")).toLowerCase();
        const userAnswer = input.value.toLowerCase();
        const parent = input.parentElement;

        if (userAnswer === "") {
            if (canValidate) parent.style.backgroundColor = "";
            allCorrect = false;
        } else if (userAnswer === correctAnswer) {
            if (canValidate) parent.style.backgroundColor = "#009f3c";
        } else {
            if (canValidate) parent.style.backgroundColor = "#df0024";
            allCorrect = false;
        }
    });

    if (allCorrect && !puzzleSolved) {
        puzzleSolved = true;
        
        if (hintInterval) clearInterval(hintInterval);
        if (validationInterval) clearInterval(validationInterval);
        
        transformTimerToButton();
        
        canValidate = true;
        const valContainer = document.getElementById("validation-container");
        const valTimer = document.getElementById("validation-timer");
        const congratsModal = document.getElementById("congratsModal");
        const viewCongratsBtn = document.getElementById("viewCongratsBtn");

        if (valContainer) valContainer.style.display = "inline";
        if (valTimer) valTimer.innerHTML = '<span style="color: #009f3c; font-weight: bold;">Complete</span>';
        table.querySelectorAll("input").forEach(input => input.parentElement.style.backgroundColor = "#009f3c");
        
        if (congratsModal) congratsModal.style.display = "block";
        if (viewCongratsBtn) viewCongratsBtn.style.display = "block";

        if (locationReached) {
            activateLocationMessage(false); 
        }
    }
}

// --- GPS Logic ---
function toRad(value) { return value * Math.PI / 180; }

function getDistanceInFeet(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 20902231 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function handleLocationSuccess() {
    if (locationReached) return;
    locationReached = true;
    
    const gpsStatus = document.getElementById("gps-status");

    if (puzzleSolved) {
        activateLocationMessage(true);
    } else {
        if (gpsStatus) {
            gpsStatus.innerText = "Target Reached! Solve the puzzle to unlock.";
            gpsStatus.style.color = "#009f3c";
        }
    }
}

function updatePosition(position) {
    if (QA_MODE || locationReached) return;
    const coords = position.coords;
    const distance = getDistanceInFeet(coords.latitude, coords.longitude, TARGET_LAT, TARGET_LON);
    
    const gpsStatus = document.getElementById("gps-status");

    if (gpsStatus) {
        gpsStatus.innerText = "Tracking Active";
        gpsStatus.style.color = "#007bff";
    }
    
    if (distance <= TARGET_DISTANCE_FEET) {
        handleLocationSuccess();
    }
}

function handleLocationError(err) {
    if (QA_MODE) return;
    const gpsStatus = document.getElementById("gps-status");
    if (!gpsStatus) return;

    let msg = "GPS Error: ";
    switch(err.code) {
        case 1: msg = "Location Access Denied."; break;
        case 2: msg = "Position Unavailable."; break;
        case 3: msg = "GPS Timeout."; break;
        default: msg = "Unknown GPS Error.";
    }
    gpsStatus.innerText = msg;
    gpsStatus.style.color = "red";
}

function initGPS() {
    const gpsStatus = document.getElementById("gps-status");
    const qaCheckBtn = document.getElementById("qaCheckBtn");

    if (QA_MODE) {
        if (gpsStatus) {
            gpsStatus.innerText = "QA Mode Active: Click 'QA Check' below";
            gpsStatus.style.color = "#8a2be2";
        }
        if (qaCheckBtn) {
            qaCheckBtn.style.display = "block";
            qaCheckBtn.addEventListener("click", () => {
                qaCheckBtn.style.display = "none";
                handleLocationSuccess();
            });
        }
        return;
    }

    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        if (gpsStatus) {
            gpsStatus.innerText = "HTTPS required for GPS.";
            gpsStatus.style.color = "red";
        }
        return;
    }
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updatePosition, handleLocationError, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    } else {
        if (gpsStatus) {
            gpsStatus.innerText = "Geolocation not supported.";
            gpsStatus.style.color = "red";
        }
    }
}

// --- Safe Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    
    // Wire up Modals and Buttons safely
    const congratsModal = document.getElementById("congratsModal");
    const hintModal = document.getElementById("hintModal");
    const locationModal = document.getElementById("locationModal");

    const closeCongratsBtn = document.getElementById("closeCongrats");
    const closeHintBtn = document.getElementById("closeHint");
    const closeLocationBtn = document.getElementById("closeLocation");

    const viewCongratsBtn = document.getElementById("viewCongratsBtn");
    const viewLocationBtn = document.getElementById("viewLocationBtn");

    if (closeCongratsBtn) closeCongratsBtn.onclick = () => congratsModal.style.display = "none";
    if (closeHintBtn) closeHintBtn.onclick = () => hintModal.style.display = "none";
    if (closeLocationBtn) closeLocationBtn.onclick = () => locationModal.style.display = "none";

    if (viewCongratsBtn) viewCongratsBtn.onclick = () => congratsModal.style.display = "block";
    if (viewLocationBtn) viewLocationBtn.onclick = () => locationModal.style.display = "block";

    window.onclick = (e) => {
        if (congratsModal && e.target == congratsModal) congratsModal.style.display = "none";
        if (hintModal && e.target == hintModal) hintModal.style.display = "none";
        if (locationModal && e.target == locationModal) locationModal.style.display = "none";
    };

    // Decode and Inject Text
    const congratsMsg = "DVwDC35XQhVHWhFAWVAZXFNNRxVUQlRbTRMKGlsHDwhBC3VdWV4TXF8URV1cElRUQF5UQBFMVkcWU1pbVRRQQRlGXlxAFV1bUlRNW1lbE1xfFGZQSkYWf1xHVVVfGwUdRgs=";
    const hintMsg = "DVwDC3FbWEEPGlkGDwlJDGJdWltaFFJHVkFFQlxHVRRSWUxXRRsTf0RHRRVNQE8VQFpcURFZXEZCUEFGEV1XFUBdQxJBUBFGVFRVXk8VQEFEV1oVWFxSFV9aXl8RQVYSQl1WFVJbXVpLQRZBXBVZUV1FGUtZQBNaREAfCRZCCA==";
    const locationMsg = "DVwDC2BdQxV1WkRaVRVNWlMVYEVeQBAJFloECw9cXFMRRktRCxJaWFBTVEYWYV1cflofXkFSHhJXWUcIFnheVlhGX1pdFWNRUFZRV1ISE1ZdVUJGBBVaWlBURV1eWxRbW1IUCw1EDwlYEl5HVlMME35HXFtYQQEbWUBcWR4MdVlaVloUWVBLVwoaUgsRQF4VXldCFUBBUEZFUF0SWVsTQVlREWZSWxZ4XFxfQFBcV1dTR1pbVhRUQ1xcQhsPGkEK";
    
    const cContent = document.getElementById("congratsContent");
    const hContent = document.getElementById("hintContent");
    const lContent = document.getElementById("locationContent");
    
    if (cContent) cContent.innerHTML = xorDecrypt(congratsMsg);
    if (hContent) hContent.innerHTML = xorDecrypt(hintMsg);
    if (lContent) lContent.innerHTML = xorDecrypt(locationMsg);

    // Boot Up Services
    startHintTimer();
    initGPS();

    // Setup Inputs
    const answers = ["Ww==", "VA==", "XQ==", "XQ==", "SA==", "SA==", "VA==", "UA==", "Qw==", "Qg==", "Ug==", "WQ==", "WA==", "QQ==", "Qg=="];
    const inputs = document.querySelectorAll('input[type="text"]');
    
    inputs.forEach((input, index) => {
        input.dataset.answer = answers[index];
        
        input.addEventListener("input", (e) => {
            const val = input.value;
            const maxLen = parseInt(input.getAttribute("maxlength"));
            if (val.length >= maxLen) {
                const nextInput = inputs[index + 1];
                if (nextInput) setTimeout(() => nextInput.focus(), 10);
            }
            validateInputs();
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && input.value === "") {
                const prevInput = inputs[index - 1];
                if (prevInput) setTimeout(() => prevInput.focus(), 10);
            }
        });
    });
});