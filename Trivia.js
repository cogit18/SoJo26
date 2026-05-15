document.addEventListener("DOMContentLoaded", () => {
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

    function broadcastEvent(type, payload) {
        db.ref('trivia_events').push({
            type: type,
            payload: payload || {}, 
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    db.ref('trivia_events').orderByChild('timestamp').startAt(connectTime).on('child_added', (snapshot) => {
        const event = snapshot.val();
        if (event.type === 'GAME_START') handleNetworkGameStart();
        if (event.type === 'START_QUESTION') handleNetworkStartQuestion(event.payload);
        if (event.type === 'PLAYER_SUBMIT') handleNetworkPlayerSubmit(event.payload);
        if (event.type === 'ROUND_RESULTS') handleNetworkRoundResults(event.payload);
    });

    let questionsData = [
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

    const teamCodes = { "United States": "us", "Canada": "ca", "Japan": "jp", "Italy": "it", "France": "fr", "Germany": "de", "United Kingdom": "gb", "Australia": "au", "Norway": "no", "Sweden": "se" };
    const allTeamsList = Object.keys(teamCodes);

    let isLiveMode = false, isHost = false, userTeam = "";
    let teamScores = {}; // Persistent score tracking
    let currentActiveQuestion = null, currentRoundResults = [], localAskedCount = 0;
    let gameLoopInterval, hostLockInterval, roundProcessed = false;

    const screens = { mode: document.getElementById("modeScreen"), setup: document.getElementById("setupScreen"), game: document.getElementById("gameScreen"), results: document.getElementById("roundResultsScreen"), leaderboard: document.getElementById("leaderboardScreen") };

    function hideAllScreens() { Object.values(screens).forEach(s => s.style.display = "none"); }

    function setGameInputState(isEnabled) {
        document.getElementById("userAnswer").disabled = !isEnabled;
        document.querySelectorAll('.keypad-btn').forEach(btn => btn.disabled = !isEnabled);
    }

    // Keypad functionality
    document.querySelectorAll('.num-key').forEach(btn => {
        btn.addEventListener('click', () => { document.getElementById('userAnswer').value += btn.dataset.val; });
    });
    document.getElementById('keypadDelete').addEventListener('click', () => {
        const inp = document.getElementById('userAnswer');
        inp.value = inp.value.slice(0, -1);
    });

    // Multiplayer Presence
    db.ref('players').on('value', (snapshot) => {
        if (!isLiveMode) return;
        const players = snapshot.val();
        if (players) {
            const sorted = Object.keys(players).map(k => ({id: k, ...players[k]})).sort((a,b) => a.joinedAt - b.joinedAt);
            isHost = (sorted.id === myId);
        }
        if (screens.setup.style.display === "block") renderTeamSelection(players ? Object.values(players).map(p => p.team) : []);
    });

    document.getElementById("btnPlayLive").addEventListener("click", () => {
        isLiveMode = true; hideAllScreens(); screens.setup.style.display = "block";
        db.ref('players/' + myId).set({ team: "", joinedAt: firebase.database.ServerValue.TIMESTAMP });
        db.ref('players/' + myId).onDisconnect().remove();
    });

    document.getElementById("btnPlaySolo").addEventListener("click", () => {
        isLiveMode = false; isHost = true; hideAllScreens(); screens.setup.style.display = "block";
        renderTeamSelection([]);
    });

    function renderTeamSelection(taken) {
        const grid = document.getElementById("teamSelectionGrid");
        grid.innerHTML = "";
        allTeamsList.forEach(team => {
            const btn = document.createElement("button");
            btn.className = "team-select-btn";
            btn.innerHTML = `<img src="https://flagcdn.com/w80/${teamCodes[team]}.png" class="leaderboard-flag"> ${team}`;
            if (taken.includes(team) && team !== userTeam) btn.disabled = true;
            btn.onclick = () => {
                userTeam = team;
                if (isLiveMode) db.ref('players/' + myId).update({ team });
                document.getElementById("hostStartGameBtn").style.display = isHost ? "block" : "none";
                document.getElementById("waitingForGameBtn").style.display = isHost ? "none" : "block";
            };
            grid.appendChild(btn);
        });
    }

    document.getElementById("hostStartGameBtn").addEventListener("click", () => {
        if (isLiveMode) db.ref('asked_questions').remove();
        broadcastEvent('GAME_START');
        hostTriggerNextQuestion();
    });

    function hostTriggerNextQuestion() {
        db.ref('asked_questions').once('value', (snap) => {
            const asked = snap.val() ? Object.values(snap.val()) : [];
            const remaining = questionsData.filter(q => !asked.includes(q.q));
            if (remaining.length === 0) return; // End of game

            const curQ = remaining[Math.floor(Math.random() * remaining.length)];
            if (isLiveMode) db.ref('asked_questions').push(curQ.q);
            broadcastEvent('START_QUESTION', curQ);
        });
    }

    function handleNetworkGameStart() { hideAllScreens(); }

    function handleNetworkStartQuestion(payload) {
        currentActiveQuestion = payload;
        localAskedCount++;
        roundProcessed = false;
        currentRoundResults = [];
        hideAllScreens();
        screens.game.style.display = "block";
        document.getElementById("questionText").textContent = payload.q;
        document.getElementById("userAnswer").value = "";
        
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
                setGameInputState(true);
                document.getElementById("timerDisplay").textContent = ((activeEnd - now)/1000).toFixed(1);
            } else {
                clearInterval(gameLoopInterval);
                setGameInputState(false);
                if (!currentRoundResults.find(r => r.team === userTeam)) submitMyAnswer("NONE");
                if (isHost && !roundProcessed) { roundProcessed = true; setTimeout(generateHostResults, 1000); }
            }
        }, 100);
    }

    document.getElementById("submitAnswerBtn").onclick = () => {
        const val = parseFloat(document.getElementById("userAnswer").value);
        if (!isNaN(val)) { submitMyAnswer(val); setGameInputState(false); }
    };

    function submitMyAnswer(guess) {
        const result = { team: userTeam, guess, time: 5.0 }; 
        if (isLiveMode && !isHost) broadcastEvent('PLAYER_SUBMIT', result);
        else currentRoundResults.push(result);
    }

    function handleNetworkPlayerSubmit(payload) {
        if (isHost) currentRoundResults.push(payload);
    }

    function generateHostResults() {
        const actual = currentActiveQuestion.a;
        // Fill in bots
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

        // Assign Points: 10, 5, 2, 1
        currentRoundResults.forEach((r, idx) => {
            let p = 1;
            if (idx === 0) p = 10;
            else if (idx === 1) p = 5;
            else if (idx === 2) p = 2;
            r.pointsEarned = p;
        });

        broadcastEvent('ROUND_RESULTS', { results: currentRoundResults, q: currentActiveQuestion });
    }

    function handleNetworkRoundResults(payload) {
        currentRoundResults = payload.results;
        // Update cumulative scores
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
        
        let sec = 10;
        const timer = document.getElementById("autoAdvanceTimer");
        document.getElementById("autoAdvanceMsg").style.display = "block";
        
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
            if (team === userTeam) tr.className = "highlight-user";
            tr.innerHTML = `
                <td><span class="pts-badge">${teamScores[team]} PTS</span></td>
                <td><img src="https://flagcdn.com/w80/${teamCodes[team]}.png" class="leaderboard-flag"> ${team}</td>
                <td>${currentRoundResults.find(r => r.team === team)?.guess || '-'}</td>
            `;
            body.appendChild(tr);
        });

        if (localAskedCount < questionsData.length) {
            document.getElementById("lbAutoAdvanceMsg").style.display = "block";
            let sec = 10;
            hostLockInterval = setInterval(() => {
                document.getElementById("lbAutoAdvanceTimer").textContent = --sec;
                if (sec <= 0) { clearInterval(hostLockInterval); if (isHost) hostTriggerNextQuestion(); }
            }, 1000);
        } else {
            document.getElementById("lbAutoAdvanceMsg").innerHTML = "<h2 style='color:#009f3c'>Final Standings! Thanks for playing.</h2>";
        }
    }
});