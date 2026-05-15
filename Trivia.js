document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------
    // 1. FIREBASE CONFIGURATION
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
    
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    
    let myId = sessionStorage.getItem('trivia_myId') || Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('trivia_myId', myId);

    const connectTime = Date.now();
    const teamCodes = {
        "United States": "us", "Canada": "ca", "Japan": "jp", "Italy": "it", 
        "France": "fr", "Germany": "de", "United Kingdom": "gb", "Australia": "au", 
        "Norway": "no", "Sweden": "se", "Austria": "at", "Switzerland": "ch", 
        "South Korea": "kr", "China": "cn", "Netherlands": "nl", "Finland": "fi"
    };
    const allTeamsList = Object.keys(teamCodes);

    let isLiveMode = false, isActingHost = false, userTeam = "";
    let latestPlayerList = []; 
    let teamScores = {}; 
    let currentActiveQuestion = null, currentRoundResults = [], localAskedCount = 0;
    let gameLoopInterval, hostLockInterval;

    const screens = { 
        mode: document.getElementById("modeScreen"), 
        setup: document.getElementById("setupScreen"), 
        game: document.getElementById("gameScreen"), 
        results: document.getElementById("roundResultsScreen"), 
        leaderboard: document.getElementById("leaderboardScreen") 
    };

    function hideAllScreens() { Object.values(screens).forEach(s => s.style.display = "none"); }

    function broadcastEvent(type, payload) {
        db.ref('trivia_events').push({
            type, payload: payload || {}, timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // ---------------------------------------------------------
    // 2. NETWORK EVENT LISTENER
    // ---------------------------------------------------------
    db.ref('trivia_events').orderByChild('timestamp').startAt(connectTime).on('child_added', (snapshot) => {
        const event = snapshot.val();
        if (event.type === 'GAME_START') hideAllScreens();
        if (event.type === 'START_QUESTION') handleNetworkStartQuestion(event.payload);
        if (event.type === 'PLAYER_SUBMIT') { if (isActingHost) currentRoundResults.push(event.payload); }
        if (event.type === 'ROUND_RESULTS') handleNetworkRoundResults(event.payload);
    });

    // ---------------------------------------------------------
    // 3. LOBBY & PLAYER PRESENCE
    // ---------------------------------------------------------
    db.ref('players').on('value', (snapshot) => {
        if (!isLiveMode) return;
        const players = snapshot.val() || {};
        latestPlayerList = Object.keys(players).map(id => ({ id, ...players[id] }));
        
        // Sort by joinedAt. The person who joined first is the "Acting Host" 
        // who handles bot logic, but ANYONE can click the start button.
        latestPlayerList.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
        isActingHost = (latestPlayerList.length > 0 && latestPlayerList.id === myId);

        if (screens.setup.style.display === "block") {
            renderTeamSelection(latestPlayerList);
            updateLobbyStatus(latestPlayerList);
            
            // SHOW START BUTTON TO ANYONE WHO HAS SELECTED A TEAM
            if (userTeam) {
                document.getElementById("hostStartGameBtn").style.display = "block";
                document.getElementById("hostStartGameBtn").textContent = "Start Tournament";
                document.getElementById("waitingForGameBtn").style.display = "none";
            }
        }
    });

    function updateLobbyStatus(playerArray) {
        const subtitle = document.getElementById("selectionSubtitle");
        if (!subtitle) return;

        const total = playerArray.length;
        const pending = playerArray.filter(p => !p.team).length;
        const ready = total - pending;

        if (!userTeam) {
            subtitle.innerHTML = "<b>Select Your Nation:</b>";
        } else {
            subtitle.innerHTML = `
                <div style="color: #00529b; margin-bottom: 5px;"><b>Waiting for tournament to begin...</b></div>
                <div style="font-size: 0.85em; color: #666;">
                    ${total} in lobby (${ready} ready, ${pending} still picking)
                </div>
            `;
        }
    }

    document.getElementById("btnPlayLive").onclick = () => {
        isLiveMode = true; hideAllScreens(); screens.setup.style.display = "block";
        db.ref('players/' + myId).set({ team: "", joinedAt: firebase.database.ServerValue.TIMESTAMP });
        db.ref('players/' + myId).onDisconnect().remove();
    };

    document.getElementById("btnPlaySolo").onclick = () => {
        isLiveMode = false; isActingHost = true; hideAllScreens(); screens.setup.style.display = "block";
        renderTeamSelection([]);
    };

    function renderTeamSelection(playerArray) {
        const grid = document.getElementById("teamSelectionGrid");
        grid.innerHTML = "";
        const takenTeams = playerArray.map(p => p.team).filter(t => t !== "");

        allTeamsList.forEach(team => {
            const btn = document.createElement("button");
            btn.className = "team-select-btn";
            if (team === userTeam) btn.classList.add("selected-team");
            
            const isTaken = takenTeams.includes(team) && team !== userTeam;
            if (isTaken) btn.disabled = true;

            btn.innerHTML = `
                <img src="https://flagcdn.com/w80/${teamCodes[team]}.png" class="leaderboard-flag">
                <span style="font-size:0.9em">${team}</span>
                ${team === userTeam ? '<br><b style="font-size:0.7em; color:#009f3c">YOU</b>' : ''}
            `;

            btn.onclick = () => {
                userTeam = team;
                if (isLiveMode) db.ref('players/' + myId).update({ team });
                renderTeamSelection(playerArray);
            };
            grid.appendChild(btn);
        });
    }

    // ---------------------------------------------------------
    // 4. START GAME LOGIC (ANY PLAYER)
    // ---------------------------------------------------------
    document.getElementById("hostStartGameBtn").onclick = () => {
        if (isLiveMode) {
            const pending = latestPlayerList.filter(p => !p.team).length;
            if (pending > 0) {
                const proceed = confirm(`Warning: ${pending} player(s) haven't selected a country yet. Start anyway?`);
                if (!proceed) return;
            }
            // Clear previous session data
            db.ref('asked_questions').remove();
        }
        
        broadcastEvent('GAME_START');
        // We only trigger the first question logic if we are the acting host 
        // to avoid duplicate questions being pushed.
        if (isActingHost || !isLiveMode) {
            hostTriggerNextQuestion();
        }
    };

    function hostTriggerNextQuestion() {
        db.ref('asked_questions').once('value', (snap) => {
            const asked = snap.val() ? Object.values(snap.val()) : [];
            const remaining = questionsData.filter(q => !asked.includes(q.q));
            if (remaining.length === 0) return;

            const curQ = remaining[Math.floor(Math.random() * remaining.length)];
            if (isLiveMode) db.ref('asked_questions').push(curQ.q);
            broadcastEvent('START_QUESTION', curQ);
        });
    }

    // ---------------------------------------------------------
    // 5. GAMEPLAY & TIMERS
    // ---------------------------------------------------------
    function handleNetworkStartQuestion(payload) {
        currentActiveQuestion = payload;
        localAskedCount++;
        currentRoundResults = [];
        hideAllScreens();
        screens.game.style.display = "block";
        document.getElementById("questionText").textContent = payload.q;
        document.getElementById("userAnswer").value = "";
        document.getElementById("submitAnswerBtn").disabled = false;
        
        let start = Date.now(), preEnd = start + 5000, activeEnd = start + 15000;
        clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(() => {
            let now = Date.now();
            if (now < preEnd) {
                document.getElementById("preTimerContainer").style.display = "block";
                document.getElementById("activeTimerContainer").style.display = "none";
                document.getElementById("preTimerDisplay").textContent = Math.ceil((preEnd - now)/1000);
            } else if (now < activeEnd) {
                document.getElementById("preTimerContainer").style.display = "none";
                document.getElementById("activeTimerContainer").style.display = "block";
                document.getElementById("timerDisplay").textContent = ((activeEnd - now)/1000).toFixed(1);
            } else {
                clearInterval(gameLoopInterval);
                if (!currentRoundResults.find(r => r.team === userTeam)) submitMyAnswer("NONE");
                if (isActingHost) setTimeout(generateHostResults, 1200);
            }
        }, 100);
    }

    document.getElementById("submitAnswerBtn").onclick = () => {
        const val = parseFloat(document.getElementById("userAnswer").value);
        if (!isNaN(val)) { 
            submitMyAnswer(val); 
            document.getElementById("submitAnswerBtn").disabled = true;
        }
    };

    function submitMyAnswer(guess) {
        const result = { team: userTeam, guess, time: 5.0 };
        if (isLiveMode && !isActingHost) broadcastEvent('PLAYER_SUBMIT', result);
        else currentRoundResults.push(result);
    }

    function generateHostResults() {
        const actual = currentActiveQuestion.a;
        // Fill in bot scores for any country not picked by a human
        allTeamsList.forEach(t => {
            if (!currentRoundResults.find(r => r.team === t)) {
                const botGuess = Math.round(actual + (actual * (Math.random() * 0.4 - 0.2)));
                currentRoundResults.push({ team: t, guess: botGuess, time: 5 + Math.random() });
            }
        });

        currentRoundResults.forEach(r => {
            r.diff = (r.guess === "NONE") ? 9999 : Math.abs(r.guess - actual);
        });

        currentRoundResults.sort((a, b) => a.diff - b.diff || a.time - b.time);
        currentRoundResults.forEach((r, idx) => {
            r.pointsEarned = (idx === 0) ? 10 : (idx === 1) ? 5 : (idx === 2) ? 2 : 1;
        });

        broadcastEvent('ROUND_RESULTS', { results: currentRoundResults, q: currentActiveQuestion });
    }

    function handleNetworkRoundResults(payload) {
        currentRoundResults = payload.results;
        currentRoundResults.forEach(r => {
            teamScores[r.team] = (teamScores[r.team] || 0) + r.pointsEarned;
        });
        showResults(payload.q);
    }

    function showResults(q) {
        hideAllScreens();
        screens.results.style.display = "block";
        document.getElementById("correctAnswerDisplay").textContent = `Correct Answer: ${q.a}`;
        document.getElementById("anecdoteText").textContent = q.anecdote;
        
        let sec = 8;
        const timer = document.getElementById("autoAdvanceTimer");
        timer.textContent = sec;
        clearInterval(hostLockInterval);
        hostLockInterval = setInterval(() => {
            timer.textContent = --sec;
            if (sec <= 0) { clearInterval(hostLockInterval); renderLeaderboard(); }
        }, 1000);
    }

    function renderLeaderboard() {
        hideAllScreens();
        screens.leaderboard.style.display = "block";
        const body = document.getElementById("leaderboardBody");
        body.innerHTML = "";

        const sorted = Object.keys(teamScores).sort((a,b) => teamScores[b] - teamScores[a]);
        sorted.forEach(team => {
            const tr = document.createElement("tr");
            if (team === userTeam) tr.style.backgroundColor = "#fffbe6";
            tr.innerHTML = `
                <td><span class="pts-badge">${teamScores[team]} PTS</span></td>
                <td><img src="https://flagcdn.com/w80/${teamCodes[team]}.png" class="leaderboard-flag"> ${team}</td>
                <td>${currentRoundResults.find(r => r.team === team)?.guess || '-'}</td>
            `;
            body.appendChild(tr);
        });

        if (localAskedCount < questionsData.length) {
            let sec = 8;
            const timer = document.getElementById("lbAutoAdvanceTimer");
            timer.textContent = sec;
            hostLockInterval = setInterval(() => {
                timer.textContent = --sec;
                if (sec <= 0) { 
                    clearInterval(hostLockInterval); 
                    if (isActingHost) hostTriggerNextQuestion(); 
                }
            }, 1000);
        } else {
            document.getElementById("lbAutoAdvanceMsg").innerHTML = "<h2>Final Standings!</h2>";
        }
    }

    // ---------------------------------------------------------
    // 6. NUMERIC KEYPAD LOGIC
    // ---------------------------------------------------------
    document.querySelectorAll('.num-key').forEach(btn => {
        btn.onclick = () => { document.getElementById('userAnswer').value += btn.dataset.val; };
    });
    document.getElementById('keypadDelete').onclick = () => {
        const inp = document.getElementById('userAnswer');
        inp.value = inp.value.slice(0, -1);
    };

    const questionsData = [
        { q: "How many total career medals does Marit Bjørgen hold (the all-time Winter Olympic record)?", a: 15, anecdote: "8 of them gold, 4 silver, 3 bronze. All in cross country skiing events." },
        { q: "How many years has snowboarding been an official Olympic event?", a: 28, anecdote: "1998 in Nagano, Japan. Shaun White is still the GOAT with 3 gold medals to his name." },
        { q: "What is the total number of gold medal events scheduled for the Milano Cortina 2026 Games?", a: 116, anecdote: "Ice hockey, figure skating, and snowboarding were the most watched events." },
        { q: "As of the 2026 Games how many total sports are included in the Winter Olympic program?", a: 16, anecdote: "Skiing (alpine, cross country, freestyle, nordic, jumping, mountaineering); Biathlon; Bobsled; Curling; Hockey; Luge; Skating (figure, speed, short-track); Snowboarding." },
        { q: "How many years has it been since the first Winter Olympic Games were held?", a: 102, anecdote: "Chamonix, France in 1924. The same year that the summer games were held in Paris, France." },
        { q: "After a 54 year hiatus, in what year did the Skeleton event return to the Winter Olympics?", a: 2002, anecdote: "It came back in Salt Lake in 2002 and has been a staple ever since." },
        { q: "How many times has the United States hosted the winter Olympics?", a: 4, anecdote: "Lake Placid, NY (2x); Squaw Valley, CA; SLC, UT" },
        { q: "In what year did Ski Mountaineering make its official debut as an Olympic sport?", a: 2026, anecdote: "SkiMo is the newest addition to the games." },
        { q: "In meters, how far away are the shooting targets in the Biathalon?", a: 50, anecdote: "There are cave paintings of people hunting on skis in Norway." },
        { q: "How many miles was the torch carried for the 2026 Olympics?", a: 7500, anecdote: "The torch traveled through every Italian province on its way to Milan." },
        { q: "Norway won the most medals of any country in the 2026 winter Olympics. How many total medals did they win?", a: 41, anecdote: "Norway continues to dominate winter sports." },
        { q: "How many torchbearers were there for the 2026 Olympics?", a: 10001, anecdote: "1 more than Paris, France in 2024." },
        { q: "In what year did the \"Miracle on Ice\" take place at the Lake Placid Games?", a: 1980, anecdote: "The young US team beat the heavily favored Soviet Union team 4-3." },
        { q: "How many athletes (to the nearest hundred) competed in the 2026 Winter Games?", a: 2900, anecdote: "The first games had 258; this year is the most ever." },
        { q: "How many years old was American figure skater Scott Allen when he became the youngest individual male medalist in Winter history?", a: 14, anecdote: "He took bronze 2 days before his birthday in 1964." },
        { q: "How many seats were in the stadium of the opening ceremonies for the 2026 winter Olympics?", a: 70000, anecdote: "The closing ceremonies were in a roman amphitheater seating 15,000." },
        { q: "In what year did the Winter and Summer Olympics stop being held in the same calendar year?", a: 1994, anecdote: "Norway started the staggered year." },
        { q: "What was the total number of nations that competed in the first Winter Olympics in Chamonix, France in 1924?", a: 16, anecdote: "There were 40 nations at the Summer Games that same year." }
    ];
});