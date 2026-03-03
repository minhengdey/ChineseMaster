/**
 * Shared page layout: background, max-width, and consistent padding for all pages.
 */
export default function PageLayout({
  children,
  className = "",
  innerClassName = "",
}) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 ${className}`.trim()}
    >
      <div
        className={`container-max w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${innerClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  )
}
