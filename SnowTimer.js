let timeRemaining = 180; // 3:00 minutes
let hintInterval = null;

function startPersistentTimer() {
    if (hintInterval) return; 
    const display = document.getElementById('hint-timer');
    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            alert("Hint: You solve a Zigzag cipher by filling in the columns one at a time, then reading the message in a zigzag pattern.");
            return;
        }
        timeRemaining--;
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}
startPersistentTimer();