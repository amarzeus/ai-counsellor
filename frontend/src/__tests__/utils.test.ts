/**
 * Utility function tests
 */
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
    it('should merge class names', () => {
        const result = cn('text-red', 'bg-blue');
        expect(result).toContain('text-red');
        expect(result).toContain('bg-blue');
    });

    it('should handle conditional classes', () => {
        const isActive = true;
        const result = cn('base-class', isActive && 'active');
        expect(result).toContain('base-class');
        expect(result).toContain('active');
    });

    it('should handle false conditions', () => {
        const isActive = false;
        const result = cn('base-class', isActive && 'active');
        expect(result).toContain('base-class');
        expect(result).not.toContain('active');
    });

    it('should merge tailwind classes correctly', () => {
        // tailwind-merge should resolve conflicts
        const result = cn('px-4', 'px-6');
        expect(result).toBe('px-6');
    });

    it('should handle arrays of classes', () => {
        const result = cn(['class-a', 'class-b']);
        expect(result).toContain('class-a');
        expect(result).toContain('class-b');
    });

    it('should handle undefined and null', () => {
        const result = cn('valid', undefined, null, 'another');
        expect(result).toBe('valid another');
    });
});
