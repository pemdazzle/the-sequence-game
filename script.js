// --- script.js: The Game Logic ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01'); // Game launch date for daily puzzle calculation
const PUZZLE_FILE = './sequence_puzzles_600.json'; // Path to your data file
let currentPuzzle = null;
let selectedOption = null;

// DOM Elements
const optionsPool = document.getElementById('options-pool');
const sequenceDisplay = document.getElementById('sequence-display');
const submitButton = document.getElementById('submit-guess');
const guessTarget = document.getElementById('guess-target');
const messageElement = document.getElementById('message');

// --- 2. Data Fetching and Puzzle Selection ---

async function loadDailyPuzzle() {
    try {
        // Fetch the full puzzle JSON file
        const response = await fetch(PUZZLE_FILE);
        const allPuzzles = await response.json();
        
        if (allPuzzles.length === 0) {
             messageElement.textContent = "Error: Puzzle data is empty.";
             return;
        }

        // Calculate the current day's index (0-599 for a 600-day array)
        const today = new Date();
        const timeDiff = today.getTime() - LAUNCH_DATE.getTime();
        const dayIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Days since launch
        
        // Use the modulo operator to loop the puzzles after 600 days
        currentPuzzle = allPuzzles[dayIndex % allPuzzles.length];

        // Now that the puzzle is loaded, render the interface
        renderPuzzle(currentPuzzle);

    } catch (error) {
        messageElement.textContent = "Error fetching data. Check your JSON file and path.";
        console.error("Fetch Error:", error);
    }
}

// --- 3. Rendering and UI Handlers ---

function renderPuzzle(puzzle) {
    // A. Display the 4 sequence numbers (HTML already has placeholders)
    const sequenceTiles = sequenceDisplay.querySelectorAll('.tile:not(#guess-target)');
    sequenceTiles.forEach((tile, index) => {
        tile.textContent = puzzle.sequence_display[index];
    });

    // B. Render the selectable options pool
    optionsPool.innerHTML = ''; // Clear previous options
    puzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value; // Store the number
        tile.addEventListener('click', handleOptionSelect);
        optionsPool.appendChild(tile);
    });
}

function handleOptionSelect(event) {
    // Clear previous selection highlight
    document.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
    
    // Set new selection
    selectedOption = event.target.dataset.value;
    event.target.classList.add('selected');
    guessTarget.textContent = selectedOption;
    submitButton.disabled = false; // Enable the submit button
}

function handleSubmit() {
    if (!selectedOption) return;

    // Find the option object that matches the selected value
    const guessValue = parseInt(selectedOption);
    const optionObj = currentPuzzle.options_pool.find(opt => opt.value === guessValue);
    
    // Apply feedback color
    let feedbackClass = 'feedback-grey'; // Default to GREY

    if (optionObj) {
        if (optionObj.feedback === 'CORRECT') {
            feedbackClass = 'feedback-green';
            messageElement.textContent = "CORRECT! Great job!";
            // Optional: Disable all input after correct guess
            submitButton.disabled = true; 
        } else if (optionObj.feedback === 'RULE_MATCH') {
            feedbackClass = 'feedback-gold';
            messageElement.textContent = "GOLD! Close, but try the interwoven rule.";
        } else {
            messageElement.textContent = "Incorrect. Try again.";
        }
        
        // Update the guess tile color
        guessTarget.classList.remove('feedback-grey', 'feedback-gold', 'feedback-green');
        guessTarget.classList.add(feedbackClass);

        // Reset selection for next guess attempt
        selectedOption = null;
        submitButton.disabled = true;
        guessTarget.textContent = '?';
        document.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
    }
}

// --- 4. Event Listeners and Initialization ---

submitButton.addEventListener('click', handleSubmit);

// Start the game by loading the puzzle
loadDailyPuzzle();
