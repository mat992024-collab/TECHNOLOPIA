import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const isMouseDown = useRef<boolean>(false);
  const wheelAccumulator = useRef<number>(0);
  const wheelTimeout = useRef<any>(null);
  const threshold = 70;

  const isAtTop = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    if (window.scrollY > 5) return false;
    if (containerRef.current) {
      let el: HTMLElement | null = containerRef.current;
      while (el && el !== document.body) {
        if (el.scrollTop > 5) return false;
        el = el.parentElement;
      }
    }
    return true;
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setPullDistance(threshold);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {}
    }

    try {
      await onRefresh();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
    }
  }, [isRefreshing, onRefresh]);

  // معالجات اللمس للموبايل والتابلت (Touch Handlers)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAtTop() && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0 && isAtTop()) {
      const distance = Math.min(diff * 0.45, 110);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // معالجات الماوس للابتوب والكمبيوتر (Mouse Drag Handlers)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && isAtTop() && !isRefreshing && e.clientY < 280) {
      startY.current = e.clientY;
      isMouseDown.current = true;
      isPulling.current = true;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current || isRefreshing) return;
      const diff = e.clientY - startY.current;

      if (diff > 0 && isAtTop()) {
        const distance = Math.min(diff * 0.45, 110);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
      }
    };

    const handleMouseUp = () => {
      if (!isMouseDown.current) return;
      isMouseDown.current = false;
      isPulling.current = false;

      if (pullDistance >= threshold && !isRefreshing) {
        triggerRefresh();
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pullDistance, isRefreshing, isAtTop, triggerRefresh]);

  // معالجات التراك باد للابتوب (Laptop Touchpad / Wheel Events at Top)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (isRefreshing) return;

      // عند سحب إصبعين للأسفل على تراك باد اللابتوب وأنت في أعلى الصفحة
      if (isAtTop() && e.deltaY < 0) {
        wheelAccumulator.current += Math.abs(e.deltaY) * 0.35;
        const currentDistance = Math.min(wheelAccumulator.current, 100);
        setPullDistance(currentDistance);

        clearTimeout(wheelTimeout.current);
        wheelTimeout.current = setTimeout(() => {
          if (wheelAccumulator.current >= threshold) {
            triggerRefresh();
          } else {
            setPullDistance(0);
          }
          wheelAccumulator.current = 0;
        }, 180);
      } else if (e.deltaY > 0) {
        wheelAccumulator.current = 0;
        setPullDistance(0);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout.current);
    };
  }, [isRefreshing, isAtTop, triggerRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className={`relative min-h-screen ${isMouseDown.current && pullDistance > 10 ? 'cursor-grabbing select-none' : ''}`}
    >
      {/* مؤشر السحب للتحديث: يعمل على الموبايل واللابتوب والكمبيوتر */}
      <div
        className="overflow-hidden transition-all duration-200 flex items-center justify-center py-1"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 8 ? Math.min(pullDistance / threshold, 1) : 0
        }}
      >
        <button
          onClick={triggerRefresh}
          className="flex items-center gap-2 py-2 px-4 rounded-full bg-slate-900/95 border border-slate-700 shadow-2xl text-xs font-bold text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer pointer-events-auto"
          title="اضغط أو اسحب للتحديث الفوري"
        >
          <RefreshCw
            className={`w-4 h-4 text-emerald-400 ${
              isRefreshing
                ? 'animate-spin'
                : pullDistance >= threshold
                ? 'rotate-180 transition-transform'
                : ''
            }`}
          />
          <span>
            {isRefreshing
              ? 'جاري تحديث المنصة والبيانات لحظياً...'
              : pullDistance >= threshold
              ? 'اترك للتحديث الآن ✨'
              : 'اسحب للأسفل بالماوس أو التاتش للتحديث'}
          </span>
        </button>
      </div>

      {children}
    </div>
  );
};
