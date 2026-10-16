import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import TextAlign from '@tiptap/extension-text-align';
import { isHtml, toEditorHtml } from '../../lib/richTextFormat';

/**
 * A Word-style editor for the write-ups the studio maintains: the About page,
 * team bios, the segment introductions and project descriptions.
 *
 * It saves HTML, which the public site rebuilds element by element from a
 * fixed list (src/lib/richText.jsx) — so everything on this toolbar shows on
 * the site, and nothing else can. Write-ups saved before it, in the older
 * plain-text format, open here converted and stay as they were until edited.
 *
 * Sizes are named levels rather than pixels on purpose. Every size on the site
 * is computed from the 2560 artboard, so a literal pixel size would stop
 * scaling with it and break on a laptop; Small / Normal / Large each map to a
 * step relative to the text around them. Colour works the same way: "Soft"
 * is the lighter shade the site already uses for secondary lines, whichever
 * background the write-up lands on, rather than a colour picked off a wheel.
 */

// --- extensions ----------------------------------------------------------

// Paragraphs carry a size level: small, normal (no attribute) or large.
const SizedParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-size') || (el.getAttribute('data-small') === 'true' ? 'small' : null),
        renderHTML: (attrs) => (attrs.size ? { 'data-size': attrs.size } : {}),
      },
    };
  },
});

// Softer text, for an aside or a secondary line.
const Soft = Mark.create({
  name: 'soft',
  parseHTML: () => [{ tag: 'span[data-tone="muted"]' }],
  renderHTML: () => ['span', { 'data-tone': 'muted' }, 0],
});

// One list for every editor on the page, made once (see the note in the
// component on why it must not be rebuilt per render).
const EXTENSIONS = [
  StarterKit.configure({
    paragraph: false, // replaced by SizedParagraph
    heading: { levels: [3, 4] },
    codeBlock: false,
    code: false,
    trailingNode: false, // an always-empty last line would be saved as a gap at the foot
    link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
  }),
  SizedParagraph,
  Soft,
  TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
];

// --- toolbar pieces --------------------------------------------------------

const BTN = 'flex h-8 min-w-8 items-center justify-center rounded px-2 text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-35';
const ON = 'bg-icp-red text-white';
const OFF = 'text-icp-slate hover:bg-[#f0edea]';

function Tool({ active, onClick, title, disabled, children, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the selection while clicking
      onClick={onClick}
      className={`${BTN} ${active ? ON : OFF} ${className}`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-icp-mist" />;

// Small line icons, drawn like Word's: four rules set against an edge.
function AlignIcon({ side }) {
  const rows = { left: [16, 10, 16, 10], center: [16, 10, 16, 10], right: [16, 10, 16, 10], justify: [16, 16, 16, 16] }[side];
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      {rows.map((w, i) => {
        const x = side === 'right' ? 16 - w : side === 'center' ? (16 - w) / 2 : 0;
        return <rect key={i} x={x} y={i * 3.6} width={w} height="1.6" rx="0.8" fill="currentColor" />;
      })}
    </svg>
  );
}

function IndentIcon({ out }) {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      <rect x="0" y="0" width="16" height="1.6" rx="0.8" fill="currentColor" />
      <rect x="7" y="4.2" width="9" height="1.6" rx="0.8" fill="currentColor" />
      <rect x="7" y="8.2" width="9" height="1.6" rx="0.8" fill="currentColor" />
      <rect x="0" y="12.4" width="16" height="1.6" rx="0.8" fill="currentColor" />
      <path d={out ? 'M4.5 4 L1 7 L4.5 10 Z' : 'M1 4 L4.5 7 L1 10 Z'} fill="currentColor" />
    </svg>
  );
}

// How the editor is described under every field that uses it.
export const EDITOR_HINT =
  'Format it as you would in Word: the buttons above, or Ctrl+B, Ctrl+I and Ctrl+U. Sizes are Small / Normal / Large and headings are set in capitals, so the text keeps the site\'s look and scales on every screen.';

const STYLES = [
  { value: 'h3', label: 'Heading' },
  { value: 'h4', label: 'Subheading' },
  { value: 'normal', label: 'Normal text' },
  { value: 'small', label: 'Small text' },
  { value: 'large', label: 'Large text' },
];

// --- the editor ----------------------------------------------------------

export default function RichTextEditor({ value, onChange, minHeight = 220, className = '' }) {
  // Every version this editor has handed out recently. The parent's state
  // comes back as `value` a render later, and by then more typing may have
  // happened; a version that came from here is never loaded back in, or a
  // quick typist would see the last few keystrokes undone (and the cursor
  // thrown to the top). Only a value from elsewhere — the saved write-up
  // arriving from the database — is loaded.
  const emitted = useRef(new Set([value ?? '']));

  // Every option handed to useEditor must keep its identity from one render
  // to the next. Tiptap compares them on each render and, finding any that
  // changed, pushes them all into the live editor — which resets its view.
  // Built fresh inline, the extensions and props changed on every keystroke
  // (each one re-renders the form), so the editor kept dropping its selection:
  // a size or bold applied to selected words did not show until the editor
  // lost focus, and clicking back in undid it. The extensions are therefore
  // module-level, the starting content and props are made once, and the
  // latest onChange is reached through a ref rather than a new callback.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const [initialContent] = useState(() => (isHtml(value) ? value : toEditorHtml(value)));
  const editorProps = useMemo(
    () => ({ attributes: { class: 'icp-prose outline-none', style: `min-height:${minHeight}px` } }),
    [minHeight]
  );

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: initialContent,
    editorProps,
    onUpdate: ({ editor: ed }) => {
      // Empty lines left at the end would show as a gap under the write-up.
      const html = ed.isEmpty ? '' : ed.getHTML().replace(/(<p[^>]*><\/p>)+$/, '');
      emitted.current.add(html);
      if (emitted.current.size > 200) emitted.current.delete(emitted.current.values().next().value);
      onChangeRef.current(html);
    },
  });

  // These fields are filled from the network, so the value arrives after the
  // editor is built; load it then, and whenever it changes from outside.
  useEffect(() => {
    if (!editor || emitted.current.has(value ?? '')) return;
    emitted.current = new Set([value ?? '']);
    editor.commands.setContent(isHtml(value) ? value : toEditorHtml(value), { emitUpdate: false });
  }, [editor, value]);

  // The toolbar's state, re-read as the selection moves.
  const s = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed && {
        style: ed.isActive('heading', { level: 3 })
          ? 'h3'
          : ed.isActive('heading', { level: 4 })
            ? 'h4'
            : ed.getAttributes('paragraph').size || 'normal',
        bold: ed.isActive('bold'),
        italic: ed.isActive('italic'),
        underline: ed.isActive('underline'),
        strike: ed.isActive('strike'),
        soft: ed.isActive('soft'),
        link: ed.isActive('link'),
        align: ['center', 'right', 'justify'].find((a) => ed.isActive({ textAlign: a })) || 'left',
        bullet: ed.isActive('bulletList'),
        ordered: ed.isActive('orderedList'),
        quote: ed.isActive('blockquote'),
        canSink: ed.can().sinkListItem('listItem'),
        canLift: ed.can().liftListItem('listItem'),
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      },
  });

  if (!editor || !s) return null;
  const run = () => editor.chain().focus();

  const setStyle = (style) => {
    if (style === 'h3' || style === 'h4') return run().setHeading({ level: Number(style[1]) }).run();
    return run().setParagraph().updateAttributes('paragraph', { size: style === 'normal' ? null : style }).run();
  };

  const editLink = () => {
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Link address (leave empty to remove the link)', previous || 'https://');
    if (url === null) return;
    if (!url.trim() || url.trim() === 'https://') return run().extendMarkRange('link').unsetLink().run();
    return run().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div
      className={`overflow-hidden rounded-md border border-icp-mist bg-white focus-within:border-icp-red focus-within:ring-2 focus-within:ring-icp-red/15 ${className}`}
      // Should this ever sit inside a <label> again, a click in the text must
      // not become a click on the first toolbar button (see Field in ui.jsx).
      onClick={(e) => {
        if (e.target.closest?.('.ProseMirror') && e.currentTarget.closest('label')) e.preventDefault();
      }}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-icp-mist bg-[#faf9f8] px-2 py-1.5">
        <Tool title="Undo (Ctrl+Z)" disabled={!s.canUndo} onClick={() => run().undo().run()}>↶</Tool>
        <Tool title="Redo (Ctrl+Y)" disabled={!s.canRedo} onClick={() => run().redo().run()}>↷</Tool>
        <Sep />

        <select
          title="Text style"
          aria-label="Text style"
          value={s.style}
          onChange={(e) => setStyle(e.target.value)}
          className="h-8 rounded border border-icp-mist bg-white px-2 text-[13px] text-icp-slate outline-none focus:border-icp-red"
        >
          {STYLES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Sep />

        <Tool title="Bold (Ctrl+B)" active={s.bold} onClick={() => run().toggleBold().run()}>
          <span className="font-bold">B</span>
        </Tool>
        <Tool title="Italic (Ctrl+I)" active={s.italic} onClick={() => run().toggleItalic().run()}>
          <span className="font-serif italic">I</span>
        </Tool>
        <Tool title="Underline (Ctrl+U)" active={s.underline} onClick={() => run().toggleUnderline().run()}>
          <span className="underline">U</span>
        </Tool>
        <Tool title="Strikethrough" active={s.strike} onClick={() => run().toggleStrike().run()}>
          <span className="line-through">S</span>
        </Tool>
        <Tool title="Soft text — the lighter shade the site uses for secondary lines" active={s.soft} onClick={() => run().toggleMark('soft').run()}>
          <span className="opacity-60">Soft</span>
        </Tool>
        <Sep />

        {['left', 'center', 'right', 'justify'].map((a) => (
          <Tool
            key={a}
            title={{ left: 'Align left', center: 'Centre', right: 'Align right', justify: 'Justify' }[a]}
            active={s.align === a}
            onClick={() => (a === 'left' ? run().unsetTextAlign().run() : run().setTextAlign(a).run())}
          >
            <AlignIcon side={a} />
          </Tool>
        ))}
        <Sep />

        <Tool title="Bulleted list" active={s.bullet} onClick={() => run().toggleBulletList().run()}>
          • List
        </Tool>
        <Tool title="Numbered list" active={s.ordered} onClick={() => run().toggleOrderedList().run()}>
          1. List
        </Tool>
        <Tool title="Decrease indent (Shift+Tab)" disabled={!s.canLift} onClick={() => run().liftListItem('listItem').run()}>
          <IndentIcon out />
        </Tool>
        <Tool title="Increase indent (Tab)" disabled={!s.canSink} onClick={() => run().sinkListItem('listItem').run()}>
          <IndentIcon />
        </Tool>
        <Sep />

        <Tool title="Pull quote" active={s.quote} onClick={() => run().toggleBlockquote().run()}>
          “ Quote
        </Tool>
        <Tool title="Divider line" onClick={() => run().setHorizontalRule().run()}>
          ― Line
        </Tool>
        <Tool title={s.link ? 'Edit or remove link' : 'Add a link (select the words first)'} active={s.link} onClick={editLink}>
          🔗 Link
        </Tool>
        <Sep />

        <Tool title="Clear formatting from the selection" onClick={() => run().unsetAllMarks().clearNodes().unsetTextAlign().updateAttributes('paragraph', { size: null }).run()}>
          ✕ Clear
        </Tool>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
