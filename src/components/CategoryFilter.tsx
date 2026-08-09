import React, { useState, useEffect, useRef } from 'react';
import { CategoryType } from '../types';
import { CATEGORIES } from '../data/courses';
import { ChevronDown, Check } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on tap/click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (cat: CategoryType) => {
    onSelectCategory(cat);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="mt-6" ref={dropdownRef}>

      {/* ═══════ MOBILE: Dropdown Button + Menu ═══════ */}
      <div className="md:hidden">
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-between bg-[#111111] border border-white/[0.08] hover:border-white/20 rounded-full px-4 py-2.5 text-sm text-white font-medium transition-colors"
        >
          <span>{selectedCategory === 'All' ? 'All Categories' : selectedCategory}</span>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Animated Dropdown Panel */}
        <div
          className={`mt-2 bg-[#111111] border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-200 ease-out origin-top ${
            isOpen
              ? 'opacity-100 scale-y-100 max-h-[400px] border-white/[0.12]'
              : 'opacity-0 scale-y-95 max-h-0 pointer-events-none border-transparent'
          }`}
        >
          <div className="py-1.5">
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleSelect(cat)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? 'text-[#D7FF2F] bg-[#D7FF2F]/5'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{cat === 'All' ? 'All Categories' : cat}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════ DESKTOP: Horizontal Chips (unchanged) ═══════ */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-[#D7FF2F] text-black'
                : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

    </div>
  );
}