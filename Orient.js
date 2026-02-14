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

        // --- MOBILE-OPTIMIZED AUTO-TABBING ---
const globalInputs = document.querySelectorAll('input[type="text"]');
globalInputs.forEach((input, index) => {
    // Listen for 'input' to catch text changes
    input.addEventListener('input', (e) => {
        const value = input.value;
        const max = parseInt(input.getAttribute('maxlength'));

        if (value.length >= max) {
            const nextInput = globalInputs[index + 1];
            if (nextInput) {
                // Short delay helps iOS handle the focus shift while the keyboard is active
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

document.addEventListener('DOMContentLoaded', function() {
    const inputs = Array.from(document.querySelectorAll('#targetTable input'));
    inputs.forEach((input, idx) => {
      input.addEventListener('input', function() {
        if (input.value.length >= input.maxLength) {
          if (inputs[idx + 1]) {
            inputs[idx + 1].focus();
          }
        }
      });
    });
  });
  
  const aMix = "PGgyPkNyYWNrIHRoZSByaWRkbGUgdG8gZ2V0IHRvIHRoZSBuZXh0IGV2ZW50ITwvaDI+PHA+PGEgaHJlZj0idGVsOjgwMTc4NDgxODQiPjgwMTc4NDgxODQ8L2E+PC9wPg==";
  const bMix = "PGgyPkhpbnQ8L2gyPjxwPlN0cnVnZ2xpbmcgdG8gZmluZCB0aGUgc3RhcnRpbmcgcG9pbnQ/IEhlYWQgYWNyb3NzIHRoZSBzdHJlZXQgZnJvbSB0aGUgcHJhY3RpY2UgYmFza2V0IGFuZCByZWFkIHRoZSBtYXAgZm9yIHRoZSBkaXNjZ29sZiBjb3Vyc2UuPC9wPjxwPjAmZGVnOyBpcyBub3J0aCwgOTAmZGVnOyBpcyBlYXN0LiBPcGVuIHVwIHlvdXIgQ29tcGFzcyBhcHAgaWYgeW91IGhhdmVuJ3QgYWxyZWFkeS48L3A+PHA+WW91ciBmaXJzdCB0YXJnZXQgaXMgbW9zdGx5IGVhc3QgYW5kIDIzOSBmZWV0LiBTZWUgdGhhdCBkaXNjIGdvbGYgYmFza2V0IHRoYXQgaXMgbW9zdGx5IGVhc3QgYW5kIGFib3V0IDIzOSBmZWV0IGF3YXkuLi48L3A+";
  
  document.getElementById('aContent').innerHTML = atob(aMix);
  document.getElementById('bContent').innerHTML = atob(bMix);
  
  const answerBase64 = ["ODA=", "MTc=", "ODQ=", "ODE=", "ODQ="];
  const answers = answerBase64.map(b64 => atob(b64));
  const inputs = document.querySelectorAll('#targetTable input');
  
  inputs.forEach((input, idx) => {
    input.dataset.answer = answers[idx];
    input.addEventListener('input', function() {
      if (input.value === "") {
        input.style.backgroundColor = "";
      } else if (userValue === correctValue) {
          cell.style.backgroundColor = "#009f3c"; 
      } else {
          cell.style.backgroundColor = "#df0024"; 
          allCorrect = false;
      }
    });
  });