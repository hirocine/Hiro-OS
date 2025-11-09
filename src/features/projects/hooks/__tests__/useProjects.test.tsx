import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjects } from '../useProjects'
import { supabase } from '@/integrations/supabase/client'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch projects successfully', async () => {
    const mockProjects = [
      {
        id: '1',
        name: 'Project 1',
        description: 'Test project',
        start_date: '2024-01-01',
        expected_end_date: '2024-02-01',
        status: 'active',
        step: 'pending_separation',
        step_history: [],
        responsible_name: 'John Doe',
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
    } as any)

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].name).toBe('Project 1')
  })

  it('should filter projects by status', async () => {
    const mockProjects = [
      {
        id: '1',
        name: 'Active Project',
        status: 'active',
        step: 'pending_separation',
        step_history: [],
        responsible_name: 'John',
        created_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Completed Project',
        status: 'completed',
        step: 'completed',
        step_history: [],
        responsible_name: 'Jane',
        created_at: '2024-01-02'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
    } as any)

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.setFilters({ status: 'active' as const })

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0].status).toBe('active')
    })
  })

  it('should calculate project statistics correctly', async () => {
    const mockProjects = [
      {
        id: '1',
        name: 'Active 1',
        status: 'active',
        step: 'pending_separation',
        step_history: [],
        responsible_name: 'John',
        created_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Active 2',
        status: 'active',
        step: 'in_verification',
        step_history: [],
        responsible_name: 'Jane',
        created_at: '2024-01-02'
      },
      {
        id: '3',
        name: 'Completed',
        status: 'completed',
        step: 'completed',
        step_history: [],
        responsible_name: 'Bob',
        created_at: '2024-01-03'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
    } as any)

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stats.total).toBe(3)
    expect(result.current.stats.active).toBe(2)
    expect(result.current.stats.completed).toBe(1)
  })

  it('should update project step successfully', async () => {
    const mockProject = {
      id: '1',
      name: 'Test Project',
      status: 'active',
      step: 'pending_separation',
      step_history: [],
      responsible_name: 'John',
      created_at: '2024-01-01'
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockProject], error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null })
    } as any)

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.updateProjectStep('1', 'pending_verification', 'Test notes')

    expect(supabase.from).toHaveBeenCalledWith('projects')
  })

  it('should setup real-time subscription', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

    const { unmount } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('projects-changes')
    })

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'projects'
      }),
      expect.any(Function)
    )

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })
})
