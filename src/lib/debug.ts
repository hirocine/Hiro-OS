/**
 * Sistema de Debug Configurável
 * Permite controlar logs em desenvolvimento sem afetar produção
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  modules: string[];
}

// Configuração do debug baseada no ambiente
const debugConfig: DebugConfig = {
  enabled: import.meta.env.DEV, // Apenas em desenvolvimento
  level: 'debug',
  modules: ['*'], // Todos os módulos por padrão
};

/**
 * Função de debug que substitui console.log
 * Só executa em modo de desenvolvimento
 */
export function debugLog(module: string, message: string, data?: any) {
  if (!debugConfig.enabled) return;
  
  if (debugConfig.modules.includes('*') || debugConfig.modules.includes(module)) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${module.toUpperCase()}]`;
    
    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

/**
 * Debug específico para authentication
 */
export const authDebug = (message: string, data?: any) => debugLog('auth', message, data);

/**
 * Debug específico para admin operations
 */
export const adminDebug = (message: string, data?: any) => debugLog('admin', message, data);

/**
 * Debug específico para profile operations
 */
export const profileDebug = (message: string, data?: any) => debugLog('profile', message, data);

/**
 * Debug específico para import operations
 */
export const importDebug = (message: string, data?: any) => debugLog('import', message, data);

/**
 * Debug específico para equipment operations
 */
export const equipmentDebug = (message: string, data?: any) => debugLog('equipment', message, data);

/**
 * Debug específico para project operations
 */
export const projectDebug = (message: string, data?: any) => debugLog('project', message, data);

/**
 * Debug específico para role operations
 */
export const roleDebug = (message: string, data?: any) => debugLog('role', message, data);

/**
 * Configurar módulos específicos de debug
 */
export function setDebugModules(modules: string[]) {
  debugConfig.modules = modules;
}

/**
 * Habilitar/desabilitar debug
 */
export function toggleDebug(enabled: boolean) {
  debugConfig.enabled = enabled;
}