/**
 * Shared button component - use across pages for consistent styling.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  ...props
}) {
  const baseStyles =
    "font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
    outline: "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100",
    secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
