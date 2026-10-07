"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Heading2,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const extensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
  }),
  Placeholder.configure({ placeholder: placeholder ?? "" }),
];

export const isEmptyHtml = (html: string | null | undefined) =>
  !html || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() === "";

/**
 * Rich text editor. Read-only display also goes through Tiptap, whose schema drops any
 * markup it doesn't know, so stored or AI-written HTML can't inject scripts.
 */
export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  editable = true,
  autoFocus,
  className,
  minHeight = "min-h-24",
  toolbar = true,
}: {
  value: string | null | undefined;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  autoFocus?: boolean;
  className?: string;
  minHeight?: string;
  toolbar?: boolean;
}) {
  const editor = useEditor({
    extensions: extensions(placeholder),
    content: value ?? "",
    editable,
    autofocus: autoFocus ? "end" : false,
    immediatelyRender: false,
    editorProps: { attributes: { class: cn("rich-text text-sm focus:outline-none", editable && minHeight) } },
    onUpdate: ({ editor }) => onChange?.(editor.isEmpty ? "" : editor.getHTML()),
    onBlur: ({ editor }) => onBlur?.(editor.isEmpty ? "" : editor.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Sync external value changes (e.g. after a server refresh) when not actively editing.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const next = value ?? "";
    if (next !== editor.getHTML() && !(isEmptyHtml(next) && editor.isEmpty)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editable) {
    return <EditorContent editor={editor} className={className} />;
  }
  return (
    <div className={cn("rounded-md border bg-input/20 focus-within:border-ring/60", className)}>
      {toolbar && editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  );
}

export function RichTextView({ html, className }: { html: string | null | undefined; className?: string }) {
  if (isEmptyHtml(html)) return null;
  return <RichTextEditor value={html} editable={false} className={className} />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canSink: e.can().sinkListItem("listItem"),
      canLift: e.can().liftListItem("listItem"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");

  const btn = (active: boolean, onClick: () => void, Icon: typeof Bold, label: string, disabled = false) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30",
        active && "bg-accent text-primary",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
  const c = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
      {btn(s.bold, () => c().toggleBold().run(), Bold, "Bold (⌘B)")}
      {btn(s.italic, () => c().toggleItalic().run(), Italic, "Italic (⌘I)")}
      {btn(s.underline, () => c().toggleUnderline().run(), Underline, "Underline (⌘U)")}
      {btn(s.strike, () => c().toggleStrike().run(), Strikethrough, "Strikethrough")}
      <span className="mx-1 h-4 w-px bg-border" />
      {btn(s.h2, () => c().toggleHeading({ level: 2 }).run(), Heading2, "Heading")}
      {btn(s.bullet, () => c().toggleBulletList().run(), List, "Bulleted list")}
      {btn(s.ordered, () => c().toggleOrderedList().run(), ListOrdered, "Numbered list")}
      {btn(false, () => c().sinkListItem("listItem").run(), IndentIncrease, "Indent (Tab)", !s.canSink)}
      {btn(false, () => c().liftListItem("listItem").run(), IndentDecrease, "Outdent (Shift+Tab)", !s.canLift)}
      {btn(s.quote, () => c().toggleBlockquote().run(), Quote, "Quote")}
      <span className="mx-1 h-4 w-px bg-border" />
      {btn(
        s.link,
        () => {
          if (s.link) {
            c().unsetLink().run();
            return;
          }
          setHref("");
          setLinkOpen((o) => !o);
        },
        Link2,
        s.link ? "Remove link" : "Add link",
      )}
      {linkOpen && (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (href.trim()) c().extendMarkRange("link").setLink({ href: href.trim() }).run();
            setLinkOpen(false);
          }}
        >
          <input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://"
            className="h-6 w-48 rounded border bg-background px-1.5 text-xs outline-none focus:border-ring"
          />
        </form>
      )}
      <span className="ml-auto" />
      {btn(false, () => c().undo().run(), Undo2, "Undo", !s.canUndo)}
      {btn(false, () => c().redo().run(), Redo2, "Redo", !s.canRedo)}
    </div>
  );
}
