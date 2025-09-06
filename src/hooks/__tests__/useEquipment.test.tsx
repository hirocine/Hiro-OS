import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEquipment } from '../useEquipment'
import { supabase } from '@/integrations/supabase/client'
import { createMockEquipment } from '@/test/utils/test-utils'

// Mock the supabase client
vi.mock('@/integrations/supabase/client')

describe('useEquipment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchEquipment', () => {
    it('should fetch equipment successfully', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Camera',
          brand: 'Canon',
          category: 'camera',
          status: 'available',
          item_type: 'main',
          created_at: '2024-01-01'
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: mockData, 
          error: null 
        })
      } as any)

      const { result } = renderHook(() => useEquipment())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.equipment).toHaveLength(1)
      expect(result.current.equipment[0]).toMatchObject({
        id: '1',
        name: 'Camera',
        brand: 'Canon',
        category: 'camera'
      })
      expect(result.current.error).toBe(null)
    })

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' }
        })
      } as any)

      const { result } = renderHook(() => useEquipment())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.equipment).toHaveLength(0)
      expect(result.current.error).toContain('Erro ao buscar equipamentos')
    })
  })

  describe('addEquipment', () => {
    it('should add equipment successfully', async () => {
      const newEquipment = createMockEquipment({ name: 'New Camera' })
      const mockResponse = { data: { id: '2', ...newEquipment }, error: null }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse)
      } as any)

      const { result } = renderHook(() => useEquipment())

      const addResult = await result.current.addEquipment(newEquipment)

      expect(addResult.success).toBe(true)
      expect(addResult.data).toMatchObject({ name: 'New Camera' })
    })

    it('should handle add equipment errors', async () => {
      const newEquipment = createMockEquipment()
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Insert failed' }
        })
      } as any)

      const { result } = renderHook(() => useEquipment())

      const addResult = await result.current.addEquipment(newEquipment)

      expect(addResult.success).toBe(false)
      expect(addResult.error).toContain('Erro ao adicionar equipamento')
    })
  })

  describe('filters and sorting', () => {
    it('should filter equipment by category', async () => {
      const mockData = [
        createMockEquipment({ id: '1', category: 'camera' }),
        createMockEquipment({ id: '2', category: 'audio' })
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      } as any)

      const { result } = renderHook(() => useEquipment())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      result.current.setFilters({ category: 'camera' })

      await waitFor(() => {
        expect(result.current.filteredEquipment).toHaveLength(1)
        expect(result.current.filteredEquipment[0].category).toBe('camera')
      })
    })

    it('should sort equipment properly', async () => {
      const { result } = renderHook(() => useEquipment())

      result.current.handleSort('name', 'asc')

      expect(result.current.filters.sortBy).toBe('name')
      expect(result.current.filters.sortOrder).toBe('asc')
    })
  })

  describe('equipment hierarchy', () => {
    it('should organize equipment in hierarchy structure', async () => {
      const mockData = [
        createMockEquipment({ id: '1', itemType: 'main' }),
        createMockEquipment({ id: '2', itemType: 'accessory', parentId: '1' })
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      } as any)

      const { result } = renderHook(() => useEquipment())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.equipmentHierarchy).toHaveLength(1)
      expect(result.current.equipmentHierarchy[0].item.id).toBe('1')
      expect(result.current.equipmentHierarchy[0].accessories).toHaveLength(1)
      expect(result.current.equipmentHierarchy[0].accessories[0].id).toBe('2')
    })
  })

  describe('stats calculation', () => {
    it('should calculate dashboard stats correctly', async () => {
      const mockData = [
        createMockEquipment({ status: 'available', category: 'camera', value: 1000 }),
        createMockEquipment({ status: 'maintenance', category: 'audio', value: 500 })
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      } as any)

      const { result } = renderHook(() => useEquipment())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.stats.total).toBe(2)
      expect(result.current.stats.available).toBe(1)
      expect(result.current.stats.maintenance).toBe(1)
      expect(result.current.stats.totalValue).toBe(1500)
    })
  })
})