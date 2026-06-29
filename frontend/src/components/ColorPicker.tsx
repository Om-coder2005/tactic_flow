import React from 'react';
import { cn } from '@/lib/utils';
import { Pipette } from 'lucide-react';

const PRESET_COLORS = [
  '#dc2626', // Retro Red
  '#2563eb', // Retro Blue
  '#16a34a', // Retro Green
  '#eab308', // Mustard
  '#9333ea', // Purple
  '#ffffff', // White
  '#0f172a', // Ink
  '#78716c', // Stone
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onBlur?: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, onBlur }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              onChange(color);
              if (onBlur) onBlur();
            }}
            className={cn(
              "w-6 h-6 flex-shrink-0 rounded-lg border-2 transition-all transform hover:scale-110 active:scale-95 shadow-sm",
              value.toLowerCase() === color.toLowerCase() 
                ? "border-retro-mustard ring-2 ring-retro-mustard/20 scale-110 shadow-material-1" 
                : "border-white dark:border-surface-600"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        
        <div className="relative group flex-shrink-0">
          <label className={cn(
             "w-6 h-6 flex-shrink-0 rounded-lg border-2 border-surface-200 dark:border-surface-500 flex items-center justify-center cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shadow-sm",
             !PRESET_COLORS.includes(value.toLowerCase()) && "border-retro-mustard ring-2 ring-retro-mustard/20 shadow-material-1"
          )}>
            <Pipette className="w-3.5 h-3.5 text-surface-400 shrink-0" />
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              className="sr-only"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
