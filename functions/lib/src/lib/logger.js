"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.API_KEY_SECRET_REGEX = void 0;
exports.sanitizeString = sanitizeString;
exports.sanitizeData = sanitizeData;
exports.initSentry = initSentry;
const Sentry = require("@sentry/react");
/**
 * Patterns and Keys for PII & Sensitive Data Sanitization
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const BEARER_JWT_REGEX = /(Bearer\s+)?[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+/gi;
exports.API_KEY_SECRET_REGEX = /(AIzaSy[A-Za-z0-9\-_]{33}|[a-f0-9]{32,64})/gi;
const PRECISE_GPS_REGEX = /(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/g;
const SENSITIVE_TOKEN_KEYS = new Set([
    'token',
    'idtoken',
    'rawtoken',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'auth',
    'secret',
    'apikey',
    'password',
    'clientsecret',
    'bearer',
    'resendapikey',
    'geminiapikey'
]);
const SENSITIVE_UID_KEYS = new Set([
    'uid',
    'userid',
    'calleruid',
    'targetuid',
    'sealedby',
    'createdby',
    'user_id'
]);
const SENSITIVE_EMAIL_KEYS = new Set([
    'email',
    'useremail',
    'to',
    'from',
    'sender'
]);
const GPS_KEYS = new Set(['lat', 'lng', 'latitude', 'longitude', 'coords', 'coordinates']);
/**
 * Sanitizes a single string value for Emails, Tokens, JWTs, and GPS.
 */
function sanitizeString(input) {
    if (!input || typeof input !== 'string')
        return input;
    let sanitized = input;
    // 1. Redact Emails
    sanitized = sanitized.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
    // 2. Redact JWT / Bearer Tokens
    sanitized = sanitized.replace(BEARER_JWT_REGEX, '[REDACTED_TOKEN]');
    // 3. Redact precise GPS coordinate strings (more than 2 decimal places)
    sanitized = sanitized.replace(PRECISE_GPS_REGEX, (_match, lat, lng) => {
        const roundedLat = parseFloat(lat).toFixed(2);
        const roundedLng = parseFloat(lng).toFixed(2);
        return `${roundedLat}, ${roundedLng} [REDACTED_GPS_PRECISION]`;
    });
    return sanitized;
}
/**
 * Sanitizes numbers for GPS coordinates if needed.
 */
function sanitizeNumber(val, keyName) {
    if (keyName && GPS_KEYS.has(keyName.toLowerCase()) && !Number.isInteger(val)) {
        return Number(val.toFixed(2));
    }
    return val;
}
/**
 * Recursively sanitizes any value (object, array, primitive, error).
 */
function sanitizeData(data, keyName, depth = 0) {
    if (depth > 10)
        return '[REDACTED_MAX_DEPTH]';
    if (data === null || data === undefined)
        return data;
    const lowerKey = keyName ? keyName.toLowerCase() : '';
    // Check key-based sensitive overrides
    if (lowerKey && SENSITIVE_TOKEN_KEYS.has(lowerKey)) {
        return '[REDACTED_TOKEN]';
    }
    if (lowerKey && SENSITIVE_UID_KEYS.has(lowerKey)) {
        return '[REDACTED_UID]';
    }
    if (lowerKey && SENSITIVE_EMAIL_KEYS.has(lowerKey)) {
        return '[REDACTED_EMAIL]';
    }
    if (typeof data === 'string') {
        return sanitizeString(data);
    }
    if (typeof data === 'number') {
        return sanitizeNumber(data, keyName);
    }
    if (typeof data === 'boolean' || typeof data === 'function' || typeof data === 'symbol') {
        return data;
    }
    if (data instanceof Error) {
        const errObj = {
            name: data.name,
            message: sanitizeString(data.message),
            stack: sanitizeString(data.stack || '')
        };
        for (const key of Object.getOwnPropertyNames(data)) {
            if (!['name', 'message', 'stack'].includes(key)) {
                errObj[key] = sanitizeData(data[key], key, depth + 1);
            }
        }
        return errObj;
    }
    if (Array.isArray(data)) {
        return data.map((item) => sanitizeData(item, keyName, depth + 1));
    }
    if (typeof data === 'object') {
        const sanitizedObj = {};
        for (const [k, v] of Object.entries(data)) {
            sanitizedObj[k] = sanitizeData(v, k, depth + 1);
        }
        return sanitizedObj;
    }
    return data;
}
/**
 * Initialize Sentry with automatic PII scrubbing in beforeSend & beforeBreadcrumb.
 */
let isSentryInitialized = false;
function initSentry() {
    if (isSentryInitialized)
        return;
    let rawDsn = '';
    let envMode = 'development';
    try {
        if (typeof process !== 'undefined' && process.env) {
            rawDsn = process.env.VITE_SENTRY_DSN || '';
            envMode = process.env.NODE_ENV || 'development';
        }
    }
    catch (_e) {
        // Ignore env error
    }
    const dsn = typeof rawDsn === 'string' ? rawDsn.trim() : '';
    if (!dsn || (!dsn.startsWith('http://') && !dsn.startsWith('https://'))) {
        return;
    }
    try {
        Sentry.init({
            dsn,
            environment: envMode,
            beforeSend(event) {
                // Scrub PII from messages, exceptions, extra, user, and request
                if (event.message) {
                    event.message = sanitizeString(event.message);
                }
                if (event.exception?.values) {
                    event.exception.values.forEach((ex) => {
                        if (ex.value)
                            ex.value = sanitizeString(ex.value);
                    });
                }
                if (event.extra) {
                    event.extra = sanitizeData(event.extra);
                }
                if (event.user) {
                    // Force scrub user PII
                    event.user = {
                        id: '[REDACTED_UID]'
                    };
                }
                if (event.request) {
                    event.request = sanitizeData(event.request);
                }
                return event;
            },
            beforeBreadcrumb(breadcrumb) {
                if (breadcrumb.message) {
                    breadcrumb.message = sanitizeString(breadcrumb.message);
                }
                if (breadcrumb.data) {
                    breadcrumb.data = sanitizeData(breadcrumb.data);
                }
                return breadcrumb;
            }
        });
        isSentryInitialized = true;
    }
    catch (err) {
        // Fallback if Sentry fails to initialize
        console.warn('Failed to initialize Sentry:', err);
    }
}
// Auto-initialize Sentry on module load if DSN present
initSentry();
/**
 * Unified Sanitized Logger Wrapper
 */
class Logger {
    sanitize(data) {
        return sanitizeData(data);
    }
    sanitizeString(str) {
        return sanitizeString(str);
    }
    debug(message, ...args) {
        const cleanMsg = sanitizeString(message);
        const cleanArgs = args.map((arg) => sanitizeData(arg));
        console.debug(`[DEBUG] ${cleanMsg}`, ...cleanArgs);
    }
    info(message, ...args) {
        const cleanMsg = sanitizeString(message);
        const cleanArgs = args.map((arg) => sanitizeData(arg));
        console.info(`[INFO] ${cleanMsg}`, ...cleanArgs);
    }
    warn(message, ...args) {
        const cleanMsg = sanitizeString(message);
        const cleanArgs = args.map((arg) => sanitizeData(arg));
        console.warn(`[WARN] ${cleanMsg}`, ...cleanArgs);
        if (isSentryInitialized) {
            Sentry.captureMessage(cleanMsg, {
                level: 'warning',
                extra: { sanitizedArgs: cleanArgs }
            });
        }
    }
    error(message, ...args) {
        const cleanArgs = args.map((arg) => sanitizeData(arg));
        if (message instanceof Error) {
            const sanitizedError = sanitizeData(message);
            const displayMsg = sanitizeString(message.message);
            console.error(`[ERROR] ${displayMsg}`, sanitizedError, ...cleanArgs);
            if (isSentryInitialized) {
                Sentry.captureException(message, {
                    extra: { sanitizedArgs: cleanArgs, sanitizedError }
                });
            }
        }
        else {
            const cleanMsg = sanitizeString(String(message));
            console.error(`[ERROR] ${cleanMsg}`, ...cleanArgs);
            if (isSentryInitialized) {
                Sentry.captureMessage(cleanMsg, {
                    level: 'error',
                    extra: { sanitizedArgs: cleanArgs }
                });
            }
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map