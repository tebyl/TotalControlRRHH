import React, { useState } from "react";

interface ExpandableFieldsProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}

export function ExpandableSection({ title, children, defaultOpen = false, count }: ExpandableFieldsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{title}</span>
          {count !== undefined && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{count}</span>
          )}
        </div>
        <span className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

export function CollapsibleForm({
  sections,
}: {
  sections: Array<{
    title: string;
    icon?: string;
    count?: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }>;
}) {
  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <ExpandableSection key={i} title={`${section.icon || "📋"} ${section.title}`} count={section.count} defaultOpen={section.defaultOpen}>
          <div className="space-y-4">{section.children}</div>
        </ExpandableSection>
      ))}
    </div>
  );
}
