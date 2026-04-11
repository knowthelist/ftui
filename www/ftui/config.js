
/**
 * Default configuration object.
 * This can be overridden by creating a config.local.js file with a similar structure.
 */

export const config = {
    homeAssistant: {
        url: 'http://homeassistant:8123', // Your HA URL here
        token: 'HA_TOKEN', // Your HA Token here
    },
};

/**
 * Function to attempt loading config.local.js and merge it with the default config.
 */
export async function initializeConfig() {
    try {
        const localConfigModule = await import('./config.local.js');
        if (localConfigModule && localConfigModule.config) {
            Object.assign(config, localConfigModule.config);
        }
    } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND' && !error.message.includes('Failed to fetch dynamically imported module')) {
            console.warn("Error loading config.local.js:", error);
        } else {
            console.log("config.local.js not found or unavailable. Using default configuration.");
        }
    }
}