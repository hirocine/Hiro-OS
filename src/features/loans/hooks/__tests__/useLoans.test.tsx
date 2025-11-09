import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLoans } from '../useLoans'
import { supabase } from '@/integrations/supabase/client'

// Mock useUserRole
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true, loading: false })
}))

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

describe('useLoans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch loans successfully', async () => {
    const mockLoans = [
      {
        id: '1',
        equipment_id: 'eq1',
        equipment_name: 'Camera 1',
        borrower_name: 'John Doe',
        project: 'Project 1',
        loan_date: '2024-01-01',
        expected_return_date: '2024-01-15',
        status: 'active',
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLoans, error: null })
    } as any)

    const { result } = renderHook(() => useLoans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.loans).toHaveLength(1)
    expect(result.current.loans[0].borrowerName).toBe('John Doe')
  })

  it('should mark loans as overdue when past expected return date', async () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)
    
    const mockLoans = [
      {
        id: '1',
        equipment_id: 'eq1',
        equipment_name: 'Camera 1',
        borrower_name: 'John Doe',
        project: 'Project 1',
        loan_date: '2024-01-01',
        expected_return_date: pastDate.toISOString().split('T')[0],
        status: 'active',
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLoans, error: null })
    } as any)

    const { result } = renderHook(() => useLoans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.loans[0].status).toBe('overdue')
  })

  it('should filter loans by status', async () => {
    const mockLoans = [
      {
        id: '1',
        equipment_id: 'eq1',
        equipment_name: 'Camera 1',
        borrower_name: 'John',
        loan_date: '2024-01-01',
        expected_return_date: '2024-01-15',
        status: 'active',
        created_at: '2024-01-01'
      },
      {
        id: '2',
        equipment_id: 'eq2',
        equipment_name: 'Lens 1',
        borrower_name: 'Jane',
        loan_date: '2024-01-01',
        expected_return_date: '2024-01-10',
        actual_return_date: '2024-01-10',
        status: 'returned',
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLoans, error: null })
    } as any)

    const { result } = renderHook(() => useLoans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.setFilters({ status: 'active' as const })

    await waitFor(() => {
      expect(result.current.loans).toHaveLength(1)
      expect(result.current.loans[0].status).toBe('active')
    })
  })

  it('should calculate loan statistics correctly', async () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)

    const mockLoans = [
      {
        id: '1',
        equipment_id: 'eq1',
        equipment_name: 'Camera 1',
        borrower_name: 'John',
        loan_date: '2024-01-01',
        expected_return_date: '2024-01-15',
        status: 'active',
        created_at: '2024-01-01'
      },
      {
        id: '2',
        equipment_id: 'eq2',
        equipment_name: 'Lens 1',
        borrower_name: 'Jane',
        loan_date: '2024-01-01',
        expected_return_date: pastDate.toISOString().split('T')[0],
        status: 'active',
        created_at: '2024-01-01'
      },
      {
        id: '3',
        equipment_id: 'eq3',
        equipment_name: 'Tripod',
        borrower_name: 'Bob',
        loan_date: '2024-01-01',
        expected_return_date: '2024-01-10',
        actual_return_date: '2024-01-10',
        status: 'returned',
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLoans, error: null })
    } as any)

    const { result } = renderHook(() => useLoans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stats.total).toBe(3)
    expect(result.current.stats.active).toBe(1)
    expect(result.current.stats.overdue).toBe(1)
    expect(result.current.stats.returned).toBe(1)
  })

  it('should get active loan by equipment ID', async () => {
    const mockLoans = [
      {
        id: '1',
        equipment_id: 'eq1',
        equipment_name: 'Camera 1',
        borrower_name: 'John',
        loan_date: '2024-01-01',
        expected_return_date: '2024-01-15',
        status: 'active',
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLoans, error: null })
    } as any)

    const { result } = renderHook(() => useLoans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const activeLoan = result.current.getActiveLoanByEquipment('eq1')
    expect(activeLoan).toBeDefined()
    expect(activeLoan?.equipmentId).toBe('eq1')
  })

  it('should setup real-time subscription for admin users', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

    const { unmount } = renderHook(() => useLoans(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('loans-changes')
    })

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'loans'
      }),
      expect.any(Function)
    )

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })
})
