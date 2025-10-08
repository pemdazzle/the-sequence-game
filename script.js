// --- script.js: The Finalized Game Logic ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01');
const PUZZLE_FILE = './sequence_puzzles_600.json';
let currentPuzzle = null;
let guesses = [];
const MAX_GUESSES = 3;

// TEMPORARY: Injected puzzle data to bypass fetch issues and confirm rendering works
const TEST_PUZZLE_DATA = [
    {
      "puzzle_id": 1,
      "rule_type": "Interwoven",
      "sequence_display": [10, 189, 17, 567],
      "correct_answer": 25,
      "options_pool": [
        {"value": 25, "feedback": "CORRECT"},
        {"value": 746, "feedback": "RULE_MATCH"},
        {"value": 106, "feedback": "NO_MATCH"},
        {"value": 1117, "feedback": "NO_MATCH"},
        {"value": 24, "feedback": "NO_MATCH"},
        {"value": -1, "feedback": "NO_MATCH"}
      ]
    }
];

// DOM Elements
const optionsPool = document.getElementById('options-pool');
const sequenceDisplay = document.getElementById('sequence-display');
const guessTarget = document.getElementById('guess-target');
const messageElement = document.getElementById('message');
const chanceIndicators = document.getElementById('chance-indicators');

// Icon DOM Elements
const rulesIcon = document.getElementById('rules-icon');
const archiveIcon = document.getElementById('archive-icon');
const settingsIcon = document.getElementById('settings-icon');

// Tutorial DOM Elements
const tutorialModal = document.getElementById('tutorial-modal');
const tutorialNextButton = document.getElementById('tutorial-next-button');


// --- 2. Tutorial Logic (for '?' Icon) ---
// Simplified logic to just show/hide the single modal panel.

function showTutorial() {
    tutorialModal.style.display = 'flex'; // Show the modal overlay
}

function closeTutorial() {
    tutorialModal.style.display = 'none'; // Hide the modal
    localStorage.setItem('hasSeenTutorial', 'true');
}

// Button now just closes the help panel
function handleTutorialNext() {
    closeTutorial();
}


// --- 3. Data Fetching and Puzzle Selection ---

async function loadDailyPuzzle() {
    // Check if the user has seen the tutorial. If not, show it.
    if (!localStorage.getItem('hasSeenTutorial')) {
        showTutorial();
    }
    
    try {
        // *** TEMPORARY OVERRIDE ***
        // const response = await fetch(PUZZLE_FILE); 
        // const allPuzzles = await response.json(); 
        const allPuzzles = TEST_PUZZLE_DATA; // Use hardcoded data for reliable testing
        // **************************

        if (!Array.isArray(allPuzzles) || allPuzzles.length === 0) {
             messageElement.textContent = "Error: Puzzle data is missing or corrupted.";
             return;
        }

        const today = new Date();
        const timeDiff = today.getTime() - LAUNCH_DATE.getTime();
        const dayIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); 
        
        // This will always get the first puzzle from the TEST_PUZZLE_DATA array for now
        currentPuzzle = allPuzzles[dayIndex % allPuzzles.length];

        renderPuzzle(currentPuzzle);
        renderChances(); // Render the initial lightbulbs

    } catch (error) {
        messageElement.textContent = "Fatal Error in game logic.";
        console.error("Game Logic Error:", error);
    }
}

// --- 4. Rendering and UI Handlers ---

function renderPuzzle(puzzle) {
    // A. Display the 4 sequence numbers
    const sequenceTiles = sequenceDisplay.querySelectorAll('.tile:not(#guess-target)');
    sequenceTiles.forEach((tile, index) => {
        tile.textContent = puzzle.sequence_display[index];
    });

    // B. Render the selectable options pool
    optionsPool.innerHTML = ''; 
    currentPuzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value; 
        tile.addEventListener('click', handleSubmit); 
        optionsPool.appendChild(tile);
    });
    
    // Clear initial message
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
    selectedTile.removeEventListener('click', handleSubmit); // Prevent re-clicking

    // Update UI and check win/loss conditions
    if (feedback === 'CORRECT') {
        messageElement.textContent = "CORRECT! You solved today's sequence! Share your results!";
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

// --- 5. Event Listeners and Initialization ---

// Connect the '?' icon to the tutorial
rulesIcon.addEventListener('click', showTutorial);
tutorialNextButton.addEventListener('click', handleTutorialNext);

// Placeholder actions for other icons
archiveIcon.addEventListener('click', () => {
    alert("Archivist is a premium feature! (Placeholder)");
});

settingsIcon.addEventListener('click', () => {
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
