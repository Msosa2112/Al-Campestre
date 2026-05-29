"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface CustomSelectProps {
  options: SelectOption[] | SelectGroup[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  className,
  triggerClassName,
  dropdownClassName,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to determine if options list is grouped
  const isGroupedList = useMemo(() => {
    return options.length > 0 && "options" in options[0];
  }, [options]);

  const selectedOption = useMemo(() => {
    if (isGroupedList) {
      const groups = options as SelectGroup[];
      for (const group of groups) {
        const found = group.options.find((opt) => opt.value === value);
        if (found) return found;
      }
      return undefined;
    } else {
      const flatOptions = options as SelectOption[];
      return flatOptions.find((opt) => opt.value === value);
    }
  }, [options, value, isGroupedList]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderOptionButton = (opt: SelectOption) => {
    const isSelected = opt.value === value;
    return (
      <button
        key={opt.value}
        type="button"
        onClick={() => {
          onChange(opt.value);
          setIsOpen(false);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition-all duration-150 cursor-pointer focus:outline-none focus:bg-[#2D6A4F]/5",
          isSelected
            ? "bg-[#2D6A4F]/10 text-[#2D6A4F] font-bold"
            : "hover:bg-[#2D6A4F]/5 text-[#1A2421]/80 font-medium"
        )}
      >
        <span className="truncate">{opt.label}</span>
        {isSelected && (
          <Check size={12} className="stroke-[3] text-[#2D6A4F] shrink-0 ml-2" />
        )}
      </button>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-[#40916C]/15 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#1A2421] outline-none shadow-sm transition-all focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/10 cursor-pointer text-left",
          isOpen && "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/10",
          triggerClassName
        )}
      >
        <span className={cn("block truncate", !selectedOption && "text-[#1A2421]/45")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-[#40916C]/70 transition-transform duration-200 shrink-0 ml-2",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-full rounded-2xl border border-[#40916C]/15 bg-white/95 backdrop-blur-md p-1.5 shadow-lg animate-fadeIn max-h-60 overflow-y-auto scrollbar-thin",
            dropdownClassName
          )}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#1A2421]/50 text-center font-medium">
              No hay opciones disponibles
            </div>
          ) : isGroupedList ? (
            (options as SelectGroup[]).map((group, gIdx) => (
              <div key={gIdx} className="mb-2 last:mb-0">
                <div className="px-3 py-1 text-[9px] font-bold text-[#2D6A4F]/70 uppercase tracking-wider bg-[#2D6A4F]/5 rounded-lg select-none mb-1">
                  {group.label}
                </div>
                <div className="flex flex-col gap-0.5 pl-1.5 pr-0.5">
                  {group.options.map((opt) => renderOptionButton(opt))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-0.5">
              {(options as SelectOption[]).map((opt) => renderOptionButton(opt))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
