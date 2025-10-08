// --- script.js: The Finalized Game Logic (RE-COMMITTING FOR SYNC) ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01');
const PUZZLE_FILE = './sequence_puzzles_600.json';
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
const settingsIcon = document.getElementById('settings-icon');

// Tutorial DOM Elements (Used for the ? icon)
const tutorialModal = document.getElementById('tutorial-modal');
const tutorialTextBox = document.getElementById('tutorial-text-box');
const tutorialNextButton = document.getElementById('tutorial-next-button');
const tutorialSkipButton = document.getElementById('tutorial-skip-button');

// --- TUTORIAL CONTENT (Content remains the same) ---
// --- TUTORIAL CONTENT (Simplified for single-panel display) ---
// This content is now largely structural HTML in index.html, 
// but we keep the header for organizational consistency.
// The TUTORIAL_STEPS array is no longer used by the display logic.

// --- 2. Tutorial Logic (for '?' Icon) ---
// Simplified logic to just show/hide the single modal panel.

function showTutorial() {
    tutorialModal.style.display = 'flex'; // Show the modal
    // No need to track steps
}

function closeTutorial() {
    tutorialModal.style.display = 'none'; // Hide the modal
    localStorage.setItem('hasSeenTutorial', 'true');
}

// Rename this function to reflect its new purpose (closing the panel)
function handleTutorialNext() {
    closeTutorial();
}

// ... the rest of the script.js file continues from here ...
    } else {
        tutorialStep++;
        updateTutorialStep();
    }
}

// --- 3. Data Fetching and Puzzle Selection ---

async function loadDailyPuzzle() {
    // Check if the user has seen the tutorial. If not, show it.
    if (!localStorage.getItem('hasSeenTutorial')) {
        showTutorial();
    }
    
    try {
        const response = await fetch(PUZZLE_FILE);
        const allPuzzles = await response.json();
        
        // **CRITICAL CHECK ADDED:** Ensure the fetched data is an array
        if (!Array.isArray(allPuzzles) || allPuzzles.length === 0) {
             messageElement.textContent = "Error: Puzzle data is missing or corrupted. Check sequence_puzzles_600.json.";
             return;
        }

        const today = new Date();
        const timeDiff = today.getTime() - LAUNCH_DATE.getTime();
        const dayIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); 
        
        currentPuzzle = allPuzzles[dayIndex % allPuzzles.length];

        renderPuzzle(currentPuzzle);
        renderChances(); // Render the initial lightbulbs

    } catch (error) {
        messageElement.textContent = "Fatal Error fetching data. Is sequence_puzzles_600.json uploaded and named correctly?";
        console.error("Fetch Error:", error);
    }
}

// --- 4. Rendering and UI Handlers ---

function renderPuzzle(puzzle) {
    // A. Display the 4 sequence numbers
    const sequenceTiles = sequenceDisplay.querySelectorAll('.tile:not(#guess-target)');
    sequenceTiles.forEach((tile, index) => {
        tile.textContent = puzzle.sequence_display[index];
    });

    // B. Render the selectable options pool (Distractors and correct answer loading here)
    optionsPool.innerHTML = ''; 
    currentPuzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value; 
        // Guess is now submitted on click (No Submit Button needed)
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
        // Font Awesome lightbulb icon
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

    // The selected tile IS the event target
    const selectedTile = event.currentTarget;
    const guessValue = parseInt(selectedTile.dataset.value);

    const optionObj = currentPuzzle.options_pool.find(opt => opt.value === guessValue);
    
    let feedback = 'NO_MATCH'; 
    if (optionObj) {
        feedback = optionObj.feedback;
    } 

    // Add to history and update chances
    guesses.push({value: guessValue, feedback: feedback});
    renderChances(); 

    // Visual feedback on the selected tile (GREEN, GOLD, GREY)
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
        guessTarget.classList.add('feedback-grey'); // Indicate failed puzzle
        guessTarget.textContent = currentPuzzle.correct_answer;
    } else if (feedback === 'RULE_MATCH') {
        messageElement.textContent = "GOLD! Close, but try the interwoven rule.";
    } else {
        messageElement.textContent = "Incorrect. Try again.";
    }
    
    // Finalize UI state
    
}

function disableOptions() {
    document.querySelectorAll('.option-tile').forEach(t => t.removeEventListener('click', handleSubmit));
}

// --- 5. Event Listeners and Initialization ---

// Connect the '?' icon to the tutorial
rulesIcon.addEventListener('click', showTutorial);
tutorialNextButton.addEventListener('click', handleTutorialNext);
tutorialSkipButton.addEventListener('click', closeTutorial);

// Placeholder actions for other icons
archiveIcon.addEventListener('click', () => {
    alert("Archivist is a premium feature! (Placeholder)");
});

settingsIcon.addEventListener('click', () => {
    // In a final game, this would toggle hard mode/dark theme
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
