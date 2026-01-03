/**
 * Battle Page JavaScript
 * 
 * Handles the Pokemon battle gameplay, including attacks,
 * switching Pokemon, and battle flow.
 */

// ==========================================
// Game State
// ==========================================
const gameState = {
    round: 1,
    wins: 0,
    playerTeam: [
        { id: 1, name: '???', hp: 100, maxHp: 100, sprite: null },
        { id: 2, name: '???', hp: 100, maxHp: 100, sprite: null },
        { id: 3, name: '???', hp: 100, maxHp: 100, sprite: null }
    ],
    activePlayerPokemon: 0,
    enemyPokemon: { name: '???', hp: 100, maxHp: 100, sprite: null }
};

// ==========================================
// DOM Elements
// ==========================================
const battleElements = {
    roundCounter: null,
    winCounter: null,
    battleMessage: null,
    playerTeam: null,
    playerPokemon: null,
    enemyPokemon: null,
    attackBtn: null,
    switchBtn: null,
    userBadge: null
};

// ==========================================
// Components
// ==========================================

/**
 * Creates HTML for a Pokemon team card.
 * @param {Object} pokemon - Pokemon data object
 * @param {number} slot - Team slot index (0-2)
 * @param {boolean} isActive - Whether this Pokemon is currently active
 * @returns {string} HTML string for the card
 */
function createPokemonCard(pokemon, slot, isActive) {
    const hpPercent = (pokemon.hp / pokemon.maxHp) * 100;
    const spriteContent = pokemon.sprite 
        ? `<img src="${pokemon.sprite}" alt="${pokemon.name}" class="card-sprite-img">`
        : '<div class="sprite-placeholder small">?</div>';
    
    return `
        <div class="pokemon-card ${isActive ? 'active' : ''}" data-slot="${slot}">
            <div class="card-sprite">
                ${spriteContent}
            </div>
            <div class="card-info">
                <span class="card-name">${pokemon.name}</span>
                <div class="mini-health-bar">
                    <div class="health-fill" style="width: ${hpPercent}%"></div>
                </div>
            </div>
            <div class="card-status ${isActive ? 'active' : ''}">${isActive ? 'Active' : 'Ready'}</div>
        </div>
    `;
}

/**
 * Creates HTML for the battle Pokemon display (player or enemy side).
 * @param {Object} pokemon - Pokemon data object
 * @param {boolean} isEnemy - Whether this is the enemy Pokemon
 * @returns {string} HTML string for the battle card
 */
function createBattlePokemonCard(pokemon, isEnemy = false) {
    const hpPercent = (pokemon.hp / pokemon.maxHp) * 100;
    const spriteContent = pokemon.sprite 
        ? `<img src="${pokemon.sprite}" alt="${pokemon.name}" class="battle-sprite-img">`
        : '<div class="sprite-placeholder">?</div>';
    
    const infoSection = `
        <div class="pokemon-info">
            <span class="pokemon-name">${pokemon.name}</span>
            <div class="health-bar">
                <div class="health-fill" style="width: ${hpPercent}%"></div>
            </div>
            <span class="health-text">${pokemon.hp} / ${pokemon.maxHp}</span>
        </div>
    `;
    
    const spriteSection = `
        <div class="pokemon-sprite">
            ${spriteContent}
        </div>
    `;
    
    // Enemy shows info first, player shows sprite first
    const content = isEnemy 
        ? infoSection + spriteSection 
        : spriteSection + infoSection;
    
    return `
        <div class="pokemon-battle-card ${isEnemy ? 'enemy' : 'player'}">
            ${content}
        </div>
    `;
}

// ==========================================
// Initialization
// ==========================================

/**
 * Initializes the battle page.
 */
function initBattle() {
    cacheBattleElements();
    loadUserData();
    renderBattle();
    setupBattleEventListeners();
    updateBattleUI();
    
    console.log('Pokemon Battle game initialized!');
}

/**
 * Caches frequently used DOM elements.
 */
function cacheBattleElements() {
    battleElements.roundCounter = document.getElementById('round-counter');
    battleElements.winCounter = document.getElementById('win-counter');
    battleElements.battleMessage = document.getElementById('battle-message');
    battleElements.playerTeam = document.getElementById('player-team');
    battleElements.playerPokemon = document.getElementById('player-pokemon');
    battleElements.enemyPokemon = document.getElementById('enemy-pokemon');
    battleElements.attackBtn = document.querySelector('.btn-attack');
    battleElements.switchBtn = document.querySelector('.btn-switch');
    battleElements.userBadge = document.getElementById('user-badge');
}

/**
 * Sets up event listeners for battle interactions.
 */
function setupBattleEventListeners() {
    // Attack button
    battleElements.attackBtn.addEventListener('click', handleAttack);
    
    // Switch button
    battleElements.switchBtn.addEventListener('click', handleSwitch);
    
    // Team Pokemon cards (using event delegation)
    battleElements.playerTeam.addEventListener('click', (e) => {
        const card = e.target.closest('.pokemon-card');
        if (card) {
            const slot = parseInt(card.dataset.slot, 10);
            handlePokemonSelect(slot);
        }
    });
}

/**
 * Loads user profile data and updates the UI.
 */
function loadUserData() {
    const profile = getUserProfile();
    
    // Update user badge in header
    if (battleElements.userBadge) {
        battleElements.userBadge.innerHTML = `
            <div class="user-avatar">${profile.avatar}</div>
            <span class="user-name">${profile.username}</span>
        `;
    }
    
    // Load current streak as wins
    gameState.wins = profile.stats.currentStreak;
}

// ==========================================
// Event Handlers
// ==========================================

/**
 * Handles the attack action.
 * TODO: Implement actual battle logic with damage calculation
 */
function handleAttack() {
    showBattleMessage('Attack! (Battle logic coming soon...)');
    console.log('Attack button clicked');
}

/**
 * Handles the switch Pokemon action.
 * TODO: Implement switch logic
 */
function handleSwitch() {
    showBattleMessage('Click on a Pokemon in your team to switch!');
    console.log('Switch button clicked');
}

/**
 * Handles selecting a Pokemon from the team.
 * @param {number} slot - The slot index of the selected Pokemon (0-2)
 */
function handlePokemonSelect(slot) {
    if (slot === gameState.activePlayerPokemon) {
        showBattleMessage('This Pokemon is already in battle!');
        return;
    }
    
    // Update active Pokemon
    const previousActive = gameState.activePlayerPokemon;
    gameState.activePlayerPokemon = slot;
    
    // Re-render battle to update active Pokemon in arena and team
    renderBattle();
    
    showBattleMessage(`Switched to Pokemon ${slot + 1}!`);
    console.log(`Switched from slot ${previousActive} to slot ${slot}`);
}

// ==========================================
// Rendering
// ==========================================

/**
 * Renders the entire battle scene (arena + team).
 */
function renderBattle() {
    renderBattleArena();
    renderTeam();
}

/**
 * Renders the battle arena with player and enemy Pokemon.
 */
function renderBattleArena() {
    const activePokemon = gameState.playerTeam[gameState.activePlayerPokemon];
    
    // Render player's active Pokemon
    battleElements.playerPokemon.innerHTML = createBattlePokemonCard(activePokemon, false);
    
    // Render enemy Pokemon
    battleElements.enemyPokemon.innerHTML = createBattlePokemonCard(gameState.enemyPokemon, true);
}

/**
 * Renders the player's team using the component function.
 */
function renderTeam() {
    const teamHTML = gameState.playerTeam
        .map((pokemon, index) => createPokemonCard(
            pokemon, 
            index, 
            index === gameState.activePlayerPokemon
        ))
        .join('');
    
    battleElements.playerTeam.innerHTML = teamHTML;
}

// ==========================================
// UI Updates
// ==========================================

/**
 * Updates all battle UI elements.
 */
function updateBattleUI() {
    battleElements.roundCounter.textContent = gameState.round;
    battleElements.winCounter.textContent = gameState.wins;
}

/**
 * Displays a message in the battle message box.
 * @param {string} message - The message to display
 */
function showBattleMessage(message) {
    battleElements.battleMessage.textContent = message;
}

// ==========================================
// Start when DOM is ready
// ==========================================
document.addEventListener('DOMContentLoaded', initBattle);
