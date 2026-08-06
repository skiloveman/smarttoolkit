import React, { useEffect, useState } from 'react';

interface DefaultValueInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue' | 'onChange' | 'placeholder' | 'value'> {
  value: string | number;
  defaultValueLabel: string | number;
  onValueChange: (value: string) => void;
}

export const DefaultValueInput: React.FC<DefaultValueInputProps> = ({
  value,
  defaultValueLabel,
  onValueChange,
  type = 'text',
  className = '',
  onBlur,
  onFocus,
  ...props
}) => {
  const defaultText = String(defaultValueLabel ?? '');
  const valueText = String(value ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const [isPristine, setIsPristine] = useState(valueText === defaultText);

  useEffect(() => {
    // Keep placeholder/default rendering in sync when parent state changes externally.
    if (isFocused) {
      return;
    }
    setIsPristine(valueText === defaultText);
  }, [defaultText, valueText, isFocused]);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    if (event.target.value.trim() === '') {
      setIsPristine(true);
      onValueChange(defaultText);
    }

    onBlur?.(event);
  };

  const renderedType = type === 'date' && isPristine && !isFocused ? 'text' : type;

  return (
    <input
      {...props}
      type={renderedType}
      value={isPristine ? '' : valueText}
      placeholder={defaultText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(event) => {
        if (isPristine) {
          setIsPristine(false);
        }
        onValueChange(event.target.value);
      }}
      className={`${className} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:placeholder-transparent`}
    />
  );
};