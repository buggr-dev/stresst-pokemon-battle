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
    stats: {
        totalBattles: 0,
        totalWins: 0,
        bestStreak: 0,
        currentStreak: 0
    }
};

/** localStorage key for user data */
const STORAGE_KEY = 'pokemonBattleUser';

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
    } else {
        profile.stats.currentStreak = 0;
    }
    
    saveUserProfile(profile);
    return profile;
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

// ==========================================
// Export for module usage (if needed later)
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AVATAR_OPTIONS,
        DEFAULT_PROFILE,
        getUserProfile,
        saveUserProfile,
        updateUserProfile,
        resetUserStats,
        recordBattleResult,
        renderUserBadge,
        renderAvatarGrid
    };
}

