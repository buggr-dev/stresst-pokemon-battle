/**
 * Pokemon API Service
 * 
 * Handles all interactions with the PokeAPI.
 * API Documentation: https://pokeapi.co/docs/v2
 */

// ==========================================
// Constants
// ==========================================

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

/** Total number of Pokemon in Gen 1-5 (good variety without too many) */
const MAX_POKEMON_ID = 649;

/** Minimum Pokemon ID */
const MIN_POKEMON_ID = 1;

// ==========================================
// API Functions
// ==========================================

/**
 * Fetches a Pokemon by ID or name from the PokeAPI.
 * @param {number|string} idOrName - Pokemon ID or name
 * @returns {Promise<Object>} Pokemon data formatted for our game
 */
async function fetchPokemon(idOrName) {
    try {
        const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${idOrName}`);
        
        if (!response.ok) {
            throw new Error(`Pokemon not found: ${idOrName}`);
        }
        
        const data = await response.json();
        return formatPokemonData(data);
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
        throw error;
    }
}

/**
 * Fetches multiple Pokemon by their IDs.
 * @param {number[]} ids - Array of Pokemon IDs
 * @returns {Promise<Object[]>} Array of Pokemon data
 */
async function fetchMultiplePokemon(ids) {
    const promises = ids.map(id => fetchPokemon(id));
    return Promise.all(promises);
}

/**
 * Fetches random Pokemon for a team.
 * @param {number} count - Number of Pokemon to fetch (default 3)
 * @returns {Promise<Object[]>} Array of random Pokemon data
 */
async function fetchRandomTeam(count = 3) {
    const randomIds = generateRandomPokemonIds(count);
    console.log('Fetching Pokemon with IDs:', randomIds);
    return fetchMultiplePokemon(randomIds);
}

/**
 * Fetches a single random Pokemon (for enemy encounters).
 * @returns {Promise<Object>} Random Pokemon data
 */
async function fetchRandomPokemon() {
    const randomId = getRandomInt(MIN_POKEMON_ID, MAX_POKEMON_ID);
    console.log('Fetching random enemy Pokemon with ID:', randomId);
    return fetchPokemon(randomId);
}

// ==========================================
// Data Formatting
// ==========================================

/**
 * Formats raw PokeAPI data into our game's Pokemon structure.
 * @param {Object} apiData - Raw data from PokeAPI
 * @returns {Object} Formatted Pokemon object
 */
function formatPokemonData(apiData) {
    // Calculate HP based on base stat (scaled for gameplay)
    const baseHp = apiData.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 50;
    const gameHp = Math.round(baseHp * 1.5); // Scale HP for better gameplay
    
    // Get attack stat for damage calculation
    const baseAttack = apiData.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 50;
    
    // Get Pokemon types
    const types = apiData.types.map(t => t.type.name);
    
    // Get base experience and calculate strength score (1-100 scale)
    // base_experience typically ranges from ~36 to ~608
    const baseExperience = apiData.base_experience || 100;
    const strength = Math.min(100, Math.max(1, Math.round((baseExperience / 608) * 100)));
    
    return {
        id: apiData.id,
        name: capitalizeFirst(apiData.name),
        hp: gameHp,
        maxHp: gameHp,
        attack: baseAttack,
        types: types,
        sprite: apiData.sprites.front_default,
        spriteBack: apiData.sprites.back_default,
        baseExperience: baseExperience,
        strength: strength
    };
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Generates an array of unique random Pokemon IDs.
 * @param {number} count - Number of IDs to generate
 * @returns {number[]} Array of unique random IDs
 */
function generateRandomPokemonIds(count) {
    const ids = new Set();
    
    while (ids.size < count) {
        ids.add(getRandomInt(MIN_POKEMON_ID, MAX_POKEMON_ID));
    }
    
    return Array.from(ids);
}

/**
 * Generates a random integer between min and max (inclusive).
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// Export for module usage (if needed later)
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchPokemon,
        fetchMultiplePokemon,
        fetchRandomTeam,
        fetchRandomPokemon,
        formatPokemonData
    };
}

// Add to buggr