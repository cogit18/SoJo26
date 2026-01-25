let timeRemaining = 180; // 3:00 minutes
let hintInterval = null;

// Function to show the hint
function showHint() {
    alert("Hint: See how each letter in the tables has a number? Start by filling out the blank numbers, then work on the missing letters in the last table.");
}

function startPersistentTimer() {
    if (hintInterval) return; 
    const display = document.getElementById('hint-timer');
    
    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            
            // 1. Show the initial alert
            showHint();

            // 2. Transform the timer span into a clickable button
            display.innerHTML = `<button id="hint-button" style="cursor:pointer; padding: 2px 5px;">View Hint</button>`;
            
            // 3. Add event listener to the new button
            document.getElementById('hint-button').addEventListener('click', showHint);
            return;
        }
        
        timeRemaining--;
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

startPersistentTimer();

document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('targetTable');
    const linkElement = document.getElementById('dynamicLink');
    const baseURL = "HTTPS://";

    table.addEventListener('input', function() {
        let combinedString = "";
        const allInputs = table.querySelectorAll('input');
        
        allInputs.forEach(input => {
            const correctValue = input.getAttribute('data-answer');
            const userValue = input.value;
            const cell = input.parentElement;

            if (userValue === "") {
                cell.style.backgroundColor = "";
            } else if (userValue === correctValue) {
                cell.style.backgroundColor = "#009f3c"; // Added # for valid hex
                combinedString += userValue; 
            } else {
                cell.style.backgroundColor = "#df0024"; // Added # for valid hex
            }
        });

        const finalURL = baseURL + combinedString;
        linkElement.href = finalURL;
        linkElement.textContent = finalURL;
    });
});