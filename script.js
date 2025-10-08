// --- script.js: The Finalized Game Logic (with Archivist) ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01');
const PUZZLE_FILE = './sequence_puzzles_600.json';
let allPuzzlesData = []; // Store the full list of puzzles
let currentPuzzle = null;
let guesses = [];
const MAX_GUESSES = 3;

// DOM Elements
const optionsPool = document.getElementById('options-pool');
const sequenceDisplay = document.getElementById('sequence-display');
const guessTarget = document.getElementById('guess-target');
const messageElement = document.getElementById('message');
const chanceIndicators = document.getElementById('chance-indicators');

// Icon DOM Elements
const rulesIcon = document.getElementById('rules-icon');
const archiveIcon = document.getElementById('archive-icon');

// Modal Elements
const tutorialModal = document.getElementById('tutorial-modal');
const tutorialNextButton = document.getElementById('tutorial-next-button');
const archiveModal = document.getElementById('archive-modal');
const archiveCloseButton = document.getElementById('archive-close-button');
const puzzleHistoryList = document.getElementById('puzzle-history-list');


// --- 2. Tutorial Logic (Simplified) ---

function showTutorial() {
    tutorialModal.style.display = 'flex';
}

function closeTutorial() {
    tutorialModal.style.display = 'none';
    localStorage.setItem('hasSeenTutorial', 'true');
}

function handleTutorialNext() {
    closeTutorial();
}


// --- 3. Archivist Logic ---

function showArchive() {
    archiveModal.style.display = 'flex';
    renderArchiveList();
}

function closeArchive() {
    archiveModal.style.display = 'none';
}

function getDayIndex(date) {
    const timeDiff = date.getTime() - LAUNCH_DATE.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

function renderArchiveList() {
    puzzleHistoryList.innerHTML = '';
    const today = new Date();
    const daysSinceLaunch = getDayIndex(today);
    
    if (allPuzzlesData.length === 0) {
        puzzleHistoryList.innerHTML = `<p style="color: #e74c3c;">Error: Cannot load puzzle archive data.</p>`;
        return;
    }

    // Only render for puzzles that exist in the data set
    for (let i = daysSinceLaunch; i >= 0 && i < allPuzzlesData.length; i--) {
        const puzzleIndex = i;
        const button = document.createElement('button');
        button.classList.add('archive-puzzle-button');
        
        // Calculate the date for display (start from today and go backwards)
        const puzzleDate = new Date(LAUNCH_DATE);
        puzzleDate.setDate(LAUNCH_DATE.getDate() + i);
        const dateString = `${puzzleDate.getMonth() + 1}/${puzzleDate.getDate()}/${puzzleDate.getFullYear() % 100}`;

        if (i === daysSinceLaunch) {
            button.textContent = `Today (#${puzzleIndex + 1})`;
        } else {
            button.textContent = `${dateString} (#${puzzleIndex + 1})`;
        }
        
        button.dataset.index = puzzleIndex;
        button.addEventListener('click', () => loadPuzzleByIndex(puzzleIndex));
        
        puzzleHistoryList.appendChild(button);
    }
}

function loadPuzzleByIndex(index) {
    if (index >= 0 && index < allPuzzlesData.length) {
        currentPuzzle = allPuzzlesData[index];
        guesses = []; // Reset game state
        
        renderPuzzle(currentPuzzle);
        renderChances();
        
        messageElement.textContent = `Now playing Puzzle #${index + 1}.`;
        archiveModal.style.display = 'none'; // Close the archive modal
        
        // Ensure options are clickable again
        document.querySelectorAll('.option-tile').forEach(t => t.addEventListener('click', handleSubmit));
        guessTarget.textContent = '?';
        guessTarget.classList.remove('feedback-green', 'feedback-grey');
        document.getElementById('action-area').style.display = 'flex';

    } else {
        alert("Invalid puzzle index.");
    }
}


// --- 4. Data Fetching and Puzzle Selection ---

async function loadDailyPuzzle() {
    // Check if the user has seen the tutorial. If not, show it.
    if (!localStorage.getItem('hasSeenTutorial')) {
        showTutorial();
    }
    
    try {
        // *** RE-ENABLED FETCH CALL ***
        const response = await fetch(PUZZLE_FILE);
        const allPuzzles = await response.json(); 
        allPuzzlesData = allPuzzles; // Save all data globally
        // ******************************

        if (!Array.isArray(allPuzzlesData) || allPuzzlesData.length === 0) {
             messageElement.textContent = "Error: Puzzle data is missing or corrupted. Check console for details.";
             return;
        }

        const today = new Date();
        const dayIndex = getDayIndex(today);
        
        // Load today's puzzle
        const puzzleIndex = dayIndex % allPuzzlesData.length;
        currentPuzzle = allPuzzlesData[puzzleIndex];

        renderPuzzle(currentPuzzle);
        renderChances(); 

    } catch (error) {
        messageElement.textContent = "Fatal Error fetching data. Is sequence_puzzles_600.json uploaded and correctly formatted?";
        console.error("Fetch Error:", error);
    }
}

// --- 5. Rendering and UI Handlers (Unchanged) ---

function renderPuzzle(puzzle) {
    const sequenceTiles = sequenceDisplay.querySelectorAll('.tile:not(#guess-target)');
    sequenceTiles.forEach((tile, index) => {
        tile.textContent = puzzle.sequence_display[index];
    });

    optionsPool.innerHTML = ''; 
    currentPuzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value; 
        tile.addEventListener('click', handleSubmit); 
        optionsPool.appendChild(tile);
    });
    
    messageElement.textContent = ``;
}

function renderChances() {
    chanceIndicators.innerHTML = '';
    const remaining = MAX_GUESSES - guesses.length;

    for (let i = 0; i < MAX_GUESSES; i++) {
        const span = document.createElement('span');
        span.classList.add('lightbulb');
        span.innerHTML = '<i class="fas fa-lightbulb"></i>'; 
        
        if (i < remaining) {
            span.classList.add('lightbulb-on');
        } else {
            span.classList.add('lightbulb-off');
        }
        chanceIndicators.appendChild(span);
    }
}


function handleSubmit(event) {
    if (guesses.length >= MAX_GUESSES) return;

    const selectedTile = event.currentTarget;
    const guessValue = parseInt(selectedTile.dataset.value);

    const optionObj = currentPuzzle.options_pool.find(opt => opt.value === guessValue);
    
    let feedback = 'NO_MATCH'; 
    if (optionObj) {
        feedback = optionObj.feedback;
    } 

    guesses.push({value: guessValue, feedback: feedback});
    renderChances(); 

    let feedbackClass = `feedback-${feedback.toLowerCase()}`;
    selectedTile.classList.remove('feedback-grey', 'feedback-gold', 'feedback-green');
    selectedTile.classList.add(feedbackClass);
    selectedTile.removeEventListener('click', handleSubmit); 

    if (feedback === 'CORRECT') {
        messageElement.textContent = "CORRECT! You solved this sequence! Share your results!";
        disableOptions();
        guessTarget.classList.add('feedback-green');
        guessTarget.textContent = guessValue;
    } else if (guesses.length >= MAX_GUESSES) {
        messageElement.textContent = `Game Over! The correct answer was ${currentPuzzle.correct_answer}.`;
        disableOptions();
        guessTarget.classList.add('feedback-grey'); 
        guessTarget.textContent = currentPuzzle.correct_answer;
    } else if (feedback === 'RULE_MATCH') {
        messageElement.textContent = "GOLD! Close, but try the interwoven rule.";
    } else {
        messageElement.textContent = "Incorrect. Try again.";
    }
}

function disableOptions() {
    document.querySelectorAll('.option-tile').forEach(t => t.removeEventListener('click', handleSubmit));
}


// 6. Event Listeners and Initialization ---

// Tutorial (Question Mark)
rulesIcon.addEventListener('click', showTutorial);
tutorialNextButton.addEventListener('click', handleTutorialNext);

// Archivist (Folder Icon)
archiveIcon.addEventListener('click', showArchive); // This line is the fix!
archiveCloseButton.addEventListener('click', closeArchive);

// Placeholder for Stats/Settings icons
document.getElementById('stats-icon').addEventListener('click', () => {
    alert("Stats: Win history coming soon! (Placeholder)"); 
});

document.getElementById('settings-icon').addEventListener('click', () => {
    alert("Settings: Hard mode coming soon! (Placeholder)"); 
});


// Optional: Give up flag
document.getElementById('give-up-icon').addEventListener('click', () => {
    alert(`The correct answer was ${currentPuzzle.correct_answer}. You gave up.`);
    disableOptions();
    guessTarget.classList.add('feedback-grey');
    guessTarget.textContent = currentPuzzle.correct_answer;
});


// Start the game by loading the puzzle
loadDailyPuzzle();
