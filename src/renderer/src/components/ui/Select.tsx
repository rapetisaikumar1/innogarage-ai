interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export default function Select({
  label,
  error,
  options,
  className = '',
  ...props
}: SelectProps): React.JSX.Element {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      )}
      <select
        className={`
          w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white
          focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
          transition-colors duration-200 appearance-none
          ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="" className="bg-gray-800">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
