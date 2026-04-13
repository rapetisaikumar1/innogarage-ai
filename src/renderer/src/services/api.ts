const BASE_URL = 'http://localhost:3847'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Auth
  sendOtp: (data: { name: string; email: string }) =>
    request<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  register: (data: { name: string; email: string; phone: string; password: string; otp: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string; phone: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  completeGoogleRegistration: (data: { email: string; googleId: string; name: string; otp: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string; phone: string } }>('/auth/google/complete', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  sendSigninOtp: (data: { email: string; password: string }) =>
    request<{ message: string }>('/auth/send-signin-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; otp: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string; phone: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getGoogleAuthUrl: () => request<{ url: string }>('/auth/google/url'),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Profile
  getProfile: () =>
    request<{
      user: { id: string; name: string; email: string; phone: string } | null
      profile: {
        id: string
        userId: string
        resumeUrl: string | null
        resumeFilename: string | null
        jobDescription: string | null
        jobRole: string | null
        experience: string | null
        interviewType: string | null
        company: string | null
        language: string | null
        aiInstructions: string | null
        isUpdated: boolean
      } | null
      plan: {
        id: string
        planType: string
        price: string
        startsAt: string
        expiresAt: string
        isActive: boolean
      } | null
    }>('/profile'),

  updateProfile: (data: {
    jobDescription?: string
    jobRole?: string
    experience?: string
    interviewType?: string
    company?: string
    language?: string
    aiInstructions?: string
  }) =>
    request<{ profile: unknown }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  uploadResume: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ profile: unknown }>('/profile/resume', {
      method: 'POST',
      body: formData
    })
  },

  getResumeDownloadUrl: () =>
    request<{ url: string }>('/profile/resume/download-url'),
  getPlans: () =>
    request<{ plans: { type: string; price: string; duration: string }[] }>('/plans'),

  subscribe: (planType: string) =>
    request<{ plan: unknown }>('/plans/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planType })
    }),

  getActivePlan: () =>
    request<{
      plan: {
        id: string
        planType: string
        price: string
        startsAt: string
        expiresAt: string
        isActive: boolean
      } | null
    }>('/plans/active'),

  // Interview
  interviewStart: () =>
    request<{ message: string; active: boolean }>('/interview/start', {
      method: 'POST',
      body: '{}'
    }),

  interviewAskStream: async (
    text: string,
    onChunk: (chunk: string) => void,
    onError: (err: string) => void
  ): Promise<void> => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/interview/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text })
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }))
      onError(err.error || 'Request failed')
      return
    }
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') return
        try {
          const parsed = JSON.parse(payload)
          if (parsed.error) { onError(parsed.error); return }
          if (parsed.text) onChunk(parsed.text)
        } catch { /* ignore malformed lines */ }
      }
    }
  },

  interviewEnd: () =>
    request<{ message: string }>('/interview/end', {
      method: 'POST',
      body: '{}'
    }),

  interviewStatus: () =>
    request<{ active: boolean }>('/interview/status'),

  // Code Suggestions
  codeAnalyze: (image: string) =>
    request<{
      detected: boolean
      language: string
      context: string
      suggestion: string
      explanation: string
    }>('/interview/code-suggest', {
      method: 'POST',
      body: JSON.stringify({ image })
    })
}
