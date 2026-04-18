import { useCallback, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export function useMeasuredWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth((prev) => (Math.abs(prev - w) > 0.5 ? w : prev));
  }, []);
  return [width, onLayout] as const;
}
