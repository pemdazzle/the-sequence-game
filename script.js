// --- script.js: The Game Logic ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01'); // Game launch date for daily puzzle calculation
const PUZZLE_FILE = './sequence_puzzles_600.json'; // Path to your data file
let currentPuzzle = null;
let selectedOptionValue = null;
let guesses = [];
const MAX_GUESSES = 3; 
let tutorialStep = 0; // Tracks the current step of the tutorial

// DOM Elements
const optionsPool = document.getElementById('options-pool');
const sequenceDisplay = document.getElementById('sequence-display');
const submitButton = document.getElementById('submit-guess');
const guessTarget = document.getElementById('guess-target');
const messageElement = document.getElementById('message');
const feedbackHistory = document.getElementById('feedback-history');

// Tutorial DOM Elements
const tutorialModal = document.getElementById('tutorial-modal');
const tutorialTextBox = document.getElementById('tutorial-text-box');
const tutorialNextButton = document.getElementById('tutorial-next-button');
const tutorialSkipButton = document.getElementById('tutorial-skip-button');

// --- TUTORIAL CONTENT ---
const TUTORIAL_STEPS = [
    {
        title: "Rule 1: The Basic Game",
        content: "<p>The puzzle shows four numbers, followed by a **question mark**. Your job is to guess the number that belongs where the question mark is.</p><p>You must choose an answer from the **six options** below. You get **three guesses**!</p>"
    },
    {
        title: "Rule 2: The Interwoven Secret 🤫",
        content: "<h3>Pay attention! This is the most important rule.</h3><p>The numbers don't follow just *one* sequence. They follow **two separate sequences** that are *interwoven* (or zipped up) together.</p><p style='color: #007bff; font-weight: bold;'>The 1st, 3rd, and the 5th (Answer) number form SEQUENCE A.</p><p style='color: #e27d60; font-weight: bold;'>The 2nd and 4th number form SEQUENCE B (distractor sequence).</p>"
    },
    {
        title: "Rule 3: What the Colors Mean",
        content: "<p>After you guess, you get feedback:</p><ul><li><span style='color: #6aaa64; font-weight: bold;'>GREEN:</span> You guessed the correct number!</li><li><span style='color: #c9b458; font-weight: bold;'>GOLD:</span> You found a pattern, but you applied it to the **wrong sequence** (Sequence B), or you applied a simple rule that isn't the main hidden rule.</li><li><span style='color: #787c7e; font-weight: bold;'>GREY:</span> Your guess had no relation to either sequence.</li></ul>"
    },
    {
        title: "Let's Play!",
        content: "<p>Look closely at the 1st and 3rd number to find **Sequence A**. Use that rule to solve the question mark!</p><p>Click the **'Start Game'** button to begin today's puzzle.</p>"
    }
];

// --- 4. Tutorial Logic ---

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
    localStorage.setItem('hasSeenTutorial', 'true');
}

function handleTutorialNext() {
    if (tutorialStep === TUTORIAL_STEPS.length - 1) {
        closeTutorial();
    } else {
        tutorialStep++;
        updateTutorialStep();
    }
}

// --- 5. Main Game Logic (Refactored) ---

async function loadDailyPuzzle() {
    // Check if the user has seen the tutorial. If not, show it.
    if (!localStorage.getItem('hasSeenTutorial')) {
        showTutorial();
    }

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

    } catch (error) {
        messageElement.textContent = "Error fetching data. Check your JSON file and path.";
        console.error("Fetch Error:", error);
    }
}

function renderPuzzle(puzzle) {
    // A. Display the 4 sequence numbers
    const sequenceTiles = sequenceDisplay.querySelectorAll('.tile:not(#guess-target)');
    sequenceTiles.forEach((tile, index) => {
        tile.textContent = puzzle.sequence_display[index];
    });

    // B. Render the selectable options pool
    optionsPool.innerHTML = ''; 
    puzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value; 
        tile.addEventListener('click', handleOptionSelect);
        optionsPool.appendChild(tile);
    });
    
    // Set initial message
    messageElement.textContent = `You have ${MAX_GUESSES} attempts remaining.`;
}

function renderFeedbackHistory() {
    feedbackHistory.innerHTML = '';
    guesses.forEach(guess => {
        const row = document.createElement('div');
        row.classList.add('feedback-row');
        
        const square = document.createElement('div');
        square.classList.add('tile', `feedback-${guess.feedback.toLowerCase()}`);
        square.style.width = '20px'; 
        square.style.height = '20px';
        square.style.lineHeight = '20px';
        square.style.marginRight = '5px';
        
        row.appendChild(square);
        feedbackHistory.appendChild(row);
    });
}

function handleOptionSelect(event) {
    // Clear previous selection highlight
    document.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
    
    // Set new selection
    selectedOptionValue = event.target.dataset.value;
    event.target.classList.add('selected');
    guessTarget.textContent = selectedOptionValue;
    submitButton.disabled = false;
    messageElement.textContent = `Selected: ${selectedOptionValue}`;
}

function handleSubmit() {
    if (!selectedOptionValue || guesses.length >= MAX_GUESSES) return;

    const guessValue = parseInt(selectedOptionValue);
    const optionObj = currentPuzzle.options_pool.find(opt => opt.value === guessValue);
    
    let feedback = 'NO_MATCH'; 
    if (optionObj) {
        feedback = optionObj.feedback;
    } 

    guesses.push({value: guessValue, feedback: feedback});

    let feedbackClass = `feedback-${feedback.toLowerCase()}`;
    guessTarget.classList.remove('feedback-grey', 'feedback-gold', 'feedback-green');
    guessTarget.classList.add(feedbackClass);
    
    // Update UI and check win/loss conditions
    if (feedback === 'CORRECT') {
        messageElement.textContent = "CORRECT! You solved today's sequence! Share your results!";
        submitButton.disabled = true;
    } else if (guesses.length >= MAX_GUESSES) {
        messageElement.textContent = `Game Over! The correct answer was ${currentPuzzle.correct_answer}.`;
        submitButton.disabled = true;
    } else if (feedback === 'RULE_MATCH') {
        messageElement.textContent = `GOLD! Close, but try the interwoven rule. (${MAX_GUESSES - guesses.length} guesses left.)`;
    } else {
        messageElement.textContent = `Incorrect. Try again. (${MAX_GUESSES - guesses.length} guesses left.)`;
    }
    
    // Finalize UI state
    renderFeedbackHistory();
    selectedOptionValue = null;
    submitButton.disabled = true;
    guessTarget.textContent = '?';
    document.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
}

// --- 6. Event Listeners and Initialization ---

submitButton.addEventListener('click', handleSubmit);
tutorialNextButton.addEventListener('click', handleTutorialNext);
tutorialSkipButton.addEventListener('click', closeTutorial);

// Start the game by loading the puzzle
loadDailyPuzzle();
