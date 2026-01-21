let timeRemaining = 180; // 3:00 minutes
let hintInterval = null;

function startPersistentTimer() {
    if (hintInterval) return; 
    const display = document.getElementById('hint-timer');
    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            alert("Hint: See how each letter in the tables has a number? Start by filling out the blank numbers, then work on the missing letters in the last table.");
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
    const baseURL = "https://";

    table.addEventListener('input', function() {
        let combinedString = "";
        const allInputs = table.querySelectorAll('input');
        
        allInputs.forEach(input => {
            const correctValue = input.getAttribute('data-answer');
            const userValue = input.value;
            const cell = input.parentElement;

            // 1. Color Logic (Strict Case Sensitivity)
            if (userValue === "") {
                cell.style.backgroundColor = "";
            } else if (userValue === correctValue) {
                cell.style.backgroundColor = "009f3c";
                
                // 2. ONLY add to the string if it is correct
                combinedString += userValue; 
            } else {
                cell.style.backgroundColor = "df0024";
                // If incorrect, we don't add it to the string
            }
        });

        // 3. Update the Link based on correctly matched characters
        const finalURL = baseURL + combinedString;
        linkElement.href = finalURL;
        linkElement.textContent = finalURL;
    });
});