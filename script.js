// --- script.js: The Finalized Game Logic (Data Loading FIXED) ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01');
const PUZZLE_FILE = './sequence_puzzles_600.json';
let allPuzzlesData = []; // Store the full list of puzzles
let currentPuzzle = null;
let guesses = [];
const MAX_GUESSES = 3;

// *** TEMPORARY FIX: Hardcoded puzzle data to ensure rendering always works ***
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
// ***************************************************************************

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
const statsIcon = document.getElementById('stats-icon');

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
    
    // Use the stored puzzle data for the archive list
    const puzzlesToRender = allPuzzlesData.length > 0 ? allPuzzlesData : TEST_PUZZLE_DATA;

    if (puzzlesToRender.length === 0) {
        puzzleHistoryList.innerHTML = `<p style="color: #e74c3c;">Error: Cannot load puzzle archive data.</p>`;
        return;
    }

    // Only render for puzzles that exist in the data set
    for (let i = daysSinceLaunch; i >= 0 && i < puzzlesToRender.length; i--) {
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
    // Use the stored puzzle data for loading
    const puzzlesSource = allPuzzlesData.length > 0 ? allPuzzlesData : TEST_PUZZLE_DATA;

    if (index >= 0 && index < puzzlesSource.length) {
        currentPuzzle = puzzlesSource[index];
        guesses = []; // Reset game state
        
        renderPuzzle(currentPuzzle);
        renderChances();
        
        messageElement.textContent = `Now playing Puzzle #${index + 1}.`;
        archiveModal.style.display = 'none'; // Close the archive modal
        
        // Reset visual state
        document.querySelectorAll('.option-tile').forEach(t => t.addEventListener('click', handleSubmit));
        guessTarget.textContent = '?';
        guessTarget.classList.remove('feedback-green', 'feedback-grey');

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
    
    let allPuzzles;
    
    // *** DATA LOADING STRATEGY ***
    try {
        // Attempt to fetch real data first
        const response = await fetch(PUZZLE_FILE);
        allPuzzles = await response.json(); 
        
    } catch (error) {
        // If fetch fails (like it often does on GH Pages), fall back to test data
        console.error("Fetch failed, falling back to TEST_PUZZLE_DATA. Check sequence_puzzles_600.json for validity.");
        allPuzzles = TEST_PUZZLE_DATA;
    }
    
    allPuzzlesData = allPuzzles; // Store all data (whether real or test) globally

    if (!Array.isArray(allPuzzlesData) || allPuzzlesData.length === 0) {
         messageElement.textContent = "Error: Puzzle data is missing or corrupted. Game cannot load.";
         return;
    }

    const today = new Date();
    const dayIndex = getDayIndex(today);
    
    // Load today's puzzle
    const puzzleIndex = dayIndex % allPuzzlesData.length;
    currentPuzzle = allPuzzlesData[puzzleIndex];

    renderPuzzle(currentPuzzle);
    renderChances(); 
}

// --- 5. Rendering and UI Handlers ---

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
