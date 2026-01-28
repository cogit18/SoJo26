function setViewportScale(scale) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', `width=device-width, initial-scale=${scale}, maximum-scale=${scale}`);
    }
}

let timeRemaining = 180; // 3:00 minutes
let hintInterval = null;
let puzzleSolved = false;

// Modal Logic References
const congratsModal = document.getElementById("congratsModal");
const hintModal = document.getElementById("hintModal");
const closeCongratsBtn = document.getElementById("closeCongrats");
const closeHintBtn = document.getElementById("closeHint");
const viewCongratsBtn = document.getElementById("viewCongratsBtn");
const modalLink = document.getElementById("modalLink");

// Function to show the hint
function showHint() {
    setViewportScale(1); // Reset zoom
    hintModal.style.display = "block";
}

// Function to change the timer to the hint button
function transformTimerToButton() {
    const display = document.getElementById('hint-timer');
    display.innerHTML = `<button id="hint-button" style="cursor:pointer; padding: 2px 5px;">View Hint</button>`;
    document.getElementById('hint-button').addEventListener('click', showHint);
}

function startPersistentTimer() {
    if (hintInterval) return; 
    const display = document.getElementById('hint-timer');
    
    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            
            // Only show the alert automatically if it timed out naturally (not forced by solving)
            if (!puzzleSolved) {
                showHint();
            }

            // Transform the timer span into a clickable button
            transformTimerToButton();
            return;
        }
        
        timeRemaining--;
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

startPersistentTimer();

// Close modals when X is clicked
closeCongratsBtn.onclick = function() {
    congratsModal.style.display = "none";
}
closeHintBtn.onclick = function() {
    hintModal.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == congratsModal) {
        congratsModal.style.display = "none";
    }
    if (event.target == hintModal) {
        hintModal.style.display = "none";
    }
}

// Open modal when button is clicked
viewCongratsBtn.onclick = function() {
    congratsModal.style.display = "block";
}

document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('targetTable');
    const baseURL = "HTTPS://";

    table.addEventListener('input', function() {
        let combinedString = "";
        let allCorrect = true;
        const allInputs = table.querySelectorAll('input');
        
        allInputs.forEach(input => {
            input.setAttribute('maxlength', '1');
            const correctValue = input.getAttribute('data-answer');
            const userValue = input.value;
            const cell = input.parentElement;

            if (userValue === "") {
                cell.style.backgroundColor = "";
                allCorrect = false;
            } else if (userValue.toUpperCase() === correctValue) {
                cell.style.backgroundColor = "#009f3c"; 
                combinedString += userValue.toUpperCase(); 
            } else {
                cell.style.backgroundColor = "#df0024"; 
                allCorrect = false;
            }
        });

        if (allCorrect && !puzzleSolved) {
            puzzleSolved = true;
            const finalURL = baseURL + combinedString;
            
            // 1. Handle Timer Logic on Success
            if (hintInterval) {
                clearInterval(hintInterval);
                timeRemaining = 0; // Zero out timer
                transformTimerToButton(); // Turn into View Hint button without showing alert
            }

            // 2. Setup and Show Congrats
            setViewportScale(1);
            modalLink.href = finalURL;
            modalLink.textContent = finalURL;
            congratsModal.style.display = "block";
            
            // 3. Show the "View Congrats" button
            viewCongratsBtn.style.display = "inline-block";
        }
    });
});