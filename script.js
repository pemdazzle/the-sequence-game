// ===== Sequence Game Logic =====

// --- Constants and Puzzle Data ---
const LAUNCH_DATE = new Date('2025-10-01');
const MAX_GUESSES = 3;

// TEMPORARY test puzzle
const TEST_PUZZLE_DATA = [
  {
    puzzle_id: 1,
    rule_type: "Interwoven",
    sequence_display: [10, 189, 17, 567],
    correct_answer: 25,
    options_pool: [
      { value: 25, feedback: "CORRECT" },
      { value: 746, feedback: "RULE_MATCH" },
      { value: 106, feedback: "NO_MATCH" },
      { value: 1117, feedback: "NO_MATCH" },
      { value: 24, feedback: "NO_MATCH" },
      { value: -1, feedback: "NO_MATCH" }
    ]
  }
];

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

const themeToggle = document.getElementById('theme-toggle');

let currentPuzzle = null;
let guesses = [];

// --- Tutorial Functions ---
function showTutorial() { tutorialModal.style.display = 'flex'; }
function closeTutorial() { tutorialModal.style.display = 'none'; localStorage.setItem('hasSeenTutorial','true'); }
tutorialNextButton.addEventListener('click', closeTutorial);
rulesIcon.addEventListener('click', showTutorial);

// --- Daily Puzzle Loader ---
function loadDailyPuzzle() {
  if (!localStorage.getItem('hasSeenTutorial')) showTutorial();

  const allPuzzles = TEST_PUZZLE_DATA; // Use test data for now
  const today = new Date();
  const dayIndex = Math.floor((today - LAUNCH_DATE)/(1000*60*60*24));
  currentPuzzle = allPuzzles[dayIndex % allPuzzles.length];

  renderPuzzle(currentPuzzle);
  renderChances();
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

  messageEl.textContent = '';
  guessTarget.textContent = '?';
  guessTarget.className = 'tile guess-target';
  guesses = [];
  renderChances();
}

// --- Render Chances ---
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

// --- Handle Guess Submission ---
function handleSubmit(e) {
  if (guesses.length >= MAX_GUESSES) return;
  const value = parseInt(e.currentTarget.dataset.value);
  const optionObj = currentPuzzle.options_pool.find(opt => opt.value === value);
  const feedback = optionObj ? optionObj.feedback : 'NO_MATCH';

  guesses.push({value, feedback});
  renderChances();

  e.currentTarget.classList.remove('feedback-grey','feedback-gold','feedback-green');
  e.currentTarget.classList.add(`feedback-${feedback.toLowerCase()}`);
  e.currentTarget.removeEventListener('click', handleSubmit);

  // Update message & target tile
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
  messageEl.textContent = `💡 Hint: One possible correct number is ${hintOption.value}`;
});

giveUpIcon.addEventListener('click', () => {
  messageEl.textContent = `🏳️ You gave up! Correct answer: ${currentPuzzle.correct_answer}`;
  guessTarget.textContent = currentPuzzle.correct_answer;
  guessTarget.classList.add('feedback-grey');
  disableOptions();
});

// --- Theme Toggle ---
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// --- Placeholder icons ---
archiveIcon.addEventListener('click', () => alert('Archivist / Past Games coming soon!'));
settingsIcon.addEventListener('click', () => alert('Settings coming soon!'));

// --- Init Game ---
loadDailyPuzzle();
