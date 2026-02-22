function setViewportScale(scale) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', `width=device-width, initial-scale=${scale}, maximum-scale=${scale}`);
    }
}

// Base64 injected modal content
const congratsMsg = "PGgyPkNvbmdyYXR1bGF0aW9ucyE8L2gyPjxwPllvdSBoYXZlIGZvdW5kIHRoZSBuZXh0IGNsdWUhIDxhIGlkPSJtb2RhbExpbmsiIGhyZWY9IiMiIHRhcmdldD0iX2JsYW5rIj48L2E+PC9wPg==";
const hintMsg = "PGgyPkhpbnQ8L2gyPjxwPlNlZSBob3cgZWFjaCBsZXR0ZXIgaW4gdGhlIHRhYmxlcyBoYXMgYSBudW1iZXI/IFN0YXJ0IGJ5IGZpbGxpbmcgb3V0IHRoZSBibGFuayBudW1iZXJzLCB0aGVuIHdvcmsgb24gdGhlIG1pc3NpbmcgbGV0dGVycyBpbiB0aGUgbGFzdCB0YWJsZS48L3A+";

document.getElementById('congratsContent').innerHTML = atob(congratsMsg);
document.getElementById('hintContent').innerHTML = atob(hintMsg);

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
            
            // Only show the alert automatically if it timed out naturally
            if (!puzzleSolved) {
                showHint();
            }

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

    // Base64 Obfuscated Answers
    const answerBase64 = [
        'VA==', 'SQ==', 'Tg==', 'WQ==', 'Lg==', 'Qw==', 'Qw==', 'Lw==', 'Qw==', 'SA==', 'QQ==', 'TQ==', 'UA==', 'Uw=='
    ];

    const globalInputs = document.querySelectorAll('input[type="text"]');
    
    // Target only the puzzle table's inputs for assignment
    const puzzleInputs = table.querySelectorAll('input');
    puzzleInputs.forEach((input, index) => {
        input.dataset.answer = answerBase64[index];
    });

    // --- MOBILE-OPTIMIZED AUTO-TABBING ---
    globalInputs.forEach((input, index) => {
        // Listen for 'input' to catch text changes
        input.addEventListener('input', (e) => {
            const value = input.value;
            const max = parseInt(input.getAttribute('maxlength'));

            if (value.length >= max) {
                const nextInput = globalInputs[index + 1];
                if (nextInput) {
                    setTimeout(() => nextInput.focus(), 10);
                }
            }
        });

        // Backspace logic for mobile
        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && input.value === "") {
                const prevInput = globalInputs[index - 1];
                if (prevInput) {
                    setTimeout(() => prevInput.focus(), 10);
                }
            }
        });
    });

    table.addEventListener('input', function() {
        let combinedString = "";
        let allCorrect = true;
        const allInputs = table.querySelectorAll('input');
        
        allInputs.forEach(input => {
            input.setAttribute('maxlength', '1');
            const correctValue = atob(input.dataset.answer).toUpperCase();
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
                timeRemaining = 0; 
                transformTimerToButton(); 
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