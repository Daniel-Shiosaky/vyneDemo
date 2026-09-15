import path from 'node:path';

import dotenv from 'dotenv';

/**
 * The ONLY module in this framework that reads `process.env`.
 *
 * Specs, page objects, validators and API utilities all import `ENV` from here, so there is
 * a single place to change when an environment or account changes. Nothing else should ever
 * touch `process.env` directly.
 *
 * Precedence: real environment variables (how CI injects secrets) win over `.env` (how a
 * developer works locally). `dotenv` does not overwrite existing vars, giving us that for
 * free.
 */
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

/** Non-secret setting with a safe, public default. */
function url(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

/**
 * A value that must be supplied explicitly. Fails loudly and actionably rather than letting
 * a missing secret surface later as a confusing login timeout.
 */
function required(key: string): string {
  const configuredValue = process.env[key]?.trim();
  if (!configuredValue) {
    throw new Error(
      `Missing required environment variable "${key}".\n\n` +
        `Set up your local environment first:\n` +
        `  cp .env.example .env    # then fill in the values\n\n` +
        `In CI, provide it as a repository secret.\n` +
        `See README.md ("Configuration") for details.`,
    );
  }
  return configuredValue;
}

/**
 * Credentials are exposed via getters so they are resolved only when actually used. That
 * lets the API suite run with no SauceDemo credentials configured at all.
 */
export const ENV = {
  WEB_BASE_URL: url('WEB_BASE_URL', 'https://www.saucedemo.com'),
  API_BASE_URL: url('API_BASE_URL', 'https://jsonplaceholder.typicode.com'),

  /** Set API_DEBUG=1 to log every API request and its response status. */
  API_DEBUG: process.env.API_DEBUG === '1',

  /** Shared by every SauceDemo account. */
  get PASSWORD(): string {
    return required('PASSWORD');
  },

  /** The primary account used by the happy-path suite. */
  get USERNAME(): string {
    return required('USERNAME');
  },

  /** Accounts that behave differently on purpose - see docs/EXPLORATION-FINDINGS.md 1.2. */
  get LOCKED_OUT_USERNAME(): string {
    return required('LOCKED_OUT_USERNAME');
  },
  get PROBLEM_USERNAME(): string {
    return required('PROBLEM_USERNAME');
  },
  get PERFORMANCE_GLITCH_USERNAME(): string {
    return required('PERFORMANCE_GLITCH_USERNAME');
  },
  get ERROR_USERNAME(): string {
    return required('ERROR_USERNAME');
  },
  get VISUAL_USERNAME(): string {
    return required('VISUAL_USERNAME');
  },
} as const;

/** Where `global-setup.ts` writes the per-account authenticated sessions. Gitignored. */
export const AUTH_STATE_DIR = path.resolve(process.cwd(), '.auth');
