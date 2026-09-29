import React, { useState, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  subtitle?: React.ReactNode;
  shortcut?: string;
  position?: TooltipPosition;
  delay?: number;
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'red' | 'emerald' | 'glass';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  subtitle,
  shortcut,
  position = 'top',
  delay = 100,
  children,
  className = '',
  variant = 'dark',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowPositionClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#252c38] border-r-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#252c38] border-r-transparent border-t-transparent border-l-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#252c38] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#252c38] border-t-transparent border-b-transparent border-l-transparent',
  };

  const variantStyles = {
    dark: 'bg-[#151a24]/95 border-[#283244] text-gray-100 shadow-xl shadow-black/60 backdrop-blur-md',
    red: 'bg-[#1e1014]/95 border-red-500/40 text-red-100 shadow-xl shadow-red-950/40 backdrop-blur-md',
    emerald: 'bg-[#0c1a16]/95 border-emerald-500/40 text-emerald-100 shadow-xl shadow-emerald-950/40 backdrop-blur-md',
    glass: 'bg-[#0f141f]/85 border-white/10 text-white shadow-2xl backdrop-blur-xl',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses[position]} z-50 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95`}
        >
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-sans whitespace-nowrap flex flex-col gap-0.5 min-w-max ${variantStyles[variant]}`}
          >
            <div className="flex items-center justify-between gap-3 font-semibold tracking-wide">
              <span>{content}</span>
              {shortcut && (
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px] text-gray-300">
                  {shortcut}
                </kbd>
              )}
            </div>
            {subtitle && (
              <span className="text-[10px] text-gray-400 font-normal leading-tight">
                {subtitle}
              </span>
            )}
          </div>
          {/* Arrow indicator */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowPositionClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
