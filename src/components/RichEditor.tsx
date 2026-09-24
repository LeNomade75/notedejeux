"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

// Éditeur riche : le contenu est stocké en Markdown (compatible avec les anciens avis et l'embed Discord)
export default function RichEditor({ value, onChange }: { value: string; onChange: (md: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "review-body editor-body min-h-48 rounded-b-lg border border-line bg-surface px-4 py-3 focus:outline-none" },
    },
    onUpdate: ({ editor }) => onChange((editor.storage as any).markdown.getMarkdown()),
  });
  if (!editor) return <div className="min-h-64 rounded-lg border border-line bg-surface" />;

  const tools: [string, string, boolean, () => void][] = [
    ["B", "Gras", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run()],
    ["I", "Italique", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run()],
    ["H", "Titre", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ["•", "Liste à puces", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run()],
    ["1.", "Liste numérotée", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run()],
    ["❝", "Citation", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run()],
  ];

  return (
    <div>
      <div className="flex gap-1 rounded-t-lg border border-b-0 border-line bg-night px-2 py-1.5">
        {tools.map(([label, title, active, run]) => (
          <button
            type="button" key={title} title={title} aria-label={title} onClick={run}
            className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-violet text-white" : "text-muted hover:bg-surface"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
