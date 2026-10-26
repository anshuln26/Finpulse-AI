import React from 'react';

interface FormattedMessageProps {
  content: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  if (!content) return null;

  // Clean lines and split
  const lines = content.split('\n');

  const cleanText = (text: string): string => {
    return text.replace(/[*#]/g, '');
  };

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. Empty lines
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // 2. Headings (starts with # or ###)
        if (trimmed.startsWith('#')) {
          const headingText = cleanText(trimmed.replace(/^#+\s*/, ''));
          return (
            <div
              key={idx}
              className="text-base font-bold text-emerald-700 dark:text-emerald-400 pt-2 pb-0.5"
            >
              {headingText}
            </div>
          );
        }

        // 3. Bullet points (starts with -, *, or •)
        if (/^[-*•]\s+/.test(trimmed)) {
          const bulletText = cleanText(trimmed.replace(/^[-*•]\s+/, ''));
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-emerald-500 font-bold select-none text-xs mt-1 shrink-0">•</span>
              <span className="flex-1">{bulletText}</span>
            </div>
          );
        }

        // 4. Numbered lists (1., 2., etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = cleanText(numMatch[2]);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold select-none text-xs mt-0.5 shrink-0">
                {num}.
              </span>
              <span className="flex-1">{itemText}</span>
            </div>
          );
        }

        // 5. Indented strategy or sub-bullet
        if (line.startsWith('   -') || line.startsWith('   •') || line.startsWith('  *') || line.startsWith('  •')) {
          const subText = cleanText(line.trim().replace(/^[-*•]\s+/, ''));
          return (
            <div key={idx} className="flex items-start gap-2 pl-5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              <span className="text-slate-400 select-none">•</span>
              <span className="flex-1">{subText}</span>
            </div>
          );
        }

        // 6. Standard paragraph
        return (
          <p key={idx} className="my-0.5">
            {cleanText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
