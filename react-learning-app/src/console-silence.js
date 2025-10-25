// Silence console methods early. Import this before other modules to prevent
// debug output from appearing in users' browsers.
// Controlled by Vite env: silence when import.meta.env.PROD is truthy or
// when VITE_SILENCE_LOGS === 'true'.
try {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    const shouldSilence = Boolean(env && env.PROD) || String(env && env.VITE_SILENCE_LOGS) === 'true';
    if (shouldSilence) {
        const noop = function () { };
        // overwrite common console methods
        console.log = noop;
        console.debug = noop;
        console.info = noop;
        console.warn = noop;
        console.error = noop;
    }
} catch (e) {
    // best-effort silence; ignore any errors in environments that don't support import.meta
}

export default {};
