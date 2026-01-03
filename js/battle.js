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
    isLoading: true,
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
    const isFainted = pokemon.hp <= 0;
    const spriteContent = pokemon.sprite 
        ? `<img src="${pokemon.sprite}" alt="${pokemon.name}" class="card-sprite-img ${isFainted ? 'fainted' : ''}">`
        : '<div class="sprite-placeholder small">?</div>';
    
    let status = 'Ready';
    let statusClass = '';
    
    if (isFainted) {
        status = 'Fainted';
        statusClass = 'fainted';
    } else if (isActive) {
        status = 'Active';
        statusClass = 'active';
    }
    
    return `
        <div class="pokemon-card ${isActive ? 'active' : ''} ${isFainted ? 'fainted' : ''}" data-slot="${slot}">
            <div class="card-sprite">
                ${spriteContent}
            </div>
            <div class="card-info">
                <span class="card-name">${pokemon.name}</span>
                <div class="mini-health-bar">
                    <div class="health-fill" style="width: ${hpPercent}%"></div>
                </div>
            </div>
            <div class="card-status ${statusClass}">${status}</div>
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
    
    // Determine health bar color class based on HP percentage
    let healthClass = '';
    if (hpPercent <= 25) {
        healthClass = 'health-low';
    } else if (hpPercent <= 50) {
        healthClass = 'health-mid';
    }
    
    const infoSection = `
        <div class="pokemon-info">
            <span class="pokemon-name">${pokemon.name}</span>
            <div class="health-bar">
                <div class="health-fill ${healthClass}" style="width: ${hpPercent}%"></div>
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

/**
 * Creates HTML for a loading placeholder card.
 * @returns {string} HTML string for loading card
 */
function createLoadingCard() {
    return `
        <div class="pokemon-card loading">
            <div class="card-sprite">
                <div class="sprite-placeholder small loading-pulse">...</div>
            </div>
            <div class="card-info">
                <span class="card-name">Loading...</span>
                <div class="mini-health-bar">
                    <div class="health-fill" style="width: 100%"></div>
                </div>
            </div>
            <div class="card-status">Please wait</div>
        </div>
    `;
}

// ==========================================
// Initialization
// ==========================================

/**
 * Initializes the battle page.
 */
async function initBattle() {
    cacheBattleElements();
    loadUserData();
    setupBattleEventListeners();
    
    // Show loading state
    renderBattle();
    showBattleMessage('Assembling your team...');
    setButtonsEnabled(false);
    
    // Fetch Pokemon from API
    await loadPokemon();
    
    updateBattleUI();
    console.log('Pokemon Battle game initialized!');
}

/**
 * Loads Pokemon from the API for player team and enemy.
 */
async function loadPokemon() {
    try {
        // Fetch player team and enemy in parallel
        const [team, enemy] = await Promise.all([
            fetchRandomTeam(3),
            fetchRandomPokemon()
        ]);
        
        // Update game state
        gameState.playerTeam = team;
        gameState.enemyPokemon = enemy;
        gameState.isLoading = false;
        
        // Re-render with real Pokemon
        renderBattle();
        setButtonsEnabled(true);
        
        const teamNames = team.map(p => p.name).join(', ');
        showBattleMessage(`Your team: ${teamNames}! Battle against ${enemy.name}!`);
        
        console.log('Pokemon loaded:', { team, enemy });
    } catch (error) {
        console.error('Failed to load Pokemon:', error);
        showBattleMessage('Failed to load Pokemon. Please refresh the page.');
        gameState.isLoading = false;
    }
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
    battleElements.userBadge = document.getElementById('user-badge');
}

/**
 * Sets up event listeners for battle interactions.
 */
function setupBattleEventListeners() {
    // Attack button
    battleElements.attackBtn.addEventListener('click', handleAttack);
    
    // Team Pokemon cards (using event delegation)
    battleElements.playerTeam.addEventListener('click', (e) => {
        const card = e.target.closest('.pokemon-card');
        if (card && !gameState.isLoading) {
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
    if (gameState.isLoading) return;
    
    showBattleMessage('Attack! (Battle logic coming soon...)');
    console.log('Attack button clicked');
}

/**
 * Handles selecting a Pokemon from the team.
 * @param {number} slot - The slot index of the selected Pokemon (0-2)
 */
function handlePokemonSelect(slot) {
    const pokemon = gameState.playerTeam[slot];
    
    // Can't select fainted Pokemon
    if (pokemon.hp <= 0) {
        showBattleMessage(`${pokemon.name} has fainted and can't battle!`);
        return;
    }
    
    if (slot === gameState.activePlayerPokemon) {
        showBattleMessage(`${pokemon.name} is already in battle!`);
        return;
    }
    
    // Update active Pokemon
    const previousPokemon = gameState.playerTeam[gameState.activePlayerPokemon];
    gameState.activePlayerPokemon = slot;
    
    // Re-render battle to update active Pokemon in arena and team
    renderBattle();
    
    showBattleMessage(`Go, ${pokemon.name}! ${previousPokemon.name}, come back!`);
    console.log(`Switched from ${previousPokemon.name} to ${pokemon.name}`);
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
    if (gameState.isLoading) {
        // Show loading cards
        battleElements.playerTeam.innerHTML = 
            createLoadingCard() + createLoadingCard() + createLoadingCard();
        return;
    }
    
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

/**
 * Enables or disables the action buttons.
 * @param {boolean} enabled - Whether buttons should be enabled
 */
function setButtonsEnabled(enabled) {
    battleElements.attackBtn.disabled = !enabled;
    
    if (enabled) {
        battleElements.attackBtn.classList.remove('disabled');
    } else {
        battleElements.attackBtn.classList.add('disabled');
    }
}

// ==========================================
// Start when DOM is ready
// ==========================================
document.addEventListener('DOMContentLoaded', initBattle);
