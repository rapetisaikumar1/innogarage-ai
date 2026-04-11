interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick
}: CardProps): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-900/50 border border-gray-800 rounded-xl p-6
        ${hover ? 'hover:border-brand-500/50 hover:bg-gray-900/80 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
