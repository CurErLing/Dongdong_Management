import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '../../hooks/useDarkMode';

describe('useDarkMode', () => {
  it('toggles dark mode and updates document class', () => {
    const { result } = renderHook(() => useDarkMode());

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      const [, setIsDark] = result.current;
      setIsDark(true);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});


