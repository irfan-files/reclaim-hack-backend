"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const env_1 = require("../../utils/env");
const nodeEnv = (0, env_1.getEnvVariable)('NODE_ENV') || 'development';
(0, dotenv_1.config)({ path: `.env.${nodeEnv}` });
