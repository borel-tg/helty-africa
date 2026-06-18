import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_LOGO_SCALE,
  LOGO_SCALE_MAX,
  LOGO_SCALE_MIN,
} from "../../lib/certificate/defaults";

export function LogoSizeControl({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const scale = value ?? DEFAULT_LOGO_SCALE;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
        {label}
        <span className="text-text-secondary font-normal">({scale}%)</span>
      </button>

      {open && (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{LOGO_SCALE_MIN}%</span>
            <span className="font-medium text-text-primary">{scale}%</span>
            <span>{LOGO_SCALE_MAX}%</span>
          </div>
          <input
            type="range"
            min={LOGO_SCALE_MIN}
            max={LOGO_SCALE_MAX}
            step={5}
            value={scale}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label={label}
          />
        </div>
      )}
    </div>
  );
}
