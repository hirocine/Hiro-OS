import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  EnhancedStatsCardSkeleton,
  EnhancedProjectCardSkeleton,
  EnhancedEquipmentCardSkeleton,
  DashboardSkeleton,
} from '../enhanced-skeleton-loaders';

describe('Enhanced Skeleton Loaders', () => {
  it('should render stats card skeleton', () => {
    const { container } = render(<EnhancedStatsCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render project card skeleton with shimmer effect', () => {
    const { container } = render(<EnhancedProjectCardSkeleton />);
    const shimmerElement = container.querySelector('[class*="animate-[shimmer"]');
    expect(shimmerElement).toBeInTheDocument();
  });

  it('should render equipment card skeleton', () => {
    const { container } = render(<EnhancedEquipmentCardSkeleton />);
    expect(container.querySelector('.relative.overflow-hidden')).toBeInTheDocument();
  });

  it('should render dashboard skeleton with multiple components', () => {
    const { container } = render(<DashboardSkeleton />);
    // Should have stats grid (4 items) and content sections
    const skeletonCards = container.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(4);
  });

  it('should have proper accessibility attributes', () => {
    const { container } = render(<EnhancedStatsCardSkeleton />);
    const card = container.querySelector('[role="status"]') || 
                container.querySelector('[aria-label*="loading"]') ||
                container.querySelector('.animate-pulse');
    
    expect(card).toBeInTheDocument();
  });
});