document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------
    // FIREBASE NETWORK ABSTRACTION
    // ---------------------------------------------------------
    
    const firebaseConfig = {
        apiKey: "AIzaSyAgl_PrRKY15d4P9I75zDjB_joD-9tyyKE",
        authDomain: "sojo26-trivia.firebaseapp.com",
        databaseURL: "https://sojo26-trivia-default-rtdb.firebaseio.com",
        projectId: "sojo26-trivia",
        storageBucket: "sojo26-trivia.firebasestorage.app",
        messagingSenderId: "161556746131",
        appId: "1:161556746131:web:90c6251faf83a92240a266",
        measurementId: "G-HN68FB51R1"
    };
    
    // Initialize Firebase 
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();
    
    // Create a persistent ID for this browser session so refreshes don't break the game
    let myId = sessionStorage.getItem('trivia_myId');
    if (!myId) {
        myId = Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('trivia_myId', myId);
    }

    const connectTime = Date.now();

    function broadcastEvent(type, payload) {
        db.ref('trivia_events').push({
            type: type,
            payload: payload || {}, 
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // Listen for Game Flow Events
    db.ref('trivia_events')
      .orderByChild('timestamp')
      .startAt(connectTime)
      .on('child_added', (snapshot) => {
          const event = snapshot.val();
          const type = event.type;
          const payload = event.payload;

          if (type === 'GAME_START') handleNetworkGameStart(payload);
          if (type === 'START_QUESTION') handleNetworkStartQuestion(payload);
          if (type === 'PLAYER_SUBMIT') handleNetworkPlayerSubmit(payload);
          if (type === 'ROUND_RESULTS') handleNetworkRoundResults(payload);
          if (type === 'SHOW_LEADERBOARD') handleNetworkShowLeaderboard();
      });

    // ---------------------------------------------------------
    // GAME DATA & STATE
    // ---------------------------------------------------------
    let questionsData = [
        { q: "How many total career medals does Marit Bjørgen hold (the all-time Winter Olympic record)?", a: 15, anecdote: "8 of them gold, 4 silver, 3 bronze. All in cross country skiing events." },
        { q: "How many years has snowboarding been an official Olympic event?", a: 28, anecdote: "1998 in Nagano, Japan. Shaun White is still the GOAT with 3 gold medals to his name." },
        { q: "What is the total number of gold medal events scheduled for the Milano Cortina 2026 Games?", a: 116, anecdote: "Ice hockey, figure skating, and snowboarding were the most watched events." },
        { q: "As of the 2026 Games how many total sports are included in the Winter Olympic program?", a: 16, anecdote: "Skiing (alpine, cross country, freestyle, nordic, jumping, mountaineering); Biathlon; Bobsled; Curling; Hockey; Luge; Skating (figure, speed, short-track); Snowboarding." },
        { q: "How many years has it been since the first Winter Olympic Games were held?", a: 102, anecdote: "Chamonix, France in 1924. The same year that the summer games were held in Paris, France." },
        { q: "After a 54 year hiatus, in what year did the Skeleton event return to the Winter Olympics?", a: 2002, anecdote: "It was discontinued due to safety and lack of availability of the specialized tracks, but it came back in Salt Lake in 2002 and has been a staple ever since." },
        { q: "How many times has the United States hosted the winter Olympics?", a: 4, anecdote: "Lake Placid, NY (2x); Squaw Valley, CA; SLC, UT" },
        { q: "In what year did Ski Mountaineering make its official debut as an Olympic sport?", a: 2026, anecdote: "Because cross country skiing wasn't brutal enough, and jumping down the slope was too easy; we now have to climb up and speed down hills." },
        { q: "In meters, how far away are the shooting targets in the Biathalon?", a: 50, anecdote: "There are cave paintings of people hunting on skis in Norway." },
        { q: "How many miles was the torch carried for the 2026 Olympics?", a: 7500, anecdote: "After leaving Athens and arriving in Rome, the torch traveled through every Italian province on its way to Milan." },
        { q: "Norway won the most medals of any country in the 2026 winter Olympics. How many total medals did they win?", a: 41, anecdote: "Guess who in 2022? Norway, 37." },
        { q: "How many torchbearers were there for the 2026 Olympics?", a: 10001, anecdote: "1 more than Paris, France in 2024." },
        { q: "In what year did the \"Miracle on Ice\" take place at the Lake Placid Games?", a: 1980, anecdote: "Spoiler alert. The young US team beat the heavily favored Soviet Union team 4-3." },
        { q: "How many athletes (to the nearest hundred) competed in the 2026 Winter Games?", a: 2900, anecdote: "The first games had 258 and it has been a steady climb since. This year is the most ever." },
        { q: "How many years old was American figure skater Scott Allen when he became the youngest individual male medalist in Winter history?", a: 14, anecdote: "He took bronze 2 days before his birthday in 1964. The current age requirements for figure skating have gone from 15 to 16 to 17 in the last three years." },
        { q: "How many seats were in the stadium of the opening ceremonies for the 2026 winter Olympics?", a: 70000, anecdote: "The closing ceremonies were in a roman amphitheater and seated a much more intimate 15,000." },
        { q: "In what year did the Winter and Summer Olympics stop being held in the same calendar year?", a: 1994, anecdote: "Norway started the staggered year, and won the total medal count: 26." },
        { q: "What was the total number of nations that competed in the first Winter Olympics in Chamonix, France in 1924?", a: 16, anecdote: "There were 40 nations at the Summer Games that same year in Paris." }
    ];

    const teamCodes = {
        "United States": "us", "Canada": "ca", "Japan": "jp", "Italy": "it",
        "France": "fr", "Germany": "de", "United Kingdom": "gb", "Australia": "au",
        "Brazil": "br", "South Korea": "kr", "Mexico": "mx", "Spain": "es",
        "Netherlands": "nl", "Sweden": "se", "Norway": "no", "Argentina": "ar",
        "Chile": "cl", "New Zealand": "nz"
    };

    const allTeamsList = Object.keys(teamCodes);

    let isLiveMode = false;
    let isHost = false;
    let wasHost = false;
    let userTeam = "";
    let hasEscaped = false;

    let activeTeams = [...allTeamsList];
    let escapedTeams = [];
    let humanPlayers = []; 
    let takenTeams = []; 
    
    // Centralized Question State
    let currentActiveQuestion = null; 
    let currentRoundResults = []; 
    let localAskedQuestions = []; // Fallback for Solo Mode

    let preTimerEndTime = 0;
    let activeTimerEndTime = 0;
    let gameLoopInterval, hostLockInterval;
    let roundProcessed = false;

    const screens = {
        mode: document.getElementById("modeScreen"),
        setup: document.getElementById("setupScreen"),
        game: document.getElementById("gameScreen"),
        results: document.getElementById("roundResultsScreen"),
        leaderboard: document.getElementById("leaderboardScreen")
    };

    const btnPlayLive = document.getElementById("btnPlayLive");
    const btnPlaySolo = document.getElementById("btnPlaySolo");
    const teamSelectionGrid = document.getElementById("teamSelectionGrid");
    const waitingForGameBtn = document.getElementById("waitingForGameBtn");
    const hostStartGameBtn = document.getElementById("hostStartGameBtn");
    const selectionSubtitle = document.getElementById("selectionSubtitle");
    
    const congratsModal = document.getElementById("congratsModal");
    const closeCongrats = document.getElementById("closeCongrats");
    const viewCongratsBtn = document.getElementById("viewCongratsBtn");

    const getFlagPath = (teamName) => {
        const code = teamCodes[teamName];
        return code ? `https://flagcdn.com/w80/${code}.png` : "";
    };

    function hideAllScreens() {
        Object.values(screens).forEach(s => { if (s) s.style.display = "none"; });
    }

    function setGameInputState(isEnabled) {
        const aInput = document.getElementById("userAnswer");
        if (aInput) aInput.disabled = !isEnabled;
        document.querySelectorAll('.keypad-btn').forEach(btn => {
            btn.disabled = !isEnabled;
        });
    }

    // ---------------------------------------------------------
    // KEYPAD, KEYBOARD & MODAL LISTENERS
    // ---------------------------------------------------------
    
    // On-Screen Keypad (Mobile)
    document.querySelectorAll('.num-key').forEach(btn => {
        btn.addEventListener('click', () => {
            const answerInput = document.getElementById('userAnswer');
            if (answerInput && !answerInput.disabled) answerInput.value += btn.dataset.val;
        });
    });

    if (document.getElementById('keypadDelete')) {
        document.getElementById('keypadDelete').addEventListener('click', () => {
            const answerInput = document.getElementById('userAnswer');
            if (answerInput && !answerInput.disabled && answerInput.value.length > 0) {
                answerInput.value = answerInput.value.slice(0, -1);
            }
        });
    }

    // Physical Keyboard (Desktop)
    document.addEventListener('keydown', (e) => {
        const answerInput = document.getElementById('userAnswer');
        const submitBtn = document.getElementById('submitAnswerBtn');

        // Only process keystrokes if the input is unlocked and the game screen is currently visible
        if (!answerInput || answerInput.disabled || screens.game.style.display !== "block") {
            return;
        }

        // Numbers 0-9
        if (e.key >= '0' && e.key <= '9') {
            answerInput.value += e.key;
        } 
        // Backspace
        else if (e.key === 'Backspace') {
            if (answerInput.value.length > 0) {
                answerInput.value = answerInput.value.slice(0, -1);
            }
        } 
        // Enter / Return to Submit
        else if (e.key === 'Enter') {
            if (submitBtn && !submitBtn.disabled && answerInput.value !== "") {
                const parsed = parseFloat(answerInput.value);
                if (!isNaN(parsed)) {
                    submitMyAnswer(parsed);
                    setGameInputState(false);
                }
            }
        }
    });

    if (closeCongrats) closeCongrats.addEventListener("click", () => { if (congratsModal) congratsModal.style.display = "none"; });
    if (viewCongratsBtn) viewCongratsBtn.addEventListener("click", () => { if (congratsModal) congratsModal.style.display = "block"; });
    window.addEventListener("click", (e) => { if (congratsModal && e.target === congratsModal) congratsModal.style.display = "none"; });

    // ---------------------------------------------------------
    // MULTIPLAYER PRESENCE & HOST MIGRATION
    // ---------------------------------------------------------
    db.ref('players').on('value', (snapshot) => {
        if (!isLiveMode) return;
        
        takenTeams = [];
        humanPlayers = [];
        
        const playersData = snapshot.val();
        if (playersData) {
            const sortedPlayers = Object.keys(playersData).map(key => ({
                id: key,
                ...playersData[key]
            })).sort((a, b) => a.joinedAt - b.joinedAt);
            
            sortedPlayers.forEach((p, index) => {
                if (p.team) {
                    humanPlayers.push({ id: p.id, team: p.team });
                    takenTeams.push(p.team);
                }
                // First player in the active list acts as Host automatically
                if (p.id === myId) isHost = (index === 0);
            });
        } else {
            isHost = false;
        }

        // Dynamically update UI if Host suddenly migrates to us during a pause
        if (!wasHost && isHost && !hasEscaped) {
            if (screens.leaderboard && screens.leaderboard.style.display === "block") {
                document.getElementById("lbHostControls").style.display = "block";
                document.getElementById("lbClientWaitMsg").style.display = "none";
            }
        }
        wasHost = isHost;

        if (screens.setup && screens.setup.style.display === "block") {
            renderTeamSelection();
            if (userTeam) showWaitingRoom(); 
        }
    });

    // ---------------------------------------------------------
    // INIT & TEAM SELECTION
    // ---------------------------------------------------------
    if (btnPlayLive) {
        btnPlayLive.addEventListener("click", () => {
            isLiveMode = true;
            hideAllScreens();
            if (screens.setup) screens.setup.style.display = "block";
            
            db.ref('players/' + myId).set({
                team: "",
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
            db.ref('players/' + myId).onDisconnect().remove();

            renderTeamSelection();
        });
    }

    if (btnPlaySolo) {
        btnPlaySolo.addEventListener("click", () => {
            isLiveMode = false;
            isHost = true;
            hideAllScreens();
            if (screens.setup) screens.setup.style.display = "block";
            renderTeamSelection();
        });
    }

    function renderTeamSelection() {
        if (!teamSelectionGrid) return;
        teamSelectionGrid.innerHTML = "";
        
        allTeamsList.forEach(team => {
            const btn = document.createElement("button");
            btn.className = "team-select-btn";
            btn.dataset.team = team;
            
            if (team === userTeam) {
                btn.style.border = "3px solid #009f3c";
                btn.style.backgroundColor = "#e6ffe6";
                btn.style.transform = "scale(1.05)";
            }

            btn.innerHTML = `
                <img src="${getFlagPath(team)}" alt="${team}" class="select-flag" onerror="this.style.display='none'">
                <span class="select-name">${team}</span>
            `;

            if (takenTeams.includes(team) && team !== userTeam) {
                btn.disabled = true;
            } else {
                btn.addEventListener("click", () => {
                    userTeam = team;
                    if (isLiveMode) {
                        db.ref('players/' + myId).update({ team: userTeam });
                    } else {
                        humanPlayers = [{ id: myId, team: userTeam }];
                        localAskedQuestions = [];
                        hostTriggerNextQuestion(); 
                    }
                });
            }
            teamSelectionGrid.appendChild(btn);
        });
    }

    function showWaitingRoom() {
        if (selectionSubtitle) selectionSubtitle.textContent = `You are ${userTeam}. Change your selection or wait for Host to begin.`;
        if (isHost && hostStartGameBtn) {
            hostStartGameBtn.style.display = "inline-block";
            if (waitingForGameBtn) waitingForGameBtn.style.display = "none";
        } else if (waitingForGameBtn) {
            waitingForGameBtn.style.display = "block";
            if (hostStartGameBtn) hostStartGameBtn.style.display = "none";
        }
    }

    if (hostStartGameBtn) {
        hostStartGameBtn.addEventListener("click", () => {
            // Master Game Reset - Erase question memory for the new game
            if (isLiveMode) db.ref('asked_questions').remove();
            else localAskedQuestions = [];
            
            broadcastEvent('GAME_START', null);
            hostTriggerNextQuestion();
        });
    }

    // ---------------------------------------------------------
    // DATABASE-DRIVEN QUESTION SELECTION
    // ---------------------------------------------------------
    function hostTriggerNextQuestion() {
        if (isLiveMode) {
            db.ref('asked_questions').once('value', (snapshot) => {
                let asked = [];
                if (snapshot.exists()) asked = Object.values(snapshot.val());
                pickAndStartQuestion(asked, true);
            });
        } else {
            pickAndStartQuestion(localAskedQuestions, false);
        }
    }

    function pickAndStartQuestion(askedList, isLive) {
        let remainingQuestions = questionsData.filter(qd => !askedList.includes(qd.q));

        if (remainingQuestions.length === 0) {
            if (isLive) db.ref('asked_questions').remove();
            else localAskedQuestions = [];
            remainingQuestions = [...questionsData];
        }

        const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
        const curQ = remainingQuestions[randomIndex];

        if (isLive) db.ref('asked_questions').push(curQ.q);
        else localAskedQuestions.push(curQ.q);

        const payload = {
            q: curQ.q,
            a: curQ.a,
            anecdote: curQ.anecdote
        };
        
        if (isLive) broadcastEvent('START_QUESTION', payload);
        else handleNetworkStartQuestion(payload);
    }

    // ---------------------------------------------------------
    // GAME PLAY LOOP 
    // ---------------------------------------------------------
    function handleNetworkGameStart() {
        if (screens.setup && screens.setup.style.display === "block" && userTeam) {
            if (waitingForGameBtn) waitingForGameBtn.textContent = "Starting...";
        }
    }

    function handleNetworkStartQuestion(payload) {
        if (hasEscaped) return;

        currentActiveQuestion = { q: payload.q, a: payload.a, anecdote: payload.anecdote };
        
        const now = Date.now();
        preTimerEndTime = now + 5000;
        activeTimerEndTime = now + 15000;
        
        roundProcessed = false;
        currentRoundResults = [];
        
        hideAllScreens();
        if (screens.game) screens.game.style.display = "block";
        
        const preTimerContainer = document.getElementById("preTimerContainer");
        const activeTimerContainer = document.getElementById("activeTimerContainer");
        const answerInput = document.getElementById("userAnswer");
        
        if (preTimerContainer) preTimerContainer.style.display = "block";
        if (activeTimerContainer) activeTimerContainer.style.display = "none";
        if (answerInput) answerInput.value = "";
        
        setGameInputState(false);

        const qt = document.getElementById("questionText");
        if (qt) qt.textContent = currentActiveQuestion.q;

        clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(() => {
            const currentTime = Date.now();

            if (currentTime < preTimerEndTime) {
                const left = Math.ceil((preTimerEndTime - currentTime) / 1000);
                const preDisp = document.getElementById("preTimerDisplay");
                if (preDisp) preDisp.textContent = left;
            } else if (currentTime < activeTimerEndTime) {
                if (preTimerContainer && preTimerContainer.style.display !== "none") {
                    preTimerContainer.style.display = "none";
                    if (activeTimerContainer) activeTimerContainer.style.display = "block";
                    setGameInputState(true);
                }
                const left = Math.max(0, (activeTimerEndTime - currentTime) / 1000);
                const tDisp = document.getElementById("timerDisplay");
                if (tDisp) tDisp.textContent = left.toFixed(1);
            } else {
                clearInterval(gameLoopInterval);
                const tDisp = document.getElementById("timerDisplay");
                if (tDisp) tDisp.textContent = "0.0";
                
                setGameInputState(false);

                if (!currentRoundResults.find(r => r.team === userTeam)) {
                    submitMyAnswer("NONE");
                }

                if (isHost && !roundProcessed) {
                    roundProcessed = true;
                    // Wait 1000ms to allow all lagging human submissions to arrive over network
                    setTimeout(() => {
                        generateHostResults();
                    }, 1000);
                }
            }
        }, 100); 
    }

    const submitBtn = document.getElementById("submitAnswerBtn");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const answerInput = document.getElementById("userAnswer");
            if (!answerInput || answerInput.value === "") return;
            
            const parsed = parseFloat(answerInput.value);
            if (isNaN(parsed)) return;
            
            submitMyAnswer(parsed);
            setGameInputState(false);
        });
    }

    function submitMyAnswer(guess) {
        const timeTaken = (guess === "NONE") ? 10.0 : Math.min(10.0, (Date.now() - preTimerEndTime) / 1000);
        const result = { team: userTeam, guess: guess, time: timeTaken };
        
        currentRoundResults.push(result);
        if (isLiveMode && !isHost) broadcastEvent('PLAYER_SUBMIT', result);
    }

    // ---------------------------------------------------------
    // HOST SCORING & TIEBREAKERS
    // ---------------------------------------------------------
    function handleNetworkPlayerSubmit(payload) {
        if (isHost) {
            const existingIndex = currentRoundResults.findIndex(r => r.team === payload.team);
            if (existingIndex >= 0) {
                currentRoundResults[existingIndex] = payload;
            } else {
                currentRoundResults.push(payload);
            }
        }
    }

    function generateHostResults() {
        let actualAnswer = parseFloat(currentActiveQuestion.a);
        if (isNaN(actualAnswer)) actualAnswer = 0;

        activeTeams.forEach(team => {
            const isHuman = humanPlayers.find(p => p.team === team);
            if (!isHuman) {
                const errorPercentage = Math.random() > 0.9 ? (Math.random() * 0.15) : (Math.random() * 0.8 - 0.4); 
                const deviation = actualAnswer === 0 ? (Math.random() * 20 - 10) : (actualAnswer * errorPercentage);
                let botGuess = Math.round(actualAnswer + deviation);
                if (isNaN(botGuess)) botGuess = 0; 
                
                currentRoundResults.push({ 
                    team: team, 
                    guess: botGuess, 
                    time: 4.0 + (Math.random() * 5.9) 
                });
            }
        });

        // Ensure ALL active teams have a result
        activeTeams.forEach(team => {
            if (!currentRoundResults.find(r => r.team === team)) {
                currentRoundResults.push({ team: team, guess: "NONE", time: 10.0 });
            }
        });

        currentRoundResults.forEach(r => {
            if (r.guess === "NONE" || r.guess === null || r.guess === "") {
                r.diff = 999999999;
            } else {
                let parsedGuess = parseFloat(r.guess);
                if (isNaN(parsedGuess)) {
                    r.diff = 999999999;
                } else {
                    r.diff = Math.abs(parsedGuess - actualAnswer);
                }
            }
        });

        // Exact Match Sorting: Closest Diff first. If tied, fastest Time wins. 
        currentRoundResults.sort((a, b) => {
            let diffA = a.diff;
            let diffB = b.diff;
            
            if (diffA === diffB) {
                if (diffA === 999999999) return a.team.localeCompare(b.team);
                if (a.time === b.time) return a.team.localeCompare(b.team);
                return a.time - b.time;
            }
            return diffA - diffB;
        });

        let winner = currentRoundResults[0];
        
        if (winner && (winner.guess === "NONE" || winner.guess == null || winner.diff === 999999999)) {
            winner = "NONE"; 
        }

        if (winner && winner !== "NONE") {
            activeTeams = activeTeams.filter(t => t !== winner.team);
            escapedTeams.push(winner.team);
        }

        const payload = { 
            results: currentRoundResults, 
            winner: winner || null,
            activeTeams: activeTeams,
            escapedTeams: escapedTeams
        };

        if (isLiveMode) broadcastEvent('ROUND_RESULTS', payload);
        processFinalResults(payload);
    }

    function handleNetworkRoundResults(payload) {
        if (!isHost) processFinalResults(payload);
    }

    function processFinalResults(payload) {
        currentRoundResults = payload.results || [];
        activeTeams = payload.activeTeams || [];
        escapedTeams = payload.escapedTeams || [];
        
        showRoundResultsScreen(currentActiveQuestion.a, currentActiveQuestion.anecdote, payload.winner);
    }

    // ---------------------------------------------------------
    // DYNAMIC RESULTS & LEADERBOARD UI
    // ---------------------------------------------------------
    function showRoundResultsScreen(correctAnswer, anecdote, winner) {
        if (hasEscaped) return; 

        hideAllScreens();
        if (screens.results) screens.results.style.display = "block";

        const correctAnsDisp = document.getElementById("correctAnswerDisplay");
        if (correctAnsDisp) correctAnsDisp.innerHTML = `Correct Answer: <strong>${correctAnswer}</strong>`;
        
        const anecdoteDisp = document.getElementById("anecdoteText");
        if (anecdoteDisp) anecdoteDisp.textContent = anecdote || "";

        const flag = document.getElementById("resultWinnerFlag");
        const winText = document.getElementById("roundWinnerDisplay");
        
        const winPhrases = ["got it!", "is out of here!", "nailed it!", "secured the clue!"];
        const randomWinPhrase = winPhrases[Math.floor(Math.random() * winPhrases.length)];
        
        if (!winner || winner === "NONE" || winner.guess === "NONE" || winner.guess == null || winner.diff === 999999999) {
            if (flag) flag.style.display = "none";
            if (winText) winText.textContent = "No one answered this round!";
        } else {
            if (flag) {
                flag.src = getFlagPath(winner.team);
                flag.style.display = "inline";
            }
            if (winText) {
                winText.textContent = `${winner.team} ${randomWinPhrase}`;
            }
        }

        const clueBtn = document.getElementById("viewCongratsBtn");
        const autoAdvMsg = document.getElementById("autoAdvanceMsg");
        const autoAdvTimer = document.getElementById("autoAdvanceTimer");

        const isWinner = (winner && winner !== "NONE" && winner.team === userTeam);

        if (isWinner) {
            hasEscaped = true;
            if (isLiveMode) db.ref('players/' + myId).remove();
            
            if (autoAdvMsg) autoAdvMsg.style.display = "none";
            if (clueBtn) clueBtn.style.display = "inline-block";
            
            setTimeout(() => { 
                if (congratsModal) congratsModal.style.display = "block"; 
            }, 1500);
        } else {
            if (clueBtn) clueBtn.style.display = "none";
            
            // Everyone sees the 10s auto-advance countdown to Leaderboard
            if (autoAdvMsg) {
                autoAdvMsg.style.display = "block";
                let lock = 10;
                if (autoAdvTimer) autoAdvTimer.textContent = lock;
                
                clearInterval(hostLockInterval);
                hostLockInterval = setInterval(() => {
                    lock--;
                    if (autoAdvTimer) autoAdvTimer.textContent = lock;
                    if (lock <= 0) {
                        clearInterval(hostLockInterval);
                        renderLeaderboard(); 
                    }
                }, 1000);
            }
        }
    }

    function renderLeaderboard() {
        if (hasEscaped) return; 
        hideAllScreens();
        if (screens.leaderboard) screens.leaderboard.style.display = "block";

        const tbody = document.getElementById("leaderboardBody");
        if (tbody) {
            tbody.innerHTML = "";
            currentRoundResults.forEach(r => {
                const tr = document.createElement("tr");
                if (r.team === userTeam) tr.classList.add("highlight-user");

                const isEscaped = escapedTeams.includes(r.team);
                const statusClass = isEscaped ? "status-escaped" : "status-racing";
                const statusText = isEscaped ? "Got it!" : "Racing";
                
                const isNoAnswer = (r.guess === "NONE" || r.guess == null || r.guess === "");
                const guessText = isNoAnswer ? "-" : r.guess;
                const timeText = (isNoAnswer || isNaN(r.time)) ? "-" : `${parseFloat(r.time).toFixed(1)}s`;

                tr.innerHTML = `
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <img src="${getFlagPath(r.team)}" alt="" class="leaderboard-flag" onerror="this.style.display='none'">
                        ${r.team}
                    </td>
                    <td>${guessText}</td>
                    <td>${timeText}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Trigger next question countdown
        const lbAutoMsg = document.getElementById("lbAutoAdvanceMsg");
        const lbAutoTimer = document.getElementById("lbAutoAdvanceTimer");
        
        if (lbAutoMsg) {
            lbAutoMsg.style.display = "block";
            let lock = 10;
            if (lbAutoTimer) lbAutoTimer.textContent = lock;
            
            clearInterval(hostLockInterval); 
            hostLockInterval = setInterval(() => {
                lock--;
                if (lbAutoTimer) lbAutoTimer.textContent = lock;
                if (lock <= 0) {
                    clearInterval(hostLockInterval);
                    // ONLY the host triggers the database call to start the next network event
                    if (isHost) {
                        hostTriggerNextQuestion();
                    }
                }
            }, 1000);
        }
    }
});