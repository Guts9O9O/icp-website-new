import { useRef } from 'react';
import { Textarea } from './ui';

/**
 * A plain textarea with one formatting control.
 *
 * Used where the text is a short block of lines rather than a document — a
 * client's name and town, say — so the line-per-row meaning has to survive,
 * which a full editor would flatten. Bold is written as **…**, the same marker
 * the write-ups use, and the public page renders it through the same code.
 */
export default function BoldableTextarea({ value, onChange, ...props }) {
  const ref = useRef(null);

  const toggleBold = () => {
    const el = ref.current;
    if (!el) return;
    const text = value ?? '';
    const [start, end] = [el.selectionStart, el.selectionEnd];
    // Nothing selected: take the line the caret is on, which is what someone
    // means by "make this bold" in a three-line address.
    let [from, to] = [start, end];
    if (from === to) {
      from = text.lastIndexOf('\n', from - 1) + 1;
      const nl = text.indexOf('\n', to);
      to = nl === -1 ? text.length : nl;
    }
    const chosen = text.slice(from, to);
    if (!chosen.trim()) return;

    const bolded = chosen.startsWith('**') && chosen.endsWith('**') && chosen.length > 4;
    const next = bolded ? chosen.slice(2, -2) : `**${chosen}**`;
    onChange(text.slice(0, from) + next + text.slice(to));
    // Keep the same words selected so the button can be pressed again.
    const shift = bolded ? -2 : 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(from, to + shift * 2);
    });
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <button
          type="button"
          title="Bold the selected text, or the line the cursor is on (Ctrl+B)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleBold}
          className="h-8 min-w-8 rounded px-2 text-[13px] font-bold text-icp-slate transition-colors hover:bg-[#f0edea]"
        >
          B
        </button>
        <span className="text-[12px] text-icp-slate/60">Select a line and press B to set it bold.</span>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            toggleBold();
          }
        }}
        {...props}
      />
    </div>
  );
}
