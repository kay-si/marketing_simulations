"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  noResultsLabel: string;
  disabled?: boolean;
  id?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  noResultsLabel,
  disabled,
  id,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? "",
    [options, value]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        placeholder={placeholder}
        value={isOpen ? query : selectedLabel}
        disabled={disabled}
        onFocus={() => {
          setIsOpen(true);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        autoComplete="off"
      />
      {isOpen && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded border border-zinc-300 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-zinc-500 dark:text-zinc-400">
              {noResultsLabel}
            </li>
          ) : (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
