import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import { toEditorHtml, toMiniFormat } from '../../lib/richTextFormat';

/**
 * A Word-style editor for the write-ups the studio maintains: the About page,
 * team bios and the segment introductions.
 *
 * It reads and writes the same plain-text format those fields have always
 * held, so nothing in the database changes and the public site keeps rendering
 * them through RichText. What the editor shows is what RichText will draw.
 *
 * Sizes are named levels rather than pixels on purpose. Every size on the site
 * is computed from the 2560 artboard, so a literal pixel size would stop
 * scaling with it and break on a laptop; Heading / Normal / Small each map to
 * a step the design already defines.
 */

// --- the editor ----------------------------------------------------------

// Paragraphs carry a size level. `small` is the only one that is not the
// default, so it is the only attribute needed.
const SizedParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      small: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-small') === 'true',
        renderHTML: (attrs) => (attrs.small ? { 'data-small': 'true' } : {}),
      },
    };
  },
});

const BTN = 'h-8 min-w-8 rounded px-2 text-[13px] transition-colors disabled:opacity-40';
const ON = 'bg-icp-red text-white';
const OFF = 'text-icp-slate hover:bg-[#f0edea]';

function Tool({ active, onClick, title, children, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} // keep the selection while clicking
      onClick={onClick}
      className={`${BTN} ${active ? ON : OFF} ${className}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, minHeight = 220, className = '' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false, // replaced by SizedParagraph
        heading: { levels: [3] },
        codeBlock: false,
        code: false,
        strike: false,
        horizontalRule: false,
      }),
      SizedParagraph,
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        class: 'icp-prose outline-none',
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(toMiniFormat(ed.getJSON())),
  });

  // These fields are filled from the network, so the value arrives after the
  // editor is built. Only rewrite when it actually differs from what is being
  // edited, or every keystroke would reset the cursor to the top.
  useEffect(() => {
    if (!editor) return;
    if (toMiniFormat(editor.getJSON()) === (value ?? '')) return;
    editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const para = (small) => editor.chain().focus().setParagraph().updateAttributes('paragraph', { small }).run();
  const isPara = (small) => editor.isActive('paragraph', { small });

  return (
    <div className={`overflow-hidden rounded-md border border-icp-mist bg-white focus-within:border-icp-red focus-within:ring-2 focus-within:ring-icp-red/15 ${className}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-icp-mist bg-[#faf9f8] px-2 py-1.5">
        <Tool title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </Tool>
        <Tool title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </Tool>
        <span className="mx-1 h-5 w-px bg-icp-mist" />
        <Tool title="Heading — set in capitals, like the rest of the site" active={editor.isActive('heading')} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="px-2.5">
          Heading
        </Tool>
        <Tool title="Normal text" active={isPara(false)} onClick={() => para(false)} className="px-2.5">
          Normal
        </Tool>
        <Tool title="Small text" active={isPara(true)} onClick={() => para(true)} className="px-2.5">
          Small
        </Tool>
        <span className="mx-1 h-5 w-px bg-icp-mist" />
        <Tool title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </Tool>
        <Tool title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </Tool>
        <Tool title="Pull quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          “ Quote
        </Tool>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
