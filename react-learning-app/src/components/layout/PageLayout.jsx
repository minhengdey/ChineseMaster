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
        className={`container-max w-full mx-auto px-5 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-8 pb-8 sm:pb-10 lg:pb-12 ${innerClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  )
}
