interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 border-t border-zinc-700"></div>
      <span className="text-xs font-semibold text-zinc-400 px-3">
        {date}
      </span>
      <div className="flex-1 border-t border-zinc-700"></div>
    </div>
  );
}
