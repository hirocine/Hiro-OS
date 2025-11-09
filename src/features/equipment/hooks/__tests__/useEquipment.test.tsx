import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEquipment } from '../useEquipment'
import { supabase } from '@/integrations/supabase/client'

// Create wrapper with QueryClient
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

describe('useEquipment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch equipment successfully', async () => {
    const mockEquipment = [
      {
        id: '1',
        name: 'Camera 1',
        brand: 'Sony',
        category: 'camera',
        status: 'available',
        item_type: 'main',
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockEquipment, error: null })
    } as any)

    const { result } = renderHook(() => useEquipment(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.equipment).toHaveLength(1)
    expect(result.current.equipment[0].name).toBe('Camera 1')
  })

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })
    } as any)

    const { result } = renderHook(() => useEquipment(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.equipment).toEqual([])
  })

  it('should add equipment successfully', async () => {
    const newEquipment = {
      name: 'New Camera',
      brand: 'Canon',
      category: 'camera' as const,
      status: 'available' as const,
      itemType: 'main' as const
    }

    const mockInsertResponse = {
      id: '2',
      ...newEquipment,
      item_type: 'main',
      created_at: '2024-01-02'
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockInsertResponse, error: null })
    } as any)

    const { result } = renderHook(() => useEquipment(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.addEquipment(newEquipment)

    expect(supabase.from).toHaveBeenCalledWith('equipments')
  })

  it('should filter equipment by category', async () => {
    const mockEquipment = [
      {
        id: '1',
        name: 'Camera 1',
        brand: 'Sony',
        category: 'camera',
        status: 'available',
        item_type: 'main',
        created_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Lens 1',
        brand: 'Canon',
        category: 'lens',
        status: 'available',
        item_type: 'main',
        created_at: '2024-01-02'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockEquipment, error: null })
    } as any)

    const { result } = renderHook(() => useEquipment(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.setFilters({ category: 'camera' as const })

    await waitFor(() => {
      expect(result.current.filteredEquipment).toHaveLength(1)
      expect(result.current.filteredEquipment[0].category).toBe('camera')
    })
  })

  it('should calculate statistics correctly', async () => {
    const mockEquipment = [
      {
        id: '1',
        name: 'Camera 1',
        brand: 'Sony',
        category: 'camera',
        status: 'available',
        item_type: 'main',
        value: 1000,
        created_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Lens 1',
        brand: 'Canon',
        category: 'lens',
        status: 'loaned',
        item_type: 'main',
        value: 500,
        created_at: '2024-01-02'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockEquipment, error: null })
    } as any)

    const { result } = renderHook(() => useEquipment(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stats.total).toBe(2)
    expect(result.current.stats.available).toBe(1)
    expect(result.current.stats.inUse).toBe(1)
    expect(result.current.stats.totalValue).toBe(1500)
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

    const { unmount } = renderHook(() => useEquipment(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('equipments-changes')
    })

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'equipments'
      }),
      expect.any(Function)
    )

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })
})
