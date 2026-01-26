let timeRemaining = 180; // 3:00 minutes
let hintInterval = null;

function showHint() {
    alert("Hint: You solve a Zigzag cipher by filling in the columns one at a time, then reading the message in a zigzag pattern.");
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