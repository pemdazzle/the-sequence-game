// ===== Sequence Game Script =====

// --- Constants ---
const LAUNCH_DATE = new Date('2025-10-01');
const MAX_GUESSES = 3;
const PUZZLE_FILE = './sequence_puzzles_600.json'; // GitHub root

// --- DOM Elements ---
const sequenceDisplay = document.getElementById('sequence-display');
const guessTarget = document.getElementById('guess-target');
const optionsPool = document.getElementById('options-pool');
const messageEl = document.getElementById('message');
const chanceIndicators = document.getElementById('chance-indicators');

const rulesIcon = document.getElementById('rules-icon');
const archiveIcon = document.getElementById('archive-icon');
const settingsIcon = document.getElementById('settings-icon');
const hintIcon = document.getElementById('hint-icon');
const giveUpIcon = document.getElementById('give-up-icon');

const tutorialModal = document.getElementById('tutorial-modal');
const tutorialNextButton = document.getElementById('tutorial-next-button');

// --- State ---
let currentPuzzle = null;
let guesses = [];

// --- Tutorial Functions ---
function showTutorial() { tutorialModal.style.display = 'flex'; }
function closeTutorial() { tutorialModal.style.display = 'none'; localStorage.setItem('hasSeenTutorial','true'); }
tutorialNextButton.addEventListener('click', closeTutorial);
rulesIcon.addEventListener('click', showTutorial);

// --- Load Daily Puzzle ---
async function loadDailyPuzzle() {
    if (!localStorage.getItem('hasSeenTutorial')) showTutorial();

    try {
        const response = await fetch(PUZZLE_FILE);
        const allPuzzles = await response.json();

        if (!Array.isArray(allPuzzles) || allPuzzles.length === 0) {
            throw new Error("Puzzle data missing or corrupted.");
        }

        const today = new Date();
        const dayIndex = Math.floor((today - LAUNCH_DATE)/(1000*60*60*24));
        currentPuzzle = allPuzzles[dayIndex % allPuzzles.length];

        renderPuzzle(currentPuzzle);
        renderChances();
    } catch (err) {
        console.error("Failed to load puzzle:", err);
        // Fallback test puzzle
        currentPuzzle = {
            puzzle_id: 0,
            sequence_display: [10, 189, 17, 567],
            correct_answer: 25,
            options_pool: [
                {value: 25, feedback: 'CORRECT'},
                {value: 746, feedback: 'RULE_MATCH'},
                {value: 106, feedback: 'NO_MATCH'},
                {value: 1117, feedback: 'NO_MATCH'},
                {value: 24, feedback: 'NO_MATCH'},
                {value: -1, feedback: 'NO_MATCH'}
            ]
        };
        renderPuzzle(currentPuzzle);
        renderChances();
        messageEl.textContent = "⚠️ Loaded fallback puzzle (JSON not found).";
    }
}

// --- Render Puzzle ---
function renderPuzzle(puzzle) {
    const tiles = sequenceDisplay.querySelectorAll('.tile:not(#guess-target)');
    tiles.forEach((tile, idx) => tile.textContent = puzzle.sequence_display[idx]);

    optionsPool.innerHTML = '';
    puzzle.options_pool.forEach(option => {
        const tile = document.createElement('div');
        tile.classList.add('tile', 'option-tile');
        tile.textContent = option.value;
        tile.dataset.value = option.value;
        tile.addEventListener('click', handleSubmit);
        optionsPool.appendChild(tile);
    });

    guesses = [];
    renderChances();
    messageEl.textContent = '';
    guessTarget.textContent = '?';
    guessTarget.className = 'tile guess-target';
}

// --- Render Lightbulbs ---
function renderChances() {
    chanceIndicators.innerHTML = '';
    const remaining = MAX_GUESSES - guesses.length;
    for (let i = 0; i < MAX_GUESSES; i++) {
        const span = document.createElement('span');
        span.classList.add('lightbulb', i < remaining ? 'lightbulb-on' : 'lightbulb-off');
        span.innerHTML = '<i class="fas fa-lightbulb"></i>';
        chanceIndicators.appendChild(span);
    }
}

// --- Handle Guess ---
function handleSubmit(e) {
    if (guesses.length >= MAX_GUESSES) return;

    const value = parseInt(e.currentTarget.dataset.value);
    const optionObj = currentPuzzle.options_pool.find(opt => opt.value === value);
    const feedback = optionObj ? optionObj.feedback : 'NO_MATCH';

    guesses.push({value, feedback});
    renderChances();

    e.currentTarget.classList.remove('feedback-green','feedback-gold','feedback-grey');
    e.currentTarget.classList.add(`feedback-${feedback.toLowerCase()}`);
    e.currentTarget.removeEventListener('click', handleSubmit);

    // Update message and target tile
    if (feedback === 'CORRECT') {
        messageEl.textContent = '🎉 Correct! You solved the sequence!';
        guessTarget.classList.add('feedback-green');
        guessTarget.textContent = value;
        disableOptions();
    } else if (feedback === 'RULE_MATCH') {
        messageEl.textContent = '✨ Close! Try the interwoven rule.';
    } else {
        messageEl.textContent = '❌ Incorrect. Try again.';
    }

    if (guesses.length >= MAX_GUESSES && feedback !== 'CORRECT') {
        messageEl.textContent = `💀 Game Over! Correct answer: ${currentPuzzle.correct_answer}`;
        guessTarget.classList.add('feedback-grey');
        guessTarget.textContent = currentPuzzle.correct_answer;
        disableOptions();
    }
}

function disableOptions() {
    document.querySelectorAll('.option-tile').forEach(t => t.removeEventListener('click', handleSubmit));
}

// --- Hint & Give Up ---
hintIcon.addEventListener('click', () => {
    const hintOption = currentPuzzle.options_pool.find(opt => opt.feedback === 'CORRECT');
    if (hintOption) messageEl.textContent = `💡 Hint: One possible correct number is ${hintOption.value}`;
});

giveUpIcon.addEventListener('click', () => {
    messageEl.textContent = `🏳️ You gave up! Correct answer: ${currentPuzzle.correct_answer}`;
    guessTarget.textContent = currentPuzzle.correct_answer;
    guessTarget.classList.add('feedback-grey');
    disableOptions();
});

// --- Placeholder icons ---
archiveIcon.addEventListener('click', () => alert('Archivist / Past Games coming soon!'));
settingsIcon.addEventListener('click', () => alert('Settings coming soon!'));

// --- Initialize Game ---
loadDailyPuzzle();
