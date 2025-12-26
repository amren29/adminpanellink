import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md" | "lg"; // Button size
  variant?: "primary" | "outline" | "success" | "danger" | "secondary" | "ghost"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  loading?: boolean; // Loading state
  className?: string; // Additional classes
  type?: "button" | "submit" | "reset"; // Button type
}

// Loading spinner component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <svg
      className={`${sizeClasses[size]} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  };

  // Variant Classes with enhanced styling
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-sm hover:bg-brand-600 hover:shadow-md active:bg-brand-700 active:scale-[0.98] disabled:bg-brand-300 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:ring-gray-400 active:bg-gray-100 active:scale-[0.98] dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700 dark:hover:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300/50",
    success:
      "bg-success-500 text-white shadow-sm hover:bg-success-600 hover:shadow-md active:bg-success-700 active:scale-[0.98] disabled:bg-success-300 focus:outline-none focus:ring-2 focus:ring-success-500/30 focus:ring-offset-2",
    danger:
      "bg-error-500 text-white shadow-sm hover:bg-error-600 hover:shadow-md active:bg-error-700 active:scale-[0.98] disabled:bg-error-300 focus:outline-none focus:ring-2 focus:ring-error-500/30 focus:ring-offset-2",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 active:scale-[0.98] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300/50",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 active:scale-[0.98] dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300/50",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition-all duration-200 ease-out ${className} ${sizeClasses[size]} ${variantClasses[variant]} ${isDisabled ? "cursor-not-allowed opacity-60 pointer-events-none" : ""}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading ? (
        <LoadingSpinner size={size} />
      ) : (
        startIcon && <span className="flex items-center">{startIcon}</span>
      )}
      <span className={loading ? "opacity-70" : ""}>{children}</span>
      {!loading && endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
