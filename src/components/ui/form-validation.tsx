import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldValidationProps {
  value: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidation?: (value: string) => string | null;
  className?: string;
}

export function FormFieldValidation({
  value,
  required = false,
  minLength,
  maxLength,
  pattern,
  customValidation,
  className
}: FormFieldValidationProps) {
  const errors: string[] = [];

  // Required validation
  if (required && !value.trim()) {
    errors.push('Este campo é obrigatório');
  }

  // Length validations
  if (value && minLength && value.length < minLength) {
    errors.push(`Mínimo de ${minLength} caracteres`);
  }

  if (value && maxLength && value.length > maxLength) {
    errors.push(`Máximo de ${maxLength} caracteres`);
  }

  // Pattern validation
  if (value && pattern && !pattern.test(value)) {
    errors.push('Formato inválido');
  }

  // Custom validation
  if (value && customValidation) {
    const customError = customValidation(value);
    if (customError) {
      errors.push(customError);
    }
  }

  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn('mt-2', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

interface FormSuccessProps {
  message: string;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  return (
    <Alert className={cn('border-green-200 text-green-800 bg-green-50', className)}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        {message}
      </AlertDescription>
    </Alert>
  );
}

interface FormInfoProps {
  message: string;
  className?: string;
}

export function FormInfo({ message, className }: FormInfoProps) {
  return (
    <Alert className={cn('border-primary/20 text-primary bg-primary/5', className)}>
      <Info className="h-4 w-4 text-primary" />
      <AlertDescription className="text-primary">
        {message}
      </AlertDescription>
    </Alert>
  );
}

// Validation utilities
export const validators = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email inválido';
  },
  
  phone: (value: string) => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(value) ? null : 'Telefone deve estar no formato (11) 99999-9999';
  },
  
  currency: (value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    return !isNaN(numericValue) && numericValue >= 0 ? null : 'Valor monetário inválido';
  },
  
  required: (value: string) => {
    return value.trim() ? null : 'Campo obrigatório';
  },
  
  minLength: (min: number) => (value: string) => {
    return value.length >= min ? null : `Mínimo de ${min} caracteres`;
  },
  
  maxLength: (max: number) => (value: string) => {
    return value.length <= max ? null : `Máximo de ${max} caracteres`;
  }
};