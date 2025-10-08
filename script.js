/* ===== Base Reset ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Poppins", sans-serif;
}

body {
    background: #f0f2f5;
    color: #333;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    padding: 2rem 1rem;
}

/* ===== Header & Icons ===== */
#global-header {
    text-align: center;
    margin-bottom: 1rem;
}

#global-header h1 {
    font-size: 2.2rem;
    color: #3a3a3a;
}

#tagline {
    color: #555;
    margin-top: 0.5rem;
    font-size: 0.9rem;
}

#icon-bar {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
}

.icon {
    cursor: pointer;
    transition: color 0.2s;
    background: none;
    border: none;
    color: #555;
}

.icon:hover {
    color: #4a90e2;
}

/* ===== Game Container ===== */
#game-container {
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    text-align: center;
    position: relative;
    margin-top: 3rem; 
}

/* ===== Step Labels ===== */
.step-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #777;
    margin-bottom: 0.75rem;
}

/* ===== Sequence & Options Tiles ===== */
.sequence, .options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 1.5rem;
}

.options {
    grid-template-columns: repeat(3, 1fr);
}

.tile {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    background-color: #e3e8ef;
    color: #333;
    font-weight: 600;
    font-size: 1.2rem;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    position: relative;
}

.tile:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

#guess-target {
    background-color: #333;
    color: white;
    cursor: default;
}

/* For sequence tiles that can be selected as distractors */
.sequence-tile.deactivated {
    opacity: 0.4;
    background-color: #ccc;
    transform: scale(0.95);
    border: 2px dashed #888;
}

/* ===== Tile Flip Animation ===== */
.option-tile {
    transform-style: preserve-3d;
    transition: transform 0.6s;
}

.option-tile.is-flipped {
    transform: rotateY(180deg);
}

/* Feedback Colors - applied to flipped tiles */
.feedback-green { background-color: #6aaa64; color: white; border-color: #6aaa64; }
.feedback-gold { background-color: #c9b458; color: white; border-color: #c9b458; }
.feedback-grey { background-color: #787c7e; color: white; border-color: #787c7e; }


/* ===== Chance Indicators ===== */
#chance-indicators {
    position: absolute;
    top: -2.5rem;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 10px;
    font-size: 1.5rem;
}

.lightbulb-on { color: gold; }
.lightbulb-off { color: #ccc; }

/* ===== Action Icons ===== */
#action-area {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
    padding: 0 2rem;
}

.action-icon {
    font-size: 1.8rem;
}

.flag { color: #e74c3c; }

/* ===== Message Area ===== */
#message {
    margin-top: 1rem;
    min-height: 1.5rem;
    font-weight: 600;
    font-size: 1rem;
}

/* ===== Modal / Tutorial ===== */
.modal {
    display: none;
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.6);
    justify-content: center;
    align-items: center;
}

.help-panel {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 550px;
    width: 90%;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
}

.help-panel h2 { text-align: center; margin-bottom: 1.5rem; }

.help-section {
    display: flex;
    align-items: flex-start;
    background: #f0f2f5;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.help-icon { font-size: 1.5rem; margin-right: 1rem; color: #4a90e2; }
.help-icon.salmon { color: #e27d60; }
.help-icon.green { color: #6aaa64; }

.help-text h3 { margin-bottom: 0.25rem; }
.help-text p { font-size: 0.9rem; color: #333; }

.got-it-button {
    margin-top: 1rem;
    background-color: #4a90e2;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    width: 100%;
    cursor: pointer;
    transition: all 0.2s ease;
}

.got-it-button:hover { background-color: #357ABD; }

/* ===== Responsive ===== */
@media (max-width: 600px) {
    .tile { font-size: 1rem; }
    #game-container { padding: 1.5rem 1rem; }
    .options { grid-template-columns: repeat(3, 1fr); }
}

