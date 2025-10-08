// --- script.js: The Finalized Game Logic ---

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
const chanceIndicators = document.getElementById('chance-indicators'); // New

// Icon DOM Elements
const rulesIcon = document.getElementById('rules-icon'); // ? icon
const archiveIcon = document.getElementById('archive-icon');
const settingsIcon = document.getElementById('settings-icon');

// Tutorial DOM Elements (Used for the ? icon)
const tutorialModal = document.getElementById('tutorial-modal');
const tutorialTextBox = document.getElementById('tutorial-text-box');
const tutorialNextButton = document.getElementById('tutorial-next-button');
const tutorialSkipButton = document.getElementById('tutorial-skip-button');

// --- TUTORIAL CONTENT (for the '?' icon) ---
const TUTORIAL_STEPS = [
    {
        title: "Rule 1: The Basic Game",
        content: "<p>The puzzle shows four numbers, followed by a **question mark**. Your job is to guess the number that belongs where the question mark is.</p><p>You must choose an answer from the **six options** below. You get **three chances**!</p>"
    },
    {
        title: "Rule 2: The Interwoven Secret 🤫",
        content: "<h3>Pay attention! This is the most important rule.</h3><p>The numbers don't follow just *one* sequence. They follow **two separate sequences** that are *interwoven* (or zipped up) together.</p><p style='color: #4a90e2; font-weight: bold;'>The 1st, 3rd, and the 5th (Answer) number form SEQUENCE A.</p><p style='color: #e27d60; font-weight: bold;'>The 2nd and 4th number form SEQUENCE B (distractor sequence).</p>"
    },
    {
        title: "Rule 3: What the Colors Mean",
        content: "<p>After you guess, you get feedback:</p><ul><li><span style='color: #6aaa64; font-weight: bold;'>GREEN:</span> You solved the Sequence A rule correctly.</li><li><span style='color: #c9b458; font-weight: bold;'>GOLD:</span> You found a pattern, but applied it to the **wrong sequence** (Sequence B), or found a simpler, non-target rule.</li><li><span style='color: #787c7e; font-weight: bold;'>GREY:</span> Your guess had no relation to the sequences.</li></ul>"
    },
    {
        title: "Let's Play!",
        content: "<p>Look closely at the 1st and 3rd number to find **Sequence A**. Click the option tile you think is correct to submit your guess!</p><p>Click the **'Start Game'** button to begin today's puzzle.</p>"
    }
];
// Note: We use the system font stack for simplicity in the commit, though the CSS imports Poppins

// --- 2. Tutorial Logic (for '?' Icon) ---

function showTutorial() {
    tutorialStep = 0;
    tutorialModal.style.display = 'flex';
    updateTutorialStep();
}

function updateTutorialStep() {
    if (tutorialStep < TUTORIAL_STEPS.length) {
        const step = TUTORIAL_STEPS[tutorialStep];
        tutorialTextBox.innerHTML = `<h3>${step.title}</h3>${step.content}`;
        
        if (tutorialStep === TUTORIAL_STEPS.length - 1) {
            tutorialNextButton.textContent = "Start Game";
        } else {
            tutorialNextButton.textContent = "Next Step";
        }
    } else {
        closeTutorial();
    }
}

function closeTutorial() {
    tutorialModal.style.display = 'none';
    // Only set 'hasSeenTutorial' if user finished or skipped, not if they opened it mid-game
    if (tutorialStep > 0) { 
        localStorage.setItem('hasSeenTutorial', 'true');
    }
}

function handleTutorialNext() {
    if (tutorialStep === TUTORIAL_STEPS.length - 1) {
        closeTutorial();
    } else {
        tutorialStep++;
        updateTutorialStep();
    }
}

// --- 3. Data Fetching and Puzzle Selection ---

async function loadDailyPuzzle() {
    // We remove the auto-show tutorial here; it's now attached to the '?' icon.
    
    try {
        const response = await fetch(PUZZLE_FILE);
        const allPuzzles = await response.json();
        
        if (allPuzzles.length === 0) {
             messageElement.textContent = "Error: Puzzle data is empty.";
             return;
        }

        const today = new Date();
        const timeDiff = today.getTime() - LAUNCH_DATE.getTime();
        const dayIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); 
        
        currentPuzzle = allPuzzles[dayIndex % allPuzzles.length];

        renderPuzzle(currentPuzzle);
        renderChances(); // Render the initial lightbulbs

    } catch (error) {
        messageElement.textContent = "Error fetching data. Check your JSON file and path.";
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

    // B. Render the selectable options pool (FIX for missing options)
    optionsPool.innerHTML = ''; 
    currentPuzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value; 
        // IMPORTANT: Guess is now submitted on click
        tile.addEventListener('click', handleSubmit); 
        optionsPool.appendChild(tile);
    });
    
    // Set initial message
    messageElement.textContent = ``;
}

function renderChances() {
    chanceIndicators.innerHTML = '';
    const remaining = MAX_GUESSES - guesses.length;

    for (let i = 0; i < MAX_GUESSES; i++) {
        const span = document.createElement('span');
        span.classList.add('lightbulb');
        // Font Awesome lightbulb
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

    // The selected tile IS the event target since we moved the listener
    const selectedTile = event.currentTarget;
    const guessValue = parseInt(selectedTile.dataset.value);

    // Find the option object that matches the selected value
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
        messageElement.textContent = "CORRECT! You solved today's sequence!";
        disableOptions();
    } else if (guesses.length >= MAX_GUESSES) {
        messageElement.textContent = `Game Over! The correct answer was ${currentPuzzle.correct_answer}.`;
        disableOptions();
    } else if (feedback === 'RULE_MATCH') {
        messageElement.textContent = "GOLD! Close, but try the interwoven rule.";
    } else {
        messageElement.textContent = "Incorrect. Try again.";
    }
    
    // Finalize UI state
    guessTarget.textContent = '?';
    
    // Optional: Hide the submit button area since it's now tile-click based
    document.getElementById('action-area').style.display = 'none';
}

function disableOptions() {
    document.querySelectorAll('.option-tile').forEach(t => t.removeEventListener('click', handleSubmit));
}

// --- 5. Event Listeners and Initialization ---

// 1. Connect the '?' icon to the tutorial
rulesIcon.addEventListener('click', showTutorial);
tutorialNextButton.addEventListener('click', handleTutorialNext);
tutorialSkipButton.addEventListener('click', closeTutorial);

// 2. Placeholder actions for other icons
archiveIcon.addEventListener('click', () => {
    alert("Archivist is a premium feature! (Placeholder)");
});

settingsIcon.addEventListener('click', () => {
    // In a final game, this would toggle hard mode/dark theme
    alert("Settings: Hard mode coming soon! (Placeholder)"); 
});

// 3. Optional: Give up flag
document.getElementById('give-up-icon').addEventListener('click', () => {
    alert(`The correct answer was ${currentPuzzle.correct_answer}. You gave up.`);
    disableOptions();
});


// Start the game by loading the puzzle
loadDailyPuzzle();
