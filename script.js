// --- script.js: The Finalized Game Logic ---

// 1. Initial Setup and Constants
const LAUNCH_DATE = new Date('2025-10-01');
const PUZZLE_FILE = './sequence_puzzles_600.json';
let allPuzzlesData = []; // Store the full list of puzzles
let currentPuzzle = null;
let guesses = [];
const MAX_GUESSES = 3;

// *** GUARANTEED FIX: Hardcoded puzzle data to ensure rendering always works ***
// This data will load if the fetch() call fails, preventing the '0s' error.
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
    tutorialModal
