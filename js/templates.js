/**
 * HTML Templates
 * 
 * Contains all HTML template functions used across the app.
 * Separates presentation from logic for better maintainability.
 */

// ==========================================
// Helper Functions
// ==========================================

/**
 * Gets type effectiveness indicator HTML for a Pokemon against an enemy.
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

/**
 * Creates type badge HTML from an array of types.
 * @param {string[]} types - Array of Pokemon types
 * @returns {string} HTML string of type badges
 */
function createTypeBadges(types) {
    return (types || []).map(type => 
        `<span class="type-badge ${type}">${type}</span>`
    ).join('');
}

/**
 * Creates sprite HTML with fallback placeholder.
 * @param {string|null} spriteUrl - URL of the sprite image
 * @param {string} name - Pokemon name for alt text
 * @param {string} className - CSS class for the image
 * @param {boolean} isFainted - Whether Pokemon is fainted
 * @returns {string} HTML string for sprite
 */
function createSpriteHTML(spriteUrl, name, className = '', isFainted = false) {
    if (spriteUrl) {
        const faintedClass = isFainted ? 'fainted' : '';
        return `<img src="${spriteUrl}" alt="${name}" class="${className} ${faintedClass}">`;
    }
    return '<div class="sprite-placeholder small">?</div>';
}

/**
 * Gets HP bar color class based on percentage.
 * @param {number} hpPercent - HP percentage (0-100)
 * @returns {string} CSS class for health bar color
 */
function getHealthBarClass(hpPercent) {
    if (hpPercent <= 25) return 'health-low';
    if (hpPercent <= 50) return 'health-mid';
    return '';
}

// ==========================================
// Battle Page Templates
// ==========================================

/**
 * Creates HTML for a Pokemon team card (used in battle page team section).
 * @param {Object} pokemon - Pokemon data object
 * @param {number} slot - Team slot index (0-2)
 * @param {boolean} isActive - Whether this Pokemon is currently active
 * @param {Object} enemyPokemon - Current enemy Pokemon (for matchup indicator)
 * @returns {string} HTML string for the card
 */
function createPokemonCardTemplate(pokemon, slot, isActive, enemyPokemon) {
    const hpPercent = (pokemon.hp / pokemon.maxHp) * 100;
    const isFainted = pokemon.hp <= 0;
    const spriteContent = createSpriteHTML(pokemon.sprite, pokemon.name, 'card-sprite-img', isFainted);
    
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
    const typeBadges = createTypeBadges(pokemon.types);
    
    // Get matchup indicator against current enemy
    const matchupIndicator = getEffectivenessIndicator(pokemon, enemyPokemon);
    
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
 * @param {Object} enemyPokemon - Current enemy Pokemon (for matchup indicator on player side)
 * @returns {string} HTML string for the battle card
 */
function createBattlePokemonCardTemplate(pokemon, isEnemy, enemyPokemon) {
    const hpPercent = (pokemon.hp / pokemon.maxHp) * 100;
    const spriteContent = pokemon.sprite 
        ? `<img src="${pokemon.sprite}" alt="${pokemon.name}" class="battle-sprite-img">`
        : '<div class="sprite-placeholder">?</div>';
    
    // Determine health bar color class
    const healthClass = getHealthBarClass(hpPercent);
    
    // Get strength tier
    const strength = pokemon.strength || 50;
    const tier = getStrengthTier(strength);
    
    // Get types
    const typeBadges = createTypeBadges(pokemon.types);
    
    // Get matchup indicator (only for player's Pokemon)
    const matchupIndicator = !isEnemy 
        ? getEffectivenessIndicator(pokemon, enemyPokemon)
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
function createLoadingCardTemplate() {
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
// Team Page Templates
// ==========================================

/**
 * Creates HTML for a team management Pokemon card.
 * @param {Object} pokemon - Pokemon data
 * @param {number} index - Array index
 * @param {Object} costs - Cost constants for revive/replace buttons
 * @returns {string} HTML string
 */
function createTeamCardTemplate(pokemon, index, costs) {
    const hpPercent = (pokemon.hp / pokemon.maxHp) * 100;
    const isFainted = pokemon.hp <= 0;
    const healthClass = getHealthBarClass(hpPercent);
    const typeBadges = createTypeBadges(pokemon.types);
    
    // Get strength score and tier
    const strength = pokemon.strength || 50;
    const tier = getStrengthTier(strength);
    
    return `
        <div class="team-pokemon-card ${isFainted ? 'fainted' : ''}" data-index="${index}">
            <div class="card-header">
                <span class="pokemon-id">#${String(pokemon.id).padStart(3, '0')}</span>
                <div class="pokemon-types">${typeBadges}</div>
            </div>
            
            <div class="card-body">
                <img 
                    src="${pokemon.sprite}" 
                    alt="${pokemon.name}" 
                    class="team-sprite ${isFainted ? 'fainted' : ''}"
                >
                <span class="team-pokemon-name">${pokemon.name}</span>
                
                <div class="hp-section">
                    <div class="hp-label">
                        <span>HP</span>
                        <span>${pokemon.hp} / ${pokemon.maxHp}</span>
                    </div>
                    <div class="team-health-bar">
                        <div class="team-health-fill ${healthClass}" style="width: ${hpPercent}%"></div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="stat-mini">
                        <span class="stat-mini-value">${pokemon.attack || '?'}</span>
                        <span class="stat-mini-label">ATK</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-value">${pokemon.maxHp}</span>
                        <span class="stat-mini-label">HP</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-value strength-badge ${tier.class}">${tier.name}</span>
                        <span class="stat-mini-label">STR</span>
                    </div>
                </div>
            </div>
            
            <div class="card-footer">
                ${isFainted ? `
                    <button class="btn btn-revive">
                        Revive <span class="cost">${costs.REVIVE}</span>
                    </button>
                ` : ''}
                <button class="btn btn-replace">
                    Replace <span class="cost">${costs.NEW_POKEMON}</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Creates HTML for empty team state.
 * @returns {string} HTML string for empty team message
 */
function createEmptyTeamTemplate() {
    return `
        <div class="team-pokemon-card empty" style="grid-column: 1 / -1;">
            <div class="empty-slot-content">
                <span class="empty-icon">🎮</span>
                <p class="empty-text">No team yet! Start a battle to get your Pokemon.</p>
                <a href="index.html" class="btn btn-primary">Go to Battle</a>
            </div>
        </div>
    `;
}

// ==========================================
// Shared Templates
// ==========================================

/**
 * Creates HTML for the user badge in the header.
 * @param {Object} profile - User profile object with avatar and username
 * @returns {string} HTML string for user badge
 */
function createUserBadgeTemplate(profile) {
    return `
        <div class="user-avatar">${profile.avatar}</div>
        <span class="user-name">${profile.username}</span>
    `;
}

/**
 * Creates HTML for avatar selection grid.
 * @param {string[]} avatarOptions - Array of available avatars
 * @param {string} selectedAvatar - Currently selected avatar
 * @returns {string} HTML string for avatar grid
 */
function createAvatarGridTemplate(avatarOptions, selectedAvatar) {
    return avatarOptions.map(avatar => `
        <button 
            class="avatar-option ${avatar === selectedAvatar ? 'selected' : ''}" 
            data-avatar="${avatar}"
            type="button"
        >
            ${avatar}
        </button>
    `).join('');
}

// ==========================================
// Export for module usage (if needed later)
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getEffectivenessIndicator,
        createTypeBadges,
        createSpriteHTML,
        getHealthBarClass,
        createPokemonCardTemplate,
        createBattlePokemonCardTemplate,
        createLoadingCardTemplate,
        createTeamCardTemplate,
        createEmptyTeamTemplate,
        createUserBadgeTemplate,
        createAvatarGridTemplate
    };
}
