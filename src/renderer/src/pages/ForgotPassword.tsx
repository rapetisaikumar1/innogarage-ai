import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Lock } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { api } from '../services/api'

export default function ForgotPassword(): React.JSX.Element {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendReset = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true)
    setError('')
    try {
      await api.forgotPassword(email)
      setOtp(['', '', '', '', '', ''])
      setStep('reset')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string): void => {
    if (!/^\d*$/.test(value)) return
    setOtp(prev => { const u = [...prev]; u[index] = value.slice(-1); return u })
    setError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const handleResetPassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter the 6-digit code'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      await api.resetPassword({ email, otp: code, newPassword })
      setStep('done')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (): Promise<void> => {
    setLoading(true)
    setError('')
    setOtp(['', '', '', '', '', ''])
    try {
      await api.forgotPassword(email)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => {
            if (step === 'reset') { setStep('email'); setOtp(['','','','','','']) }
            else navigate('/sign-in')
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'reset' ? 'Back' : 'Back to Sign In'}
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            {step === 'email' && 'Forgot Password'}
            {step === 'reset' && 'Reset Password'}
            {step === 'done' && 'Password Reset'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'reset' && `Enter the 6-digit code sent to ${email}`}
            {step === 'done' && 'Your password has been reset successfully'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendReset} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Button type="submit" className="w-full" loading={loading}>
              Send Verification Code
            </Button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <p className="text-sm text-gray-400 text-center mb-3">Verification code</p>
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                ))}
              </div>
            </div>

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Reset Password
            </Button>

            <p className="text-center text-sm text-gray-500">
              Didn&apos;t receive it?{' '}
              <button type="button" onClick={handleResend} disabled={loading}
                className="text-brand-400 hover:text-brand-300 font-medium disabled:opacity-50">
                Resend code
              </button>
            </p>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">You can now sign in with your new password.</p>
            <Button onClick={() => navigate('/sign-in')} className="w-full">
              Go to Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
