import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { InputController, InputState } from '../game/input';

interface TouchControlsProps {
  inputController: InputController | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputController,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth <= 900;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (!isTouchDevice || !inputController) return null;

  const bindTouch = (button: keyof InputState) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      inputController.setTouchButton(button, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      inputController.setTouchButton(button, false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      inputController.setTouchButton(button, false);
    },
  });

  return (
    <div className="fixed inset-x-0 bottom-14 sm:bottom-16 z-30 pointer-events-none flex items-end justify-between px-4 sm:px-8 select-none touch-none">
      {/* Left: Steer Left & Right */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          aria-label="Steer Left"
          {...bindTouch('left')}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#121621]/85 active:bg-[#00f0ff]/30 border-2 border-[#2e3854] active:border-[#00f0ff] flex items-center justify-center text-white shadow-xl backdrop-blur-md"
        >
          <ChevronLeft size={34} />
        </button>
        <button
          type="button"
          aria-label="Steer Right"
          {...bindTouch('right')}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#121621]/85 active:bg-[#00f0ff]/30 border-2 border-[#2e3854] active:border-[#00f0ff] flex items-center justify-center text-white shadow-xl backdrop-blur-md"
        >
          <ChevronRight size={34} />
        </button>
      </div>

      {/* Right: Brake & Gas */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          aria-label="Brake"
          {...bindTouch('brake')}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-950/80 active:bg-rose-600/50 border-2 border-rose-500/50 active:border-rose-400 flex items-center justify-center text-rose-200 font-display font-extrabold text-xs uppercase tracking-wider shadow-xl backdrop-blur-md"
        >
          BRAKE
        </button>
        <button
          type="button"
          aria-label="Gas"
          {...bindTouch('accelerate')}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-950/80 active:bg-emerald-500/50 border-2 border-emerald-400/60 active:border-emerald-300 flex items-center justify-center text-emerald-200 font-display font-black text-sm uppercase tracking-wider shadow-xl backdrop-blur-md"
        >
          GAS
        </button>
      </div>
    </div>
  );
};
