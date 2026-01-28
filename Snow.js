let timeRemaining = 180; // 3:00 minutes
let hintInterval = null;
let puzzleSolved = false;

// Modal Logic References
const congratsModal = document.getElementById("congratsModal");
const hintModal = document.getElementById("hintModal");
const closeCongratsBtn = document.getElementById("closeCongrats");
const closeHintBtn = document.getElementById("closeHint");
const viewCongratsBtn = document.getElementById("viewCongratsBtn");

function showHint() {
    hintModal.style.display = "block";
}

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

// Modal closing logic
closeCongratsBtn.onclick = () => { congratsModal.style.display = "none"; }
closeHintBtn.onclick = () => { hintModal.style.display = "none"; }
window.onclick = (event) => {
    if (event.target == congratsModal) congratsModal.style.display = "none";
    if (event.target == hintModal) hintModal.style.display = "none";
}
viewCongratsBtn.onclick = () => { congratsModal.style.display = "block"; }

document.addEventListener('DOMContentLoaded', () => {
    startPersistentTimer();
    const table = document.getElementById('targetTable');
    
    table.addEventListener('input', function() {
        let allCorrect = true;
        const allInputs = table.querySelectorAll('input');
        
        allInputs.forEach(input => {
            const correctValue = input.getAttribute('data-answer').toLowerCase();
            const userValue = input.value.toLowerCase();
            const cell = input.parentElement;

            if (userValue === "") {
                cell.style.backgroundColor = "";
                allCorrect = false;
            } else if (userValue === correctValue) {
                cell.style.backgroundColor = "#009f3c"; 
            } else {
                cell.style.backgroundColor = "#df0024"; 
                allCorrect = false;
            }
        });

        if (allCorrect && !puzzleSolved) {
            puzzleSolved = true;
            
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
    });
});