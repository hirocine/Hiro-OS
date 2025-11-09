import '@testing-library/jest-dom'
import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock Supabase channel
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn()
}

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn(() => Promise.resolve({ data: [], error: null }))
  })),
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signUp: vi.fn(() => Promise.resolve({ error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
    signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }))
  },
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn()
}

// Mock the Supabase client module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})

beforeAll(() => {
  // Global test setup
})

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Clean up after each test
  cleanup()
})

afterAll(() => {
  // Global test teardown
  vi.restoreAllMocks()
})