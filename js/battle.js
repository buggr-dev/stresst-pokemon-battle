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
    isBattling: false,
    playerTeam: [
        { id: 1, name: '???', hp: 100, maxHp: 100, sprite: null },
        { id: 2, name: '???', hp: 100, maxHp: 100, sprite: null },
        { id: 3, name: '???', hp: 100, maxHp: 100, sprite: null }
    ],
    activePlayerPokemon: 0,
    enemyPokemon: { name: '???', hp: 100, maxHp: 100, sprite: null }
};

// ==========================================
// Battle Sequence
// ==========================================

/**
 * Runs the full battle sequence until one Pokemon faints.
 * Executes turn by turn with visual updates.
 */
async function runBattleSequence() {
    const playerPokemon = gameState.playerTeam[gameState.activePlayerPokemon];
    const enemyPokemon = gameState.enemyPokemon;
    
    gameState.isBattling = true;
    setButtonsEnabled(false);
    
    let turnCount = 0;
    const maxTurns = 50; // Safety limit
    
    // Battle continues until one Pokemon faints
    while (playerPokemon.hp > 0 && enemyPokemon.hp > 0 && turnCount < maxTurns) {
        turnCount++;
        
        // Determine who attacks first based on strength (with some randomness)
        const playerGoesFirst = determineTurnOrder(playerPokemon, enemyPokemon);
        
        if (playerGoesFirst) {
            // Player attacks first
            const playerResult = executeAttack(playerPokemon, enemyPokemon, true);
            await showAttackResult(playerResult);
            renderBattle();
            
            if (enemyPokemon.hp <= 0) break;
            
            await delay(800);
            
            // Enemy attacks
            const enemyResult = executeAttack(enemyPokemon, playerPokemon, false);
            await showAttackResult(enemyResult);
            renderBattle();
            saveTeam(gameState.playerTeam);
        } else {
            // Enemy attacks first
            const enemyResult = executeAttack(enemyPokemon, playerPokemon, false);
            await showAttackResult(enemyResult);
            renderBattle();
            saveTeam(gameState.playerTeam);
            
            if (playerPokemon.hp <= 0) break;
            
            await delay(800);
            
            // Player attacks
            const playerResult = executeAttack(playerPokemon, enemyPokemon, true);
            await showAttackResult(playerResult);
            renderBattle();
        }
        
        await delay(600);
    }
    
    // Battle ended - determine outcome
    await delay(500);
    
    if (enemyPokemon.hp <= 0) {
        await handleBattleWin();
    } else if (playerPokemon.hp <= 0) {
        await handlePokemonFainted();
    }
    
    gameState.isBattling = false;
}

/**
 * Displays the result of an attack with animation delay.
 * @param {Object} result - Attack result object
 */
async function showAttackResult(result) {
    let message = `${result.attacker} attacks ${result.defender} for ${result.damage} damage!`;
    
    if (result.effectivenessMsg) {
        message += ` ${result.effectivenessMsg}`;
    }
    
    if (result.defenderFainted) {
        message += ` ${result.defender} fainted!`;
    }
    
    showBattleMessage(message);
    await delay(1200);
}

/**
 * Handles winning a battle against the enemy.
 */
async function handleBattleWin() {
    gameState.wins++;
    gameState.round++;
    
    // Save battle progress
    saveBattleProgress({ round: gameState.round, wins: gameState.wins });
    
    // Record win and add coins
    recordBattleResult(true);
    addCoins(REWARDS.DEFEAT_POKEMON);
    
    const playerPokemon = gameState.playerTeam[gameState.activePlayerPokemon];
    showBattleMessage(`${playerPokemon.name} defeated ${gameState.enemyPokemon.name}! You earned ${REWARDS.WIN_BATTLE + REWARDS.DEFEAT_POKEMON} coins!`);
    
    updateBattleUI();
    
    await delay(2000);
    
    // Fetch new enemy
    showBattleMessage('A new challenger approaches...');
    setButtonsEnabled(false);
    
    try {
        const newEnemy = await fetchRandomPokemon();
        gameState.enemyPokemon = newEnemy;
        saveEnemy(newEnemy);
        renderBattle();
        showBattleMessage(`A wild ${newEnemy.name} appeared! Ready to battle?`);
        setButtonsEnabled(true);
    } catch (error) {
        console.error('Failed to fetch new enemy:', error);
        showBattleMessage('Failed to find a new challenger. Please refresh.');
    }
}

/**
 * Handles when the player's active Pokemon faints.
 */
async function handlePokemonFainted() {
    const faintedPokemon = gameState.playerTeam[gameState.activePlayerPokemon];
    saveTeam(gameState.playerTeam);
    
    // Check if any Pokemon are still alive
    const alivePokemon = gameState.playerTeam.findIndex(p => p.hp > 0);
    
    if (alivePokemon >= 0) {
        // Auto-switch to next available Pokemon
        gameState.activePlayerPokemon = alivePokemon;
        const nextPokemon = gameState.playerTeam[alivePokemon];
        
        showBattleMessage(`${faintedPokemon.name} fainted! Go, ${nextPokemon.name}!`);
        renderBattle();
        
        await delay(1500);
        setButtonsEnabled(true);
        showBattleMessage(`${nextPokemon.name} is ready to battle!`);
    } else {
        // All Pokemon fainted - game over
        recordBattleResult(false);
        showBattleMessage(`All your Pokemon have fainted! Your streak of ${gameState.wins} wins has ended.`);
        gameState.wins = 0;
        gameState.round = 1;
        
        // Reset battle progress
        resetBattleProgress();
        updateBattleUI();
        
        await delay(2000);
        showBattleMessage('Visit the Team page to revive your Pokemon, or refresh for a new team.');
    }
}

/**
 * Utility function for async delays.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets type effectiveness indicator HTML for a Pokemon against the enemy.
 * @param {Object} pokemon - The player's Pokemon
 * @param {Object} enemy - The enemy Pokemon
 * @returns {string} HTML string for the indicator (or empty string if neutral)
 */
function getEffectivenessIndicator(pokemon, enemy) {
    if (!pokemon || !enemy) return '';
    
    const playerTypes = pokemon.types || ['normal'];
    const enemyTypes = enemy.types || ['normal'];
    
    // Check player's effectiveness against enemy
    const playerVsEnemy = getTypeEffectiveness(playerTypes, enemyTypes);
    // Check enemy's effectiveness against player
    const enemyVsPlayer = getTypeEffectiveness(enemyTypes, playerTypes);
    
    // Determine overall matchup
    if (playerVsEnemy >= 2 && enemyVsPlayer < 2) {
        // Strong advantage
        return '<span class="matchup-indicator matchup-advantage" title="Super effective!">⚔️</span>';
    } else if (playerVsEnemy >= 2 && enemyVsPlayer >= 2) {
        // Both super effective
        return '<span class="matchup-indicator matchup-neutral" title="Both super effective">⚡</span>';
    } else if (playerVsEnemy < 1 || enemyVsPlayer >= 2) {
        // Disadvantage
        return '<span class="matchup-indicator matchup-disadvantage" title="Not very effective...">🛡️</span>';
    } else if (playerVsEnemy >= 1.5) {
        // Slight advantage
        return '<span class="matchup-indicator matchup-advantage" title="Effective">⚔️</span>';
    }
    
    return '';
}

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
    resetBtn: null,
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
    
    // Get strength tier
    const strength = pokemon.strength || 50;
    const tier = getStrengthTier(strength);
    
    // Get types
    const types = pokemon.types || [];
    const typeBadges = types.map(type => 
        `<span class="type-badge ${type}">${type}</span>`
    ).join('');
    
    // Get matchup indicator against current enemy
    const matchupIndicator = getEffectivenessIndicator(pokemon, gameState.enemyPokemon);
    
    return `
        <div class="pokemon-card ${isActive ? 'active' : ''} ${isFainted ? 'fainted' : ''}" data-slot="${slot}">
            ${matchupIndicator}
            <div class="card-sprite">
                ${spriteContent}
            </div>
            <div class="card-info">
                <span class="card-name">${pokemon.name}</span>
                <div class="card-types">${typeBadges}</div>
                <div class="mini-health-bar">
                    <div class="health-fill" style="width: ${hpPercent}%"></div>
                </div>
                <div class="card-stats">
                    <span class="card-stat"><span class="card-stat-value">${pokemon.attack || '?'}</span> ATK</span>
                    <span class="card-stat"><span class="card-stat-value">${pokemon.maxHp}</span> HP</span>
                    <span class="card-stat"><span class="strength-badge ${tier.class}">${tier.name}</span> STR</span>
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
    
    // Get strength tier
    const strength = pokemon.strength || 50;
    const tier = getStrengthTier(strength);
    
    // Get types
    const types = pokemon.types || [];
    const typeBadges = types.map(type => 
        `<span class="type-badge ${type}">${type}</span>`
    ).join('');
    
    // Get matchup indicator (only for player's Pokemon)
    const matchupIndicator = !isEnemy 
        ? getEffectivenessIndicator(pokemon, gameState.enemyPokemon)
        : '';
    
    const infoSection = `
        <div class="pokemon-info">
            <div class="pokemon-name-row">
                <span class="pokemon-name">${pokemon.name}</span>
                ${matchupIndicator}
            </div>
            <div class="battle-types">${typeBadges}</div>
            <div class="health-bar">
                <div class="health-fill ${healthClass}" style="width: ${hpPercent}%"></div>
            </div>
            <span class="health-text">${pokemon.hp} / ${pokemon.maxHp}</span>
            <div class="battle-stats">
                <div class="battle-stat">
                    <span class="battle-stat-value">${pokemon.attack || '?'}</span>
                    <span class="battle-stat-label">ATK</span>
                </div>
                <div class="battle-stat">
                    <span class="battle-stat-value">${pokemon.maxHp}</span>
                    <span class="battle-stat-label">HP</span>
                </div>
                <div class="battle-stat">
                    <span class="battle-stat-value strength-badge ${tier.class}">${tier.name}</span>
                    <span class="battle-stat-label">STR</span>
                </div>
            </div>
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
 * Uses saved team if available, otherwise fetches new team.
 */
async function loadPokemon() {
    try {
        // Check for existing saved team
        const savedTeam = loadTeam();
        let team;
        let isNewTeam = false;
        
        if (savedTeam && savedTeam.length === 3) {
            // Use saved team
            team = savedTeam;
            showBattleMessage('Loading your team...');
        } else {
            // Fetch new team
            isNewTeam = true;
            team = await fetchRandomTeam(3);
            // Save the new team
            saveTeam(team);
        }
        
        // Check for existing saved enemy, otherwise fetch new one
        let enemy = loadEnemy();
        let isNewEnemy = false;
        
        if (!enemy) {
            isNewEnemy = true;
            enemy = await fetchRandomPokemon();
            saveEnemy(enemy);
        }
        
        // Update game state
        gameState.playerTeam = team;
        gameState.enemyPokemon = enemy;
        gameState.isLoading = false;
        
        // Find first non-fainted Pokemon to be active
        const activeIndex = team.findIndex(p => p.hp > 0);
        gameState.activePlayerPokemon = activeIndex >= 0 ? activeIndex : 0;
        
        // Re-render with real Pokemon
        renderBattle();
        setButtonsEnabled(true);
        
        // Show appropriate message
        if (isNewTeam) {
            const teamNames = team.map(p => p.name).join(', ');
            showBattleMessage(`Your new team: ${teamNames}! Battle against ${enemy.name}!`);
        } else {
            const activePokemon = team[gameState.activePlayerPokemon];
            showBattleMessage(`Go, ${activePokemon.name}! ${isNewEnemy ? 'A wild' : 'Your opponent'} ${enemy.name} ${isNewEnemy ? 'appeared' : 'awaits'}!`);
        }
        
        console.log('Pokemon loaded:', { team, enemy, isNewTeam, isNewEnemy });
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
    battleElements.resetBtn = document.getElementById('reset-btn');
    battleElements.userBadge = document.getElementById('user-badge');
}

/**
 * Sets up event listeners for battle interactions.
 */
function setupBattleEventListeners() {
    // Attack button
    battleElements.attackBtn.addEventListener('click', handleAttack);
    
    // Reset button
    battleElements.resetBtn.addEventListener('click', handleReset);
    
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
    
    // Load battle progress (round and wins)
    const progress = loadBattleProgress();
    gameState.round = progress.round;
    gameState.wins = progress.wins;
}

// ==========================================
// Event Handlers
// ==========================================

/**
 * Handles the attack action.
 * Initiates the battle sequence if not already battling.
 */
function handleAttack() {
    if (gameState.isLoading || gameState.isBattling) return;
    
    const playerPokemon = gameState.playerTeam[gameState.activePlayerPokemon];
    
    // Check if active Pokemon can battle
    if (playerPokemon.hp <= 0) {
        showBattleMessage(`${playerPokemon.name} has fainted! Select another Pokemon.`);
        return;
    }
    
    // Check if all Pokemon are fainted
    const hasAlivePokemon = gameState.playerTeam.some(p => p.hp > 0);
    if (!hasAlivePokemon) {
        showBattleMessage('All your Pokemon have fainted! Visit the Team page to revive them.');
        return;
    }
    
    // Start the battle sequence
    runBattleSequence();
}

/**
 * Handles selecting a Pokemon from the team.
 * @param {number} slot - The slot index of the selected Pokemon (0-2)
 */
function handlePokemonSelect(slot) {
    // Can't switch during battle
    if (gameState.isBattling) {
        showBattleMessage("Can't switch Pokemon during battle!");
        return;
    }
    
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

/**
 * Handles the reset/start again action.
 * Clears team, resets progress, and fetches new Pokemon.
 */
async function handleReset() {
    if (gameState.isBattling) {
        showBattleMessage("Can't reset during battle!");
        return;
    }
    
    // Confirm reset
    if (!confirm('Are you sure you want to start again? This will reset your team and progress.')) {
        return;
    }
    
    // Reset game state
    gameState.round = 1;
    gameState.wins = 0;
    gameState.isLoading = true;
    gameState.activePlayerPokemon = 0;
    
    // Clear saved data
    clearTeam();
    clearEnemy();
    resetBattleProgress();
    
    // Update UI
    updateBattleUI();
    renderBattle();
    showBattleMessage('Starting fresh! Assembling a new team...');
    setButtonsEnabled(false);
    
    // Fetch new team and enemy
    try {
        const team = await fetchRandomTeam(3);
        const enemy = await fetchRandomPokemon();
        
        // Update game state
        gameState.playerTeam = team;
        gameState.enemyPokemon = enemy;
        gameState.isLoading = false;
        
        // Save new team
        saveTeam(team);
        
        // Re-render
        renderBattle();
        setButtonsEnabled(true);
        
        const teamNames = team.map(p => p.name).join(', ');
        showBattleMessage(`New adventure begins! Your team: ${teamNames}. Battle against ${enemy.name}!`);
    } catch (error) {
        console.error('Failed to reset game:', error);
        showBattleMessage('Failed to start new game. Please refresh the page.');
        gameState.isLoading = false;
    }
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

// Add to stresst