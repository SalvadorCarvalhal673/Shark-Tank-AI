import { env } from 'node:process';
import { loadConfiguration } from './configuration.ts';
export const LIVE_INFERENCE_ENABLED = false;
export type BackendMode = 'disabled' | 'scripted' | 'mock';
/** No environment value can enable a paid transport in this development batch. */
export function backendMode(environment: Readonly<Record<string,string|undefined>> = env): BackendMode {
  const configuration = loadConfiguration(environment);
  if (environment.NODE_ENV !== 'development' && environment.NODE_ENV !== 'test') return 'disabled';
  if (environment.SHARK_AI_MODE === 'live' || environment.SHARK_AI_LIVE_ENABLED ||
    (configuration.mode === 'scripted' && configuration.reason === 'invalid-configuration')) return 'disabled';
  return environment.SHARK_AI_BACKEND_MODE === 'mock' ? 'mock' :
    environment.SHARK_AI_BACKEND_MODE === 'scripted' ? 'scripted' : 'disabled';
}
