/**
 * Team Page JavaScript
 * 
 * Handles team management including viewing Pokemon,
 * reviving fainted Pokemon, and replacing Pokemon.
 */

// ==========================================
// DOM Elements
// ==========================================
const teamElements = {
    coinsDisplay: null,
    coinsAmount: null,
    teamGrid: null,
    healAllBtn: null,
    toast: null
};

// Current team data
let currentTeam = [];

// ==========================================
// Initialization
// ==========================================

/**
 * Initializes the team page.
 */
async function initTeam() {
    cacheTeamElements();
    updateCoinsDisplay();
    setupTeamEventListeners();
    await loadTeamData();
    
    console.log('Team page initialized!');
}

/**
 * Caches DOM elements for the team page.
 */
function cacheTeamElements() {
    teamElements.coinsDisplay = document.getElementById('coins-display');
    teamElements.coinsAmount = document.getElementById('coins-amount');
    teamElements.teamGrid = document.getElementById('team-grid');
    teamElements.healAllBtn = document.getElementById('heal-all-btn');
    teamElements.toast = document.getElementById('toast');
    
    // Update heal all button cost from COSTS constant
    const healAllCost = document.getElementById('heal-all-cost');
    if (healAllCost) {
        healAllCost.textContent = COSTS.HEAL_ALL;
    }
}

/**
 * Sets up event listeners.
 */
function setupTeamEventListeners() {
    // Heal All button
    teamElements.healAllBtn.addEventListener('click', handleHealAll);
    
    // Team grid event delegation
    teamElements.teamGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const card = btn.closest('.team-pokemon-card');
        if (!card) return;
        
        const index = parseInt(card.dataset.index, 10);
        
        if (btn.classList.contains('btn-revive')) {
            handleRevive(index);
        } else if (btn.classList.contains('btn-replace')) {
            handleReplace(index);
        }
    });
}

/**
 * Loads team data from storage or shows empty state.
 */
async function loadTeamData() {
    const savedTeam = loadTeam();
    
    if (savedTeam && savedTeam.length > 0) {
        currentTeam = savedTeam;
        renderTeam();
    } else {
        // No team yet - show message to go battle
        renderEmptyTeam();
    }
}

// ==========================================
// Event Handlers
// ==========================================

/**
 * Handles reviving a fainted Pokemon.
 * @param {number} index - Index of Pokemon to revive
 */
function handleRevive(index) {
    const pokemon = currentTeam[index];
    
    if (!pokemon || pokemon.hp > 0) {
        showToast('This Pokemon is not fainted!', 'error');
        return;
    }
    
    if (!canAfford(COSTS.REVIVE)) {
        showToast(`Not enough coins! Need ${COSTS.REVIVE} 🪙`, 'error');
        return;
    }
    
    // Spend coins and revive using shared function
    spendCoins(COSTS.REVIVE);
    const revivedPokemon = revivePokemon(index);
    
    // Sync local state
    if (revivedPokemon) {
        currentTeam[index] = revivedPokemon;
    }
    
    // Update UI
    updateCoinsDisplay();
    renderTeam();
    showToast(`${pokemon.name} has been revived!`, 'success');
}

/**
 * Handles replacing a Pokemon with a new random one.
 * @param {number} index - Index of Pokemon to replace
 */
async function handleReplace(index) {
    if (!canAfford(COSTS.NEW_POKEMON)) {
        showToast(`Not enough coins! Need ${COSTS.NEW_POKEMON} 🪙`, 'error');
        return;
    }
    
    const oldPokemon = currentTeam[index];
    
    // Show loading state
    setCardLoading(index, true);
    
    try {
        // Spend coins
        spendCoins(COSTS.NEW_POKEMON);
        updateCoinsDisplay();
        
        // Fetch new Pokemon
        const newPokemon = await fetchRandomPokemon();
        
        // Update team
        currentTeam[index] = newPokemon;
        saveTeam(currentTeam);
        
        // Update UI
        renderTeam();
        showToast(`Replaced ${oldPokemon.name} with ${newPokemon.name}!`, 'success');
    } catch (error) {
        console.error('Failed to fetch new Pokemon:', error);
        // Refund coins
        addCoins(COSTS.NEW_POKEMON);
        updateCoinsDisplay();
        showToast('Failed to get new Pokemon. Coins refunded.', 'error');
        setCardLoading(index, false);
    }
}

/**
 * Handles healing all Pokemon.
 */
function handleHealAll() {
    // Check if any Pokemon need healing
    const needsHealing = currentTeam.some(p => p.hp < p.maxHp);
    
    if (!needsHealing) {
        showToast('All Pokemon are already at full health!', 'info');
        return;
    }
    
    if (!canAfford(COSTS.HEAL_ALL)) {
        showToast(`Not enough coins! Need ${COSTS.HEAL_ALL} 🪙`, 'error');
        return;
    }
    
    // Spend coins and heal using shared function
    spendCoins(COSTS.HEAL_ALL);
    healAllPokemon();
    
    // Sync local state by reloading from storage
    currentTeam = loadTeam();
    
    // Update UI
    updateCoinsDisplay();
    renderTeam();
    showToast('All Pokemon have been healed!', 'success');
}

// ==========================================
// Rendering
// ==========================================

/**
 * Renders the team grid using template functions.
 */
function renderTeam() {
    teamElements.teamGrid.innerHTML = currentTeam
        .map((pokemon, index) => createTeamCardTemplate(pokemon, index, COSTS))
        .join('');
}

/**
 * Renders empty team state using template function.
 */
function renderEmptyTeam() {
    teamElements.teamGrid.innerHTML = createEmptyTeamTemplate();
}

/**
 * Sets loading state on a card.
 * @param {number} index - Card index
 * @param {boolean} loading - Whether to show loading
 */
function setCardLoading(index, loading) {
    const cards = teamElements.teamGrid.querySelectorAll('.team-pokemon-card');
    const card = cards[index];
    
    if (!card) return;
    
    if (loading) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        card.style.position = 'relative';
        card.appendChild(overlay);
    } else {
        const overlay = card.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
    }
}

// ==========================================
// UI Updates
// ==========================================

/**
 * Updates the coins display.
 */
function updateCoinsDisplay() {
    const coins = getCoins();
    teamElements.coinsAmount.textContent = formatNumber(coins);
}

/**
 * Shows a toast notification.
 * @param {string} message - Message to show
 * @param {string} type - 'success', 'error', or 'info'
 */
function showToast(message, type = 'info') {
    const toast = teamElements.toast;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// Start when DOM is ready
// ==========================================
document.addEventListener('DOMContentLoaded', initTeam);

// Add to stresst