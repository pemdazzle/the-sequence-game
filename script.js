// --- script.js: The Game Logic ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01'); // Game launch date for daily puzzle calculation
const PUZZLE_FILE = './sequence_puzzles_600.json'; // Path to your data file
let currentPuzzle = null;
let selectedOptionValue = null;
let guesses = []; // To track history: [{value: 25, feedback: 'GREY'}, ...]
const MAX_GUESSES = 3; 

// DOM Elements
const optionsPool = document.getElementById('options-pool');
const sequenceDisplay = document.getElementById('sequence-display');
const submitButton = document.getElementById('submit-guess');
const guessTarget = document.getElementById('guess-target');
const messageElement = document.getElementById('message');
const feedbackHistory = document.getElementById('feedback-history');

// --- 2. Data Fetching and Puzzle Selection ---

async function loadDailyPuzzle() {
    try {
        const response = await fetch(PUZZLE_FILE);
        const allPuzzles = await response.json();
        
        if (allPuzzles.length === 0) {
             messageElement.textContent = "Error: Puzzle data is empty.";
             return;
        }

        // Calculate the current day's index (0-599 for a 600-day array)
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

// --- 3. Rendering and UI Handlers ---

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
        square.style.width = '20px'; // Make history squares smaller
        square.style.height = '20px';
        square.style.lineHeight = '20px';
        square.style.marginRight = '5px';
        
        row.appendChild(square);
        feedbackHistory.appendChild(row);
    });
}

function handleOptionSelect(event) {
    // 1. Clear previous selection highlight
    document.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
    
    // 2. Set new selection
    selectedOptionValue = event.target.dataset.value;
    event.target.classList.add('selected');
    guessTarget.textContent = selectedOptionValue;
    submitButton.disabled = false; // Enable the submit button
    messageElement.textContent = `Selected: ${selectedOptionValue}`;
}

function handleSubmit() {
    if (!selectedOptionValue || guesses.length >= MAX_GUESSES) return;

    const guessValue = parseInt(selectedOptionValue);
    
    // Find the option object that matches the selected value
    const optionObj = currentPuzzle.options_pool.find(opt => opt.value === guessValue);
    
    // Determine feedback
    let feedback = 'NO_MATCH'; // Defaults to GREY
    
    if (optionObj) {
        feedback = optionObj.feedback;
    } 

    // Add to history
    guesses.push({value: guessValue, feedback: feedback});

    // Apply feedback color and message
    let feedbackClass = `feedback-${feedback.toLowerCase()}`;
    guessTarget.classList.remove('feedback-grey', 'feedback-gold', 'feedback-green');
    guessTarget.classList.add(feedbackClass);
    
    // Update UI and check win/loss conditions
    if (feedback === 'CORRECT') {
        messageElement.textContent = "CORRECT! You solved today's sequence!";
        submitButton.disabled = true;
        // Optionally show confetti or a "Share" button here
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

// --- 4. Event Listeners and Initialization ---

submitButton.addEventListener('click', handleSubmit);

// Start the game by loading the puzzle
loadDailyPuzzle();
