import { useState } from 'react';
import { WeeklySummary } from './WeeklySummary';

interface WeeklySummaryButtonProps {
  userId: string;
}

export function WeeklySummaryButton({ userId }: WeeklySummaryButtonProps) {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowSummary(!showSummary)}
        className="w-full px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors text-sm font-medium flex items-center justify-between"
      >
        <span>Weekly Summary</span>
        <span className="text-zinc-500">{showSummary ? '▼' : '▶'}</span>
      </button>
      {showSummary && (
        <div className="mt-4">
          <WeeklySummary userId={userId} />
        </div>
      )}
    </div>
  );
}
