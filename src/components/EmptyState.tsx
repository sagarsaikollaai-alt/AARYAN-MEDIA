import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  onReset: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => {
  return (
    <div className="w-full py-20 px-4 bg-[#111111] border border-white/[0.08] rounded-[24px] text-center flex flex-col items-center justify-center my-8">
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
        <SearchX className="w-8 h-8 text-zinc-400" />
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
        No Courses Found
      </h3>

      <p className="text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
        Try another category or search keyword.
      </p>

      <button
        onClick={onReset}
        className="px-5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#D7FF2F] text-white hover:text-black border border-white/[0.12] hover:border-[#D7FF2F] text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};
