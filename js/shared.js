/**
 * Shared JavaScript - User Data & Utilities
 * 
 * Manages user profile data that persists across pages using localStorage.
 * This file should be included on all pages before page-specific scripts.
 */

// ==========================================
// Constants
// ==========================================

/** Available avatar icons for user selection */
const AVATAR_OPTIONS = [
    '🎮', '⚡', '🔥', '💧', '🌿',
    '👤', '🎯', '⭐', '🏆', '💎',
    '🐉', '👻', '🦋', '🌙', '☀️'
];

/** Default user profile values */
const DEFAULT_PROFILE = {
    username: 'Trainer',
    avatar: '🎮',
    coins: 500,
    stats: {
        totalBattles: 0,
        totalWins: 0,
        bestStreak: 0,
        currentStreak: 0
    }
};

/** localStorage keys */
const STORAGE_KEY = 'pokemonBattleUser';
const TEAM_STORAGE_KEY = 'pokemonBattleTeam';
const BATTLE_PROGRESS_KEY = 'pokemonBattleProgress';

/** Coin costs for actions */
const COSTS = {
    REVIVE: 50,
    NEW_POKEMON: 100,
    HEAL_ALL: 75
};

/** Coin rewards */
const REWARDS = {
    WIN_BATTLE: 25,
    DEFEAT_POKEMON: 10
};

// ==========================================
// User Data Management
// ==========================================

/**
 * Retrieves user profile from localStorage.
 * Returns default profile if none exists.
 * @returns {Object} User profile object
 */
function getUserProfile() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle any missing fields
            return {
                ...DEFAULT_PROFILE,
                ...parsed,
                stats: {
                    ...DEFAULT_PROFILE.stats,
                    ...(parsed.stats || {})
                }
            };
        }
    } catch (error) {
        console.error('Error reading user profile:', error);
    }
    return { ...DEFAULT_PROFILE };
}

/**
 * Saves user profile to localStorage.
 * @param {Object} profile - User profile object to save
 */
function saveUserProfile(profile) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.error('Error saving user profile:', error);
    }
}

/**
 * Updates specific fields in the user profile.
 * @param {Object} updates - Object containing fields to update
 * @returns {Object} Updated profile
 */
function updateUserProfile(updates) {
    const profile = getUserProfile();
    const updated = {
        ...profile,
        ...updates,
        stats: {
            ...profile.stats,
            ...(updates.stats || {})
        }
    };
    saveUserProfile(updated);
    return updated;
}

/**
 * Resets user stats to default values (keeps username and avatar).
 * @returns {Object} Updated profile with reset stats
 */
function resetUserStats() {
    const profile = getUserProfile();
    profile.stats = { ...DEFAULT_PROFILE.stats };
    saveUserProfile(profile);
    return profile;
}

/**
 * Records a battle result and updates stats accordingly.
 * @param {boolean} won - Whether the player won the battle
 * @returns {Object} Updated profile
 */
function recordBattleResult(won) {
    const profile = getUserProfile();
    
    profile.stats.totalBattles++;
    
    if (won) {
        profile.stats.totalWins++;
        profile.stats.currentStreak++;
        if (profile.stats.currentStreak > profile.stats.bestStreak) {
            profile.stats.bestStreak = profile.stats.currentStreak;
        }
        // Award coins for winning
        profile.coins += REWARDS.WIN_BATTLE;
    } else {
        profile.stats.currentStreak = 0;
    }
    
    saveUserProfile(profile);
    return profile;
}

// ==========================================
// Coins Management
// ==========================================

/**
 * Gets the current coin balance.
 * @returns {number} Current coins
 */
function getCoins() {
    return getUserProfile().coins;
}

/**
 * Adds coins to the user's balance.
 * @param {number} amount - Amount to add
 * @returns {number} New balance
 */
function addCoins(amount) {
    const profile = getUserProfile();
    profile.coins += amount;
    saveUserProfile(profile);
    return profile.coins;
}

/**
 * Spends coins if user has enough.
 * @param {number} amount - Amount to spend
 * @returns {boolean} True if successful, false if insufficient funds
 */
function spendCoins(amount) {
    const profile = getUserProfile();
    if (profile.coins >= amount) {
        profile.coins -= amount;
        saveUserProfile(profile);
        return true;
    }
    return false;
}

/**
 * Checks if user can afford an amount.
 * @param {number} amount - Amount to check
 * @returns {boolean} True if user has enough coins
 */
function canAfford(amount) {
    return getUserProfile().coins >= amount;
}

// ==========================================
// Team Management
// ==========================================

/**
 * Saves the player's team to localStorage.
 * @param {Object[]} team - Array of Pokemon objects
 */
function saveTeam(team) {
    try {
        localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
    } catch (error) {
        console.error('Error saving team:', error);
    }
}

/**
 * Loads the player's team from localStorage.
 * @returns {Object[]|null} Team array or null if not found
 */
function loadTeam() {
    try {
        const stored = localStorage.getItem(TEAM_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading team:', error);
    }
    return null;
}

/**
 * Clears the saved team from localStorage.
 */
function clearTeam() {
    localStorage.removeItem(TEAM_STORAGE_KEY);
}

/**
 * Updates a single Pokemon in the saved team.
 * @param {number} index - Index of Pokemon to update
 * @param {Object} pokemon - Updated Pokemon object
 */
function updateTeamPokemon(index, pokemon) {
    const team = loadTeam();
    if (team && index >= 0 && index < team.length) {
        team[index] = pokemon;
        saveTeam(team);
    }
}

/**
 * Revives a fainted Pokemon (restores HP to max).
 * @param {number} index - Index of Pokemon to revive
 * @returns {Object|null} Revived Pokemon or null if failed
 */
function revivePokemon(index) {
    const team = loadTeam();
    if (team && index >= 0 && index < team.length) {
        const pokemon = team[index];
        if (pokemon.hp <= 0) {
            pokemon.hp = pokemon.maxHp;
            team[index] = pokemon;
            saveTeam(team);
            return pokemon;
        }
    }
    return null;
}

/**
 * Heals all Pokemon in the team to full HP.
 */
function healAllPokemon() {
    const team = loadTeam();
    if (team) {
        team.forEach(pokemon => {
            pokemon.hp = pokemon.maxHp;
        });
        saveTeam(team);
    }
}

// ==========================================
// Battle Progress Management
// ==========================================

/**
 * Saves battle progress to localStorage.
 * @param {Object} progress - Progress object with round and wins
 */
function saveBattleProgress(progress) {
    try {
        localStorage.setItem(BATTLE_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Error saving battle progress:', error);
    }
}

/**
 * Loads battle progress from localStorage.
 * @returns {Object} Progress object with round and wins, or defaults
 */
function loadBattleProgress() {
    try {
        const stored = localStorage.getItem(BATTLE_PROGRESS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading battle progress:', error);
    }
    return { round: 1, wins: 0 };
}

/**
 * Resets battle progress to initial values.
 */
function resetBattleProgress() {
    saveBattleProgress({ round: 1, wins: 0 });
}

// ==========================================
// UI Helpers
// ==========================================

/**
 * Renders the user badge in the header (if element exists).
 * Call this on page load to show the user's avatar and name in the header.
 */
function renderUserBadge() {
    const badgeContainer = document.getElementById('user-badge');
    if (!badgeContainer) return;
    
    const profile = getUserProfile();
    
    badgeContainer.innerHTML = `
        <div class="user-avatar">${profile.avatar}</div>
        <span class="user-name">${profile.username}</span>
    `;
}

/**
 * Renders the avatar selection grid.
 * @param {string} containerId - ID of the container element
 * @param {Function} onSelect - Callback when avatar is selected
 */
function renderAvatarGrid(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const profile = getUserProfile();
    
    container.innerHTML = AVATAR_OPTIONS.map(avatar => `
        <button 
            class="avatar-option ${avatar === profile.avatar ? 'selected' : ''}" 
            data-avatar="${avatar}"
            type="button"
        >
            ${avatar}
        </button>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.avatar-option').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected from all
            container.querySelectorAll('.avatar-option').forEach(b => 
                b.classList.remove('selected')
            );
            // Add selected to clicked
            btn.classList.add('selected');
            // Call callback
            if (onSelect) {
                onSelect(btn.dataset.avatar);
            }
        });
    });
}

/**
 * Formats a number with commas for display.
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Gets the strength tier based on strength score.
 * @param {number} strength - Strength score (1-100)
 * @returns {Object} Object with tier name and CSS class
 */
function getStrengthTier(strength) {
    if (strength >= 80) return { name: 'S', class: 'strength-s' };
    if (strength >= 60) return { name: 'A', class: 'strength-a' };
    if (strength >= 40) return { name: 'B', class: 'strength-b' };
    if (strength >= 20) return { name: 'C', class: 'strength-c' };
    return { name: 'D', class: 'strength-d' };
}

// ==========================================
// Export for module usage (if needed later)
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AVATAR_OPTIONS,
        DEFAULT_PROFILE,
        COSTS,
        REWARDS,
        getUserProfile,
        saveUserProfile,
        updateUserProfile,
        resetUserStats,
        recordBattleResult,
        getCoins,
        addCoins,
        spendCoins,
        canAfford,
        saveTeam,
        loadTeam,
        clearTeam,
        updateTeamPokemon,
        revivePokemon,
        healAllPokemon,
        saveBattleProgress,
        loadBattleProgress,
        resetBattleProgress,
        renderUserBadge,
        renderAvatarGrid,
        formatNumber,
        getStrengthTier
    };
}
