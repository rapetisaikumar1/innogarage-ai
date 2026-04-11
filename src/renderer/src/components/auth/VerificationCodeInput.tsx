import { useState, useRef, useEffect } from 'react'
import Button from '../ui/Button'

interface VerificationCodeInputProps {
  onSubmit: (code: string) => void
  loading?: boolean
  error?: string
}

export default function VerificationCodeInput({
  onSubmit,
  loading = false,
  error
}: VerificationCodeInputProps): React.JSX.Element {
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string): void => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }

    if (newCode.every((d) => d !== '') && index === 5) {
      onSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent): void => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent): void => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setCode(newCode)
    if (pasted.length === 6) {
      onSubmit(newCode.join(''))
    } else {
      inputs.current[pasted.length]?.focus()
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 text-center">
        Enter the 6-digit code sent to your email
      </p>
      <div className="flex gap-3 justify-center" onPaste={handlePaste}>
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputs.current[idx] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-12 h-14 text-center text-xl font-bold bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <Button
        className="w-full"
        onClick={() => onSubmit(code.join(''))}
        loading={loading}
        disabled={code.some((d) => d === '')}
      >
        Verify Code
      </Button>
    </div>
  )
}
