"use client";

import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
  type ChangeEvent,
} from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

function GooeyFilter({
  filterId,
  blur,
}: {
  filterId: string;
  blur: number;
}) {
  return (
    <svg className="absolute hidden h-0 w-0" aria-hidden>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function SearchIcon({ layoutId }: { layoutId: string }) {
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className="size-4 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </motion.svg>
  );
}

const transition = {
  duration: 0.4,
  type: "spring" as const,
  bounce: 0.25,
};

const iconBubbleVariants = {
  collapsed: { scale: 0, opacity: 0 },
  expanded: { scale: 1, opacity: 1 },
};

export interface GooeyInputClassNames {
  root?: string;
  filterWrap?: string;
  buttonRow?: string;
  trigger?: string;
  input?: string;
  bubble?: string;
  bubbleSurface?: string;
}

export interface GooeyInputProps {
  placeholder?: string;
  className?: string;
  classNames?: GooeyInputClassNames;
  /** Collapsed control width in px */
  collapsedWidth?: number;
  /** Expanded control width in px */
  expandedWidth?: number;
  /** Horizontal offset when expanded (px), aligns detached bubble */
  expandedOffset?: number;
  /** Gaussian blur amount for the gooey SVG filter */
  gooeyBlur?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function GooeyInput({
  placeholder = "Type to search...",
  className,
  classNames,
  collapsedWidth = 40,
  expandedWidth = 280,
  expandedOffset = 48,
  gooeyBlur = 10,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onOpenChange,
  disabled = false,
  id,
}: GooeyInputProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const filterId = `gooey-filter-${safeId}`;
  const iconLayoutId = `gooey-input-icon-${safeId}`;
  const inputLayoutId = `gooey-input-field-${safeId}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const prevExpandedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = valueProp !== undefined;
  const searchText = isControlled ? valueProp : uncontrolledValue;

  const setSearchText = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const setExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else if (prevExpandedRef.current) {
      setSearchText("");
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, setSearchText]);

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: collapsedWidth, marginLeft: 0 },
      expanded: { width: expandedWidth, marginLeft: expandedOffset },
    }),
    [collapsedWidth, expandedWidth, expandedOffset],
  );

  const handleExpand = useCallback(() => {
    if (!disabled) setExpanded(true);
  }, [disabled, setExpanded]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const handleBlur = useCallback(() => {
    if (!searchText) setExpanded(false);
  }, [searchText, setExpanded]);

  const displayPlaceholder = isExpanded
    ? placeholder
    : (collapsedWidth >= 85 ? "Buscar producto" : "");

  return (
    <div
      className={cn(
        "relative flex items-center justify-start group",
        className,
        classNames?.root,
      )}
    >
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />

      {/* --- BACKGROUND LAYER (GOOEY FILTER APPLIED) --- */}
      <div
        className="absolute inset-y-0 left-0 right-0 pointer-events-none flex h-10 items-center justify-start"
        style={{ filter: `url(#${filterId})` }}
      >
        <motion.div
          className="flex h-10 items-center justify-center"
          variants={buttonVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div
            className={cn(
              "h-10 w-full rounded-full border bg-[#FFFFFF] shadow-sm transition-all duration-300",
              "group-hover:border-[#40916C]/25",
              classNames?.trigger,
            )}
            style={{
              borderColor: 'rgba(64, 145, 108, 0.15)'
            }}
          />
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-0 flex size-10 -translate-y-1/2 items-center justify-center"
          variants={iconBubbleVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div
            className={cn(
              "size-10 rounded-full bg-[#2D6A4F] border shadow-md transition-all duration-300",
              classNames?.bubbleSurface,
            )}
            style={{
              borderColor: 'rgba(194, 76, 42, 0.1)'
            }}
          />
        </motion.div>
      </div>

      {/* --- FOREGROUND LAYER (NO FILTER, PERFECTLY CRISP TEXT & ICONS) --- */}
      <div className="relative flex h-10 items-center justify-start w-full">
        <motion.div
          className={cn("flex h-10 items-center justify-center", classNames?.buttonRow)}
          variants={buttonVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={handleExpand}
            className="flex h-10 w-full cursor-pointer items-center justify-start gap-2 rounded-full px-4 text-sm font-medium outline-none bg-transparent border-none shadow-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]/30 disabled:pointer-events-none disabled:opacity-50"
          >
            {!isExpanded ? (
              <SearchIcon layoutId={iconLayoutId} />
            ) : null}
            <motion.input
              id={id}
              layoutId={inputLayoutId}
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={searchText}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={disabled || !isExpanded}
              placeholder={displayPlaceholder}
              className={cn(
                "h-full min-w-0 flex-1 bg-transparent text-sm text-[#1A2421] outline-none",
                isExpanded
                  ? "placeholder:text-[#1A2421]/45 opacity-100"
                  : (collapsedWidth >= 85 
                      ? "pointer-events-none opacity-100" 
                      : "pointer-events-none opacity-0 w-0 flex-none"),
                classNames?.input,
              )}
            />
          </button>
        </motion.div>

        <motion.div
          className={cn(
            "absolute top-1/2 left-0 flex size-10 -translate-y-1/2 items-center justify-center pointer-events-none",
            classNames?.bubble,
          )}
          variants={iconBubbleVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div className="flex size-10 items-center justify-center rounded-full text-[#FFFFFF]">
            <SearchIcon layoutId={iconLayoutId} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

