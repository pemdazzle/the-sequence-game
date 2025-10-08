// ===== Sequence Game Script =====

// --- Constants ---
const LAUNCH_DATE = new Date('2025-10-01');
const MAX_GUESSES = 4; // Increased for the new two-step logic
const PUZZLE_FILE = 'puzzles.json';

// --- DOM Elements ---
const sequenceDisplay = document.getElementById('sequence-display');
const optionsPool = document.getElementById('options-pool');
const messageEl = document.getElementById('message');
const chanceIndicators = document.getElementById('chance-indicators');
const rulesIcon = document.getElementById('rules-icon');
const hintIcon = document.getElementById('hint-icon');
const giveUpIcon = document.getElementById('give-up-icon');
const tutorialModal = document.getElementById('tutorial-modal');
const tutorialCloseButton = document.getElementById('tutorial-close-button');
const archiveIcon = document.getElementById('archive-icon');
const settingsIcon = document.getElementById('settings-icon');


// --- Game State ---
let currentPuzzle = null;
let guesses = [];
let selectedDistractor = null;
let hintLevel = 0;
let isGameOver = false;

// --- Tutorial ---
function showTutorial() { tutorialModal.style.display = 'flex'; }
function closeTutorial() { tutorialModal.style.display = 'none'; localStorage.setItem('hasSeenTutorial', 'true'); }
tutorialCloseButton.addEventListener('click', closeTutorial);
rulesIcon.addEventListener('click', showTutorial);

// --- Load Daily Puzzle ---
async function loadDailyPuzzle() {
    if (!localStorage.getItem('hasSeenTutorial')) {
        showTutorial();
    }

    try {
        const response = await fetch(PUZZLE_FILE);
        const allPuzzles = await response.json();
        if (!Array.isArray(allPuzzles) || !allPuzzles.length) throw new Error("Puzzle data is invalid.");

        const today = new Date();
        const dayIndex = Math.floor((today - LAUNCH_DATE) / (1000 * 60 * 60 * 24));
        currentPuzzle = allPuzzles[dayIndex % allPuzzles.length];
        
        renderPuzzle(currentPuzzle);
    } catch (error) {
        console.error("Failed to load puzzle:", error);
        messageEl.textContent = "⚠️ Error loading today's puzzle. Please refresh.";
    }
}

// --- Render Puzzle ---
function renderPuzzle(puzzle) {
    // Reset state for new puzzle
    guesses = [];
    selectedDistractor = null;
    hintLevel = 0;
    isGameOver = false;

    // Render sequence tiles
    sequenceDisplay.innerHTML = '';
    puzzle.sequence_display.forEach(num => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'sequence-tile');
        tile.textContent = num;
        tile.dataset.value = num;
        tile.addEventListener('click', handleDistractorSelection);
        sequenceDisplay.appendChild(tile);
    });

    // Render options tiles
    optionsPool.innerHTML = '';
    puzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value;
        tile.addEventListener('click', handleGuess);
        optionsPool.appendChild(tile);
    });

    updateUI();
}

// --- Update UI ---
function updateUI() {
    // Update Chance Indicators (Lightbulbs)
    chanceIndicators.innerHTML = '';
    const remainingGuesses = MAX_GUESSES - guesses.length;
    for (let i = 0; i < MAX_GUESSES; i++) {
        const span = document.createElement('span');
        span.classList.add('lightbulb', i < remainingGuesses ? 'lightbulb-on' : 'lightbulb-off');
        span.innerHTML = '<i class="fas fa-lightbulb"></i>';
        chanceIndicators.appendChild(span);
    }

    // Update message
    if (isGameOver) return;
    if (selectedDistractor === null) {
        messageEl.textContent = 'Identify the number that breaks the pattern.';
    } else {
        messageEl.textContent = 'Now, find the next number in the sequence.';
    }
}

// --- Event Handlers ---

function handleDistractorSelection(e) {
    if (isGameOver || selectedDistractor !== null) return;

    const value = parseInt(e.currentTarget.dataset.value);
    selectedDistractor = value;

    // Visually deactivate selected tile and update others
    document.querySelectorAll('.sequence-tile').forEach(tile => {
        if (parseInt(tile.dataset.value) === value) {
            tile.classList.add('deactivated');
        } else {
            tile.classList.remove('deactivated'); // Ensure only one is ever deactivated
        }
        tile.removeEventListener('click', handleDistractorSelection); // Lock in selection
    });
    
    updateUI();
}

function handleGuess(e) {
    if (isGameOver || guesses.length >= MAX_GUESSES) return;

    if (selectedDistractor === null) {
        messageEl.textContent = 'First, you must select a distractor from the top row.';
        return;
    }

    const guessedValue = parseInt(e.currentTarget.dataset.value);
    const isCorrectDistractor = selectedDistractor === currentPuzzle.distractor_value;
    const isCorrectAnswer = guessedValue === currentPuzzle.correct_answer;

    guesses.push(guessedValue);
    
    e.currentTarget.classList.add('is-flipped');
    e.currentTarget.removeEventListener('click', handleGuess);

    if (isCorrectDistractor && isCorrectAnswer) {
        // WIN condition
        messageEl.textContent = `🎉 Correct! The rule was: ${currentPuzzle.rule_description}`;
        e.currentTarget.classList.add('feedback-green');
        endGame(true);
    } else {
        // INCORRECT guess condition
        if (!isCorrectDistractor) {
            messageEl.textContent = 'That is not the correct answer. Re-evaluate your chosen distractor.';
        } else {
            messageEl.textContent = 'You have the right sequence, but that is not the next number.';
        }
        e.currentTarget.classList.add('feedback-grey');

        if (guesses.length >= MAX_GUESSES) {
            messageEl.textContent = `💀 Game Over! The answer was ${currentPuzzle.correct_answer}.`;
            endGame(false);
        }
    }
    
    updateUI();
}

function endGame(didWin) {
    isGameOver = true;
    document.querySelectorAll('.option-tile, .sequence-tile').forEach(tile => {
        tile.removeEventListener('click', handleGuess);
        tile.removeEventListener('click', handleDistractorSelection);
    });

    // Reveal correct answer if lost
    if (!didWin) {
        const correctOption = document.querySelector(`.option-tile[data-value='${currentPuzzle.correct_answer}']`);
        if (correctOption) {
            correctOption.classList.add('feedback-green');
        }
    }
}


// --- Hint & Give Up ---
hintIcon.addEventListener('click', () => {
    if (isGameOver) return;
    
    hintLevel++;
    switch(hintLevel) {
        case 1:
            messageEl.textContent = `💡 Hint: The pattern is ${currentPuzzle.rule_type}.`;
            break;
        case 2:
            const oppositeType = currentPuzzle.rule_type === 'Arithmetic' ? 'Geometric' : 'Arithmetic';
            messageEl.textContent = `💡 Hint: The pattern does NOT involve ${oppositeType.toLowerCase()} logic.`;
            break;
        case 3:
            messageEl.textContent = `💡 Hint: ${currentPuzzle.rule_description}`;
            break;
        case 4:
            messageEl.textContent = `💡 Hint: The distractor number is ${currentPuzzle.distractor_value}.`;
            // Visually show the distractor
            document.querySelectorAll('.sequence-tile').forEach(tile => {
                tile.classList.toggle('deactivated', parseInt(tile.dataset.value) === currentPuzzle.distractor_value);
            });
            break;
        default:
            messageEl.textContent = 'No more hints available!';
    }
});

giveUpIcon.addEventListener('click', () => {
    if (isGameOver) return;
    messageEl.textContent = `🏳️ The answer was ${currentPuzzle.correct_answer}. The distractor was ${currentPuzzle.distractor_value}.`;
    endGame(false);
});


// --- Placeholder Icons ---
archiveIcon.addEventListener('click', () => alert('Archivist / Past Games coming soon!'));
settingsIcon.addEventListener('click', () => alert('Settings coming soon!'));


// --- Initialize Game ---
loadDailyPuzzle();
