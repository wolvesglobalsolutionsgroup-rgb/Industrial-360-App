"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const functionsLogger = require("firebase-functions/logger");
const logger_1 = require("../../src/lib/logger");
exports.logger = {
    info(message, ...args) {
        const cleanMsg = (0, logger_1.sanitizeString)(message);
        const cleanArgs = args.map((a) => (0, logger_1.sanitizeData)(a));
        functionsLogger.info(cleanMsg, ...cleanArgs);
    },
    warn(message, ...args) {
        const cleanMsg = (0, logger_1.sanitizeString)(message);
        const cleanArgs = args.map((a) => (0, logger_1.sanitizeData)(a));
        functionsLogger.warn(cleanMsg, ...cleanArgs);
    },
    error(message, ...args) {
        const cleanArgs = args.map((a) => (0, logger_1.sanitizeData)(a));
        if (message instanceof Error) {
            const sanitizedErr = (0, logger_1.sanitizeData)(message);
            functionsLogger.error((0, logger_1.sanitizeString)(message.message), sanitizedErr, ...cleanArgs);
        }
        else {
            functionsLogger.error((0, logger_1.sanitizeString)(String(message)), ...cleanArgs);
        }
    },
    sanitizeData: logger_1.sanitizeData,
    sanitizeString: logger_1.sanitizeString
};
//# sourceMappingURL=logger.js.map