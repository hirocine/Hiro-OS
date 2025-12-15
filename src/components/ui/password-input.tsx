import * as React from 'react';
import { Eye, EyeOff, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword, getPasswordStrengthText, type PasswordRequirements } from '@/lib/passwordValidation';
import { sanitizeInput } from '@/lib/validation';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  showStrength?: boolean;
  showValidation?: boolean;
  requirements?: Partial<PasswordRequirements>;
  onChange?: (value: string, isValid: boolean) => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, showStrength = true, showValidation = true, requirements, onChange, ...props }, ref) => {
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [validation, setValidation] = React.useState(validatePassword(''));

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const sanitizedValue = sanitizeInput(rawValue);
      
      setPassword(sanitizedValue);
      const newValidation = validatePassword(sanitizedValue, requirements);
      setValidation(newValidation);
      
      if (onChange) {
        onChange(sanitizedValue, newValidation.isValid);
      }
    };

    const strengthText = getPasswordStrengthText(validation.score);

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={props.id}>{label}</Label>}
        
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            className={cn(
              'pr-20',
              showValidation && !validation.isValid && password.length > 0 && 'border-destructive focus-visible:ring-destructive',
              showValidation && validation.isValid && password.length > 0 && 'border-success focus-visible:ring-success',
              className
            )}
            autoComplete="new-password"
            spellCheck={false}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
            {/* Security indicator */}
            {showValidation && password.length > 0 && (
              <div className="flex items-center">
                {validation.isValid ? (
                  <Shield className="h-4 w-4 text-success" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
            
            {/* Toggle visibility */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        {showStrength && password.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Força da senha:</span>
              <span className={cn('font-medium', strengthText.color)}>
                {strengthText.text}
              </span>
            </div>
            
            {/* Strength bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  validation.score === 0 && 'w-0',
                  validation.score === 1 && 'w-1/5 bg-destructive',
                  validation.score === 2 && 'w-2/5 bg-warning',
                  validation.score === 3 && 'w-3/5 bg-warning',
                  validation.score === 4 && 'w-4/5 bg-success',
                  validation.score === 5 && 'w-full bg-success'
                )}
              />
            </div>
          </div>
        )}

        {/* Validation errors */}
        {showValidation && password.length > 0 && validation.errors.length > 0 && (
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <p key={index} className="text-sm text-destructive flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 flex-shrink-0" />
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };