"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "../i18n/routing";
import { Globe, Check, ChevronDown } from "lucide-react";

export interface LanguageOption {
  code: "en" | "hi" | "ta" | "bn";
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

interface LanguageSelectorProps {
  className?: string;
  isCompact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  isCompact = false,
}) => {
  const currentLocale = useLocale() as "en" | "hi" | "ta" | "bn";
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLocale) ||
    SUPPORTED_LANGUAGES[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < SUPPORTED_LANGUAGES.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : SUPPORTED_LANGUAGES.length - 1
        );
      } else if (e.key === "Tab") {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  const selectLanguage = (code: "en" | "hi" | "ta" | "bn") => {
    if (code === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Persist to cookie and localStorage
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000;SameSite=Lax`;
    try {
      localStorage.setItem("NEXT_LOCALE", code);
    } catch {
      // ignore storage error
    }

    setIsOpen(false);
    // Smooth locale switch while preserving the current route
    router.replace(pathname, { locale: code });
  };

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select language. Current language is ${currentLanguage.nativeName}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[#374151] hover:text-[#111827] bg-[#fbfbfa] hover:bg-[#f3f4f6] rounded-xl border border-[#eae8e3] transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff5b45]/30"
      >
        <Globe className="w-3.5 h-3.5 text-[#ff5b45]" aria-hidden="true" />
        <span className="font-semibold text-xs text-[#111827]">
          {isCompact ? currentLanguage.code.toUpperCase() : currentLanguage.nativeName}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#6b7280] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available languages"
          className="absolute right-0 mt-1.5 w-40 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl border border-[#eae8e3] z-50 animate-fadeIn focus:outline-none"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] border-b border-[#f3f4f6] mb-1">
            Language / भाषा
          </div>
          {SUPPORTED_LANGUAGES.map((lang, index) => {
            const isSelected = lang.code === currentLocale;
            return (
              <button
                key={lang.code}
                ref={(el) => {
                  optionsRef.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => selectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-[#fff5f3] text-[#ff5b45] font-bold"
                    : "text-[#374151] hover:text-[#111827] hover:bg-[#fbfbfa]"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">
                    {lang.nativeName}
                  </span>
                  <span className="text-[10px] text-[#9ca3af] font-normal">
                    {lang.name}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#ff5b45]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
