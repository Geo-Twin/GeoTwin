/**
 * Simulates webpack's require.context functionality for JavaScript environments
 * This provides a consistent API for loading multiple files dynamically
 */

/**
 * Creates a context-like object that simulates webpack's require.context
 * @param {string} directory - Base directory (not used in runtime, for documentation)
 * @param {boolean} useSubdirectories - Whether to include subdirectories (not used in runtime)
 * @param {RegExp} regExp - File pattern to match (not used in runtime)
 * @returns {Object} - Context-like object with keys() method and modules
 */
export function createRequireContext(directory, useSubdirectories, regExp) {
  // This is a placeholder that will be populated by the webpack plugin
  // The actual context data comes from ShaderContextData.js
  const context = {
    keys: () => [],
    modules: {}
  };
  
  return context;
}

/**
 * Maps files from a context object to a more usable format
 * @param {Object} context - The context object with keys() and modules
 * @returns {Object} - Mapped files with processed keys
 */
export function mapFiles(context) {
  const keys = context.keys();
  const values = keys.map(key => context.modules[key]);

  return keys.reduce((accumulator, key, index) => {
    // Remove leading './' and file extension
    let processedKey = key.slice(2);
    
    // Remove common extensions
    if (processedKey.endsWith('.glsl')) {
      processedKey = processedKey.slice(0, -5);
    } else if (processedKey.endsWith('.vert') || processedKey.endsWith('.frag')) {
      processedKey = processedKey.slice(0, -5);
    }

    return {
      ...accumulator,
      [processedKey]: values[index],
    };
  }, {});
}

/**
 * Maps shader files specifically, handling vertex and fragment shaders
 * @param {Object} context - The context object with keys() and modules
 * @returns {Object} - Collection of shader programs with vertex/fragment properties
 */
export function mapShaderFiles(context) {
  const keys = context.keys();
  const values = keys.map(key => context.modules[key]);

  return keys.reduce((accumulator, key, index) => {
    // Remove leading './'
    let processedKey = key.slice(2);
    
    // Determine shader type
    const type = processedKey.endsWith('.vert') ? 'vertex' : 'fragment';
    
    // Remove extension
    processedKey = processedKey.slice(0, -5);

    return {
      ...accumulator,
      [processedKey]: {
        ...accumulator[processedKey],
        [type]: values[index]
      }
    };
  }, {});
}

export default {
  createRequireContext,
  mapFiles,
  mapShaderFiles
};
