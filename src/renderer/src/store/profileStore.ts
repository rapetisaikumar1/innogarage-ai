import { create } from 'zustand'

interface Profile {
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
}

interface Plan {
  id: string
  planType: string
  price: string
  startsAt: string
  expiresAt: string
  isActive: boolean
}

interface ProfileState {
  profile: Profile | null
  plan: Plan | null
  setProfile: (profile: Profile | null) => void
  setPlan: (plan: Plan | null) => void
  reset: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  plan: null,

  setProfile: (profile) => set({ profile }),
  setPlan: (plan) => set({ plan }),
  reset: () => set({ profile: null, plan: null })
}))
