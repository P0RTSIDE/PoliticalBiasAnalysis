"use client";

import { cn } from "@/lib/utils";

interface TopicSelectorProps {
  topics: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function TopicSelector({
  topics,
  selected,
  onChange,
}: TopicSelectorProps) {
  const allSelected = selected.length === topics.length;

  function toggle(topic: string) {
    if (selected.includes(topic)) {
      onChange(selected.filter((t) => t !== topic));
    } else {
      onChange([...selected, topic]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
          Topics
        </span>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : topics)}
          className="font-mono text-[11px] uppercase tracking-widest text-highlight hover:underline"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div
        role="group"
        aria-label="Filter topics"
        className="flex flex-wrap gap-2"
      >
        {topics.map((topic) => {
          const active = selected.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(topic)}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-highlight bg-highlight/10 text-text-primary"
                  : "border-hairline bg-surface text-text-secondary hover:border-text-secondary hover:text-text-primary"
              )}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
