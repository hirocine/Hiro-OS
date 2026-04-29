import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSSDs } from '../useSSDs'
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

describe('useSSDs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch SSDs successfully', async () => {
    const mockSSDs = [
      {
        id: '1',
        name: 'SSD Samsung 512GB',
        brand: 'Samsung',
        category: 'storage',
        subcategory: 'SSD',
        status: 'available',
        item_type: 'main',
        display_order: 0,
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockSSDs, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    const { result } = renderHook(() => useSSDs(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.ssds).toHaveLength(1)
    expect(result.current.ssds[0].name).toBe('SSD Samsung 512GB')
  })

  it('should handle fetch errors', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })
    } as any)

    const { result } = renderHook(() => useSSDs(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.ssds).toEqual([])
  })

  it('should organize SSDs by status columns', async () => {
    const mockSSDs = [
      {
        id: '1',
        name: 'Available SSD',
        category: 'storage',
        subcategory: 'SSD',
        status: 'available',
        item_type: 'main',
        display_order: 0,
        created_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'In Use SSD',
        category: 'storage',
        subcategory: 'SSD',
        status: 'available',
        item_type: 'main',
        display_order: 1000,
        created_at: '2024-01-02'
      },
      {
        id: '3',
        name: 'Loaned SSD',
        category: 'storage',
        subcategory: 'SSD',
        status: 'loaned',
        item_type: 'main',
        display_order: 2000,
        created_at: '2024-01-03'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockSSDs, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    const { result } = renderHook(() => useSSDs(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.ssdsByStatus.available).toHaveLength(1)
    expect(result.current.ssdsByStatus.in_use).toHaveLength(1)
    expect(result.current.ssdsByStatus.loaned).toHaveLength(1)
  })

  it('should update SSD status successfully', async () => {
    const mockSSDs = [
      {
        id: '1',
        name: 'Test SSD',
        category: 'storage',
        subcategory: 'SSD',
        status: 'available',
        item_type: 'main',
        display_order: 0,
        created_at: '2024-01-01'
      }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockSSDs, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockReturnThis()
    } as any)

    const { result } = renderHook(() => useSSDs(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.updateSSDStatus('1', 'in_use')

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('equipments')
    })
  })

  it('should load SSD allocations', async () => {
    const mockSSDs = [
      {
        id: '1',
        name: 'SSD 1',
        category: 'storage',
        subcategory: 'SSD',
        status: 'available',
        item_type: 'main',
        display_order: 1000,
        created_at: '2024-01-01'
      }
    ]

    const mockAllocations = [
      { ssd_id: '1', allocated_gb: 256 }
    ]

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'equipments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockSSDs, error: null })
        } as any
      } else if (table === 'ssd_allocations' && callCount++ > 0) {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockAllocations, error: null })
        } as any
      }
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any
    }) as any)

    const { result } = renderHook(() => useSSDs(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.ssdAllocations).toBeDefined()
  })

  it('should setup real-time subscription', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    }

    vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

    const { unmount } = renderHook(() => useSSDs(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('storage-equipment-changes')
    })

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'equipments',
        filter: 'category=eq.storage'
      }),
      expect.any(Function)
    )

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })
})
