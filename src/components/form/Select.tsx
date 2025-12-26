import React, { useState, useEffect } from "react";
import CustomDropdown from "../ui/dropdown/CustomDropdown";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string; // Add value prop support for controlled usage
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value, // Optional controlled value
  disabled = false,
}) => {
  // Manage the selected value internally if not controlled
  const [internalValue, setInternalValue] = useState<string>(defaultValue || "");

  // Sync internal state with controlled value if provided
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange(newValue);
  };

  // Determine effective value
  const effectiveValue = value !== undefined ? value : internalValue;

  return (
    <CustomDropdown
      options={options}
      value={effectiveValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
};

export default Select;
