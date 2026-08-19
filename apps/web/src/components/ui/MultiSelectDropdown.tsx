"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Chọn...",
  className = "",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className="input mt-1 cursor-pointer flex items-center justify-between min-h-[42px] py-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 truncate pr-2 text-sm">
          {selected.length > 0 ? (
            <span className="text-slate-900 dark:text-slate-100">{selected.join(", ")}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2">
          {options.length === 0 ? (
            <div className="p-2 text-xs text-center text-slate-500">Không có lựa chọn</div>
          ) : (
            options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span className="text-sm select-none text-slate-700 dark:text-slate-200">{option}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
