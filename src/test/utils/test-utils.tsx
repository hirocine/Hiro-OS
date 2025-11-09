import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="ui-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const createMockEquipment = (overrides = {}) => ({
  id: 'test-id-1',
  name: 'Test Equipment',
  brand: 'Test Brand',
  category: 'camera' as const,
  status: 'available' as const,
  itemType: 'main' as const,
  ...overrides
})

export const createMockProject = (overrides = {}) => ({
  id: 'test-project-1',
  name: 'Test Project',
  description: 'Test project description',
  startDate: '2024-01-01',
  expectedEndDate: '2024-02-01',
  status: 'active' as const,
  step: 'pending_separation' as const,
  stepHistory: [],
  responsibleName: 'Test User',
  equipmentCount: 0,
  loanIds: [],
  ...overrides
})

export const createMockLoan = (overrides = {}) => ({
  id: 'test-loan-1',
  equipmentId: 'test-equipment-1',
  equipmentName: 'Test Equipment',
  borrowerName: 'Test Borrower',
  loanDate: '2024-01-01',
  expectedReturnDate: '2024-01-15',
  status: 'active' as const,
  ...overrides
})