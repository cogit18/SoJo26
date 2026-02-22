function setViewportScale(scale) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', `width=device-width, initial-scale=${scale}, maximum-scale=${scale}`);
    }
}

let timeRemaining = 180; 
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

document.addEventListener('DOMContentLoaded', () => {
    startPersistentTimer();

    const table = document.getElementById('targetTable');
    const globalInputs = Array.from(table.querySelectorAll('input'));

    // Replace your commented-out loop in Snow.js with this:
globalInputs.forEach((input, index) => {
    // 1. Move Forward logic: Fires only when a character is actually typed
    input.addEventListener('input', () => {
        if (input.value.length >= 1) {
            const nextInput = globalInputs[index + 1];
            if (nextInput) {
                nextInput.focus();
            }
        }
    });

    // 2. Navigation logic: Handles Backspace and Arrow keys
    input.addEventListener('keydown', (e) => {
        if (e.key === "Backspace") {
            // If current cell is empty, jump focus to the previous one
            if (input.value === "") {
                const prevInput = globalInputs[index - 1];
                if (prevInput) {
                    prevInput.focus();
                }
            }
            // If cell is NOT empty, default browser behavior deletes the char
            // but we stay in this cell (fixing your "jump forward" bug).
        } else if (e.key === "ArrowLeft") {
            const prevInput = globalInputs[index - 1];
            if (prevInput) prevInput.focus();
        } else if (e.key === "ArrowRight") {
            const nextInput = globalInputs[index + 1];
            if (nextInput) nextInput.focus();
        } else if (e.key === "Enter") {
            const nextInput = globalInputs[index + 1];
            if (nextInput) nextInput.focus();
        }
    });
});
    
    table.addEventListener('input', function() {
        let allCorrect = true;
        const allInputs = table.querySelectorAll('input');
        
        allInputs.forEach(input => {
            // Decodes the obfuscated answer for comparison
            const correctValue = atob(input.getAttribute('data-answer')).toLowerCase();
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
            if (hintInterval) {
                clearInterval(hintInterval);
                timeRemaining = 0; 
                transformTimerToButton(); 
            }
            congratsModal.style.display = "block";
            viewCongratsBtn.style.display = "inline-block";
        }
    });

    closeCongratsBtn.onclick = () => { congratsModal.style.display = "none"; }
    closeHintBtn.onclick = () => { hintModal.style.display = "none"; }
    window.onclick = (event) => {
        if (event.target == congratsModal) congratsModal.style.display = "none";
        if (event.target == hintModal) hintModal.style.display = "none";
    }
    viewCongratsBtn.onclick = () => { congratsModal.style.display = "block"; }
});

const congratsMsg = "PGgyPkV2ZW50IENvbXBsZXRlITwvaDI+PHA+RGVjaXBoZXIgdGhlIG1lc3NhZ2UgYW5kIGZpZ3VyZSBvdXQgd2hlcmUgdG8gZ28uIERyb3Agb25lIGJyYXZlIHRlYW0gbWVtYmVyIGF0IHRoZSB0b3Agb2YgdGhlIGhpbGwgd2l0aCB0aGUgYmVhY2ggdG93ZWw7IGV2ZXJ5b25lIGVsc2Ugc2hvdWxkIHBhcmsgYXQgdGhlIGJvdHRvbSBvZiB0aGUgaGlsbC48L3A+";
const hintMsg = "PGgyPkhpbnQ8L2gyPjxwPlNlZSB0aGUgc3BhY2UgaW4gdGhlIGNpcGhlciB0ZXh0PyBUaGUgdGV4dCBiZWZvcmUgdGhlIHNwYWNlIGFsbCBnb2VzIGluIHRoZSBmaXJzdCBjb2x1bW47IGFmdGVyIHRoZSBzcGFjZSBpbiB0aGUgc2Vjb25kIGNvbHVtbi4gUmVhZCB0aGUgbWVzc2FnZSBpbiBhIHppZ3phZyBwYXR0ZXJuLjwvcD4=";

document.getElementById('congratsContent').innerHTML = atob(congratsMsg);
document.getElementById('hintContent').innerHTML = atob(hintMsg);