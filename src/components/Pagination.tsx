import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 border transition-all duration-200 ${
          currentPage === 1
            ? 'opacity-40 cursor-not-allowed border-white/[0.06] text-zinc-600 bg-transparent'
            : 'border-white/[0.1] text-zinc-300 hover:text-white hover:border-[#D7FF2F] hover:bg-white/[0.04]'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5 px-2">
        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center border ${
                isActive
                  ? 'bg-[#D7FF2F] text-black border-[#D7FF2F] shadow-sm'
                  : 'bg-[#111111] text-zinc-400 hover:text-white border-white/[0.08] hover:border-white/20'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 border transition-all duration-200 ${
          currentPage === totalPages
            ? 'opacity-40 cursor-not-allowed border-white/[0.06] text-zinc-600 bg-transparent'
            : 'border-white/[0.1] text-zinc-300 hover:text-white hover:border-[#D7FF2F] hover:bg-white/[0.04]'
        }`}
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
