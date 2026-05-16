/**
 * Robust password validation utilities for security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonWords: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonWords: true,
};

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  '111111', '123123', 'admin', 'letmein', 'welcome', 'monkey', '1234567890',
  'senha', 'senha123', 'admin123', '12345678', 'qwerty123'
];

/**
 * Validates password strength according to security requirements
 */
export function validatePassword(
  password: string, 
  requirements: Partial<PasswordRequirements> = {}
): PasswordValidationResult {
  const reqs = { ...DEFAULT_REQUIREMENTS, ...requirements };
  const errors: string[] = [];
  let score = 0;

  // Basic length check
  if (password.length < reqs.minLength) {
    errors.push(`A senha deve ter pelo menos ${reqs.minLength} caracteres`);
  } else {
    score += 1;
  }

  // Character composition checks
  if (reqs.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  } else if (reqs.requireUppercase) {
    score += 1;
  }

  if (reqs.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  } else if (reqs.requireLowercase) {
    score += 1;
  }

  if (reqs.requireNumbers && !/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  } else if (reqs.requireNumbers) {
    score += 1;
  }

  if (reqs.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&*)');
  } else if (reqs.requireSpecialChars) {
    score += 1;
  }

  // Check against common passwords
  if (reqs.preventCommonWords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Esta senha é muito comum. Escolha uma senha mais segura');
    score = 0; // Reset score for common passwords
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Evite sequências óbvias de caracteres (123, abc, etc.)');
  }

  // Check for repeated characters
  if (hasRepeatedChars(password)) {
    errors.push('Evite muitos caracteres repetidos');
  }

  // Bonus points for longer passwords
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 5) // Cap at 5
  };
}

/**
 * Checks for sequential characters like 123, abc, etc.
 */
function hasSequentialChars(password: string): boolean {
  const sequences = [
    '0123456789',
    'abcdefghijklmnopqrstuvwxyz',
    'qwertyuiopasdfghjklzxcvbnm'
  ];

  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const substring = seq.substring(i, i + 3);
      if (password.toLowerCase().includes(substring)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks for too many repeated characters
 */
function hasRepeatedChars(password: string): boolean {
  const charCount = new Map<string, number>();
  
  for (const char of password.toLowerCase()) {
    charCount.set(char, (charCount.get(char) || 0) + 1);
  }

  // If any character appears more than 1/3 of the password length
  const maxRepeated = Math.floor(password.length / 3);
  return Array.from(charCount.values()).some(count => count > maxRepeated);
}

/**
 * Gets password strength description based on score
 */
export function getPasswordStrengthText(score: number): { text: string; color: string } {
  if (score >= 80) {
    return { text: 'Muito forte', color: 'text-success' };
  } else if (score >= 60) {
    return { text: 'Forte', color: 'text-success' };
  } else if (score >= 40) {
    return { text: 'Moderada', color: 'text-warning' };
  } else if (score >= 20) {
    return { text: 'Fraca', color: 'text-warning' };
  } else {
    return { text: 'Muito fraca', color: 'text-destructive' };
  }
}