"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { useNotes } from "@/hooks/useNotes";
import { Note } from "@/types/note";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export default function NotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  const { notes, updateNote, deleteNote } = useNotes();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [slashMenuSearch, setSlashMenuSearch] = useState("");
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>("");

  // Handle save without losing cursor position
  const handleSave = useCallback(
    async (content: string) => {
      if (!note) return;

      // Only save if content actually changed
      if (content === lastContentRef.current) return;
      lastContentRef.current = content;

      setIsSaving(true);
      try {
        await updateNote(note.id, {
          title,
          content,
        });
      } catch (error) {
        console.error("Failed to save note:", error);
      } finally {
        setTimeout(() => setIsSaving(false), 500);
      }
    },
    [note, title, updateNote]
  );

  // Debounced save function
  const debouncedSave = useCallback(
    (content: string) => {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set a new timeout for saving
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(content);
      }, 2000); // Increased to 2 seconds to reduce cursor jumping
    },
    [handleSave]
  );

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your note...",
      }),
    ],
    content: "",
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      // Debounced auto-save on content change
      const content = editor.getHTML();
      debouncedSave(content);
    },
    onSelectionUpdate: ({ editor }) => {
      // Track selection changes for formatting menu
      setShowFormatMenu(!editor.state.selection.empty);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[500px]",
      },
      handleKeyDown: (view, event) => {
        // Handle slash command
        if (event.key === "/" && !showSlashMenu) {
          const coords = view.coordsAtPos(view.state.selection.from);
          const editorRect = view.dom.getBoundingClientRect();
          setSlashMenuPosition({
            top: coords.top - editorRect.top + 25,
            left: coords.left - editorRect.left,
          });
          setShowSlashMenu(true);
          setSelectedCommandIndex(0);
          setSlashMenuSearch("");
          return false;
        }

        // Handle slash menu navigation
        if (showSlashMenu) {
          // Navigate with arrow keys
          if (event.key === "ArrowDown") {
            event.preventDefault();
            const filteredCommands = slashCommands;
            setSelectedCommandIndex((prev) =>
              prev < filteredCommands.length - 1 ? prev + 1 : 0
            );
            return true;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            const filteredCommands = slashCommands;
            setSelectedCommandIndex((prev) =>
              prev > 0 ? prev - 1 : filteredCommands.length - 1
            );
            return true;
          }

          // Select with Enter
          if (event.key === "Enter") {
            event.preventDefault();
            const filteredCommands = slashCommands;
            const selectedCommand = filteredCommands[selectedCommandIndex];
            if (selectedCommand) {
              selectedCommand.action();
            } else if (filteredCommands.length === 1) {
              // Auto-select if only one option
              filteredCommands[0].action();
            }
            return true;
          }

          // Close on Escape
          if (event.key === "Escape") {
            // Remove the search text from editor
            if (slashMenuSearch) {
              editor
                ?.chain()
                .focus()
                .deleteRange({
                  from: view.state.selection.from - slashMenuSearch.length,
                  to: view.state.selection.from,
                })
                .run();
            }
            setShowSlashMenu(false);
            setSelectedCommandIndex(0);
            setSlashMenuSearch("");
            return true;
          }

          // Handle backspace
          if (event.key === "Backspace") {
            if (slashMenuSearch.length > 0) {
              setSlashMenuSearch((prev) => prev.slice(0, -1));
              setSelectedCommandIndex(0);
              return false; // Let the editor handle the backspace
            } else {
              // Close menu if backspacing the slash
              setShowSlashMenu(false);
              setSelectedCommandIndex(0);
              return false;
            }
          }

          // Handle typing for search
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            setSlashMenuSearch((prev) => prev + event.key);
            setSelectedCommandIndex(0);
            return false; // Let the character be typed in the editor
          }
        }

        return false;
      },
    },
  });

  // Slash menu commands
  const allSlashCommands = [
    {
      label: "Heading 1",
      icon: "H1",
      keywords: ["h1", "heading", "title", "header"],
      action: () => {
        editor
          ?.chain()
          .focus()
          .deleteRange({
            from: editor.state.selection.from - slashMenuSearch.length - 1,
            to: editor.state.selection.from,
          })
          .toggleHeading({ level: 1 })
          .run();
        setShowSlashMenu(false);
        setSlashMenuSearch("");
      },
    },
    {
      label: "Heading 2",
      icon: "H2",
      keywords: ["h2", "heading", "subtitle", "header"],
      action: () => {
        editor
          ?.chain()
          .focus()
          .deleteRange({
            from: editor.state.selection.from - slashMenuSearch.length - 1,
            to: editor.state.selection.from,
          })
          .toggleHeading({ level: 2 })
          .run();
        setShowSlashMenu(false);
        setSlashMenuSearch("");
      },
    },
    {
      label: "Heading 3",
      icon: "H3",
      keywords: ["h3", "heading", "subheading", "header"],
      action: () => {
        editor
          ?.chain()
          .focus()
          .deleteRange({
            from: editor.state.selection.from - slashMenuSearch.length - 1,
            to: editor.state.selection.from,
          })
          .toggleHeading({ level: 3 })
          .run();
        setShowSlashMenu(false);
        setSlashMenuSearch("");
      },
    },
    {
      label: "Bullet List",
      icon: "•",
      keywords: ["bullet", "list", "ul", "unordered"],
      action: () => {
        editor
          ?.chain()
          .focus()
          .deleteRange({
            from: editor.state.selection.from - slashMenuSearch.length - 1,
            to: editor.state.selection.from,
          })
          .toggleBulletList()
          .run();
        setShowSlashMenu(false);
        setSlashMenuSearch("");
      },
    },
    {
      label: "Numbered List",
      icon: "1.",
      keywords: ["number", "numbered", "list", "ol", "ordered"],
      action: () => {
        editor
          ?.chain()
          .focus()
          .deleteRange({
            from: editor.state.selection.from - slashMenuSearch.length - 1,
            to: editor.state.selection.from,
          })
          .toggleOrderedList()
          .run();
        setShowSlashMenu(false);
        setSlashMenuSearch("");
      },
    },
    {
      label: "Quote",
      icon: "❝",
      keywords: ["quote", "blockquote", "citation"],
      action: () => {
        editor
          ?.chain()
          .focus()
          .deleteRange({
            from: editor.state.selection.from - slashMenuSearch.length - 1,
            to: editor.state.selection.from,
          })
          .toggleBlockquote()
          .run();
        setShowSlashMenu(false);
        setSlashMenuSearch("");
      },
    },
    {
      label: "Code Block",
      icon: "</>",
      keywords: ["code", "block", "snippet", "programming"],
      action: () => {
        editor
          ?.chain()
          .focus()
          .deleteRange({
            from: editor.state.selection.from - slashMenuSearch.length - 1,
            to: editor.state.selection.from,
          })
          .toggleCodeBlock()
          .run();
        setShowSlashMenu(false);
        setSlashMenuSearch("");
      },
    },
  ];

  // Filter commands based on search
  const slashCommands = allSlashCommands.filter((cmd) => {
    if (!slashMenuSearch) return true;
    const search = slashMenuSearch.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(search) ||
      cmd.keywords.some((keyword) => keyword.includes(search))
    );
  });

  useEffect(() => {
    const currentNote = notes.find((n) => n.id === noteId);
    if (currentNote) {
      setNote(currentNote);
      setTitle(currentNote.title);
      lastContentRef.current = currentNote.content || "";

      // Set editor content without triggering save
      if (
        editor &&
        currentNote.content &&
        !editor.getHTML().includes(currentNote.content.substring(0, 50))
      ) {
        editor.commands.setContent(currentNote.content);
      }
    }
  }, [noteId, notes, editor]);

  const handleDelete = async () => {
    if (!note) return;

    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(note.id);
      router.push("/");
    }
  };

  // Auto-save on title change (also debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (note && title !== note.title && editor) {
        const content = editor.getHTML();
        handleSave(content);
      }
    }, 2000); // Increased to 2 seconds

    return () => clearTimeout(timer);
  }, [title, note, editor, handleSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!note) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Typography variant="h3">Note not found</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button onClick={() => router.push("/")} variant="ghost" size="sm">
              ← Back
            </Button>

            <div className="flex items-center gap-2">
              {isSaving && (
                <Typography
                  variant="caption"
                  className="text-gray-500 animate-pulse"
                >
                  Saving...
                </Typography>
              )}
              <Button onClick={handleDelete} variant="danger" size="sm">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Paper Effect Container */}
        <div className="relative">
          {/* Main Paper - US Letter Size */}
          <div
            className="relative bg-white rounded-lg shadow-lg overflow-hidden mx-auto"
            style={{
              maxWidth: "816px" /* US Letter width at 96 DPI */,
              background: `
                linear-gradient(to right, 
                  transparent 0%, 
                  transparent 49px, 
                  #ef4444 49px, 
                  #ef4444 51px, 
                  transparent 51px, 
                  transparent 100%
                ),
                linear-gradient(to bottom,
                  white 0%,
                  white 95%,
                  #f3f4f6 100%
                )
              `,
            }}
          >
            {/* Paper Texture Overlay */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Hole Punches */}
            <div className="absolute left-6 top-20 w-6 h-6 bg-gray-100 rounded-full shadow-inner" />
            <div className="absolute left-6 top-32 w-6 h-6 bg-gray-100 rounded-full shadow-inner" />
            <div className="absolute left-6 top-44 w-6 h-6 bg-gray-100 rounded-full shadow-inner" />

            {/* Content Area */}
            <div
              className="relative pl-20 pr-8 py-8"
              style={{ minHeight: "1120px" }}
            >
              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full text-3xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 mb-6"
                style={{
                  fontFamily: "var(--font-caveat)",
                }}
              />

              {/* Horizontal Lines for Paper Effect - Matched to line-height */}
              <div
                className="absolute inset-x-20 pointer-events-none"
                style={{
                  top: "96px", // Adjusted to align with first line of text
                  height: "1056px", // US Letter height
                  backgroundImage: `repeating-linear-gradient(
                    transparent,
                    transparent 31px,
                    #e5e7eb 31px,
                    #e5e7eb 32px
                  )`,
                  backgroundPosition: "0 -4px", // Fine-tune alignment
                }}
              />

              {/* Tiptap Editor */}
              <div
                className="relative tiptap-wrapper"
                style={{ minHeight: "1056px" }}
              >
                <style jsx global>{`
                  /* Tiptap editor styling */
                  .tiptap-wrapper .ProseMirror {
                    font-family: var(--font-caveat);
                    font-size: 1.5rem !important; /* Increased from 1.25rem */
                    line-height: 32px !important;
                    min-height: 1056px; /* US Letter height at 96 DPI */
                    padding: 0;
                    padding-top: 4px; /* Align text with lines */
                    outline: none;
                    color: #111827 !important;
                  }

                  .tiptap-wrapper .ProseMirror p {
                    font-family: var(--font-caveat);
                    font-size: 1.5rem !important; /* Increased from 1.25rem */
                    line-height: 32px !important;
                    margin: 0;
                    padding: 0;
                    color: #111827 !important;
                  }

                  .tiptap-wrapper .ProseMirror h1 {
                    font-size: 2.5rem !important;
                    line-height: 64px !important; /* Takes 2 lines */
                    font-weight: bold !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    font-family: var(--font-caveat);
                    color: #111827 !important;
                  }

                  .tiptap-wrapper .ProseMirror h2 {
                    font-size: 2rem !important;
                    line-height: 64px !important; /* Takes 2 lines */
                    font-weight: bold !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    font-family: var(--font-caveat);
                    color: #111827 !important;
                  }

                  .tiptap-wrapper .ProseMirror h3 {
                    font-size: 1.5rem !important;
                    line-height: 32px !important; /* Takes 1 line */
                    font-weight: bold !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    font-family: var(--font-caveat);
                    color: #111827 !important;
                  }

                  .tiptap-wrapper .ProseMirror ul {
                    list-style-type: disc !important;
                    padding-left: 2rem !important;
                    margin: 0;
                    padding-top: 0;
                    padding-bottom: 0;
                  }

                  .tiptap-wrapper .ProseMirror ol {
                    list-style-type: decimal !important;
                    padding-left: 2rem !important;
                    margin: 0;
                    padding-top: 0;
                    padding-bottom: 0;
                  }

                  .tiptap-wrapper .ProseMirror ul li::marker {
                    color: #111827 !important; /* Bullet color */
                  }

                  .tiptap-wrapper .ProseMirror ol li::marker {
                    color: #111827 !important; /* Number color */
                  }

                  .tiptap-wrapper .ProseMirror li {
                    font-family: var(--font-caveat);
                    font-size: 1.5rem !important; /* Increased from 1.25rem */
                    line-height: 32px !important; /* Match line spacing */
                    color: #111827 !important;
                    margin: 0;
                    padding: 0;
                    display: list-item !important; /* Force list item display */
                  }

                  .tiptap-wrapper .ProseMirror blockquote {
                    border-left: 4px solid #7241fe !important;
                    padding-left: 16px !important;
                    font-style: italic !important;
                    color: #4b5563 !important;
                    margin: 0;
                    padding-top: 0;
                    padding-bottom: 0;
                  }

                  .tiptap-wrapper .ProseMirror blockquote p {
                    line-height: 32px !important; /* Match line spacing */
                  }

                  .tiptap-wrapper .ProseMirror code {
                    background: #f3f4f6 !important;
                    border-radius: 4px !important;
                    padding: 2px 4px !important;
                    font-family: "Courier New", monospace !important;
                    font-size: 0.9rem !important;
                    color: #111827 !important;
                  }

                  .tiptap-wrapper .ProseMirror pre {
                    background: #f3f4f6 !important;
                    border-radius: 8px !important;
                    padding: 12px !important;
                    font-family: "Courier New", monospace !important;
                    font-size: 0.9rem !important;
                    margin: 8px 0;
                  }

                  .tiptap-wrapper .ProseMirror pre code {
                    background: none !important;
                    padding: 0 !important;
                    color: #111827 !important;
                  }

                  /* Placeholder */
                  .tiptap-wrapper
                    .ProseMirror
                    p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9ca3af;
                    pointer-events: none;
                    height: 0;
                    font-family: var(--font-caveat);
                  }

                  /* Selection */
                  .tiptap-wrapper .ProseMirror ::selection {
                    background: #7241fe20;
                  }

                  /* Focus */
                  .tiptap-wrapper .ProseMirror:focus {
                    outline: none;
                  }

                  /* Strong/Bold */
                  .tiptap-wrapper .ProseMirror strong {
                    font-weight: bold;
                  }

                  /* Emphasis/Italic */
                  .tiptap-wrapper .ProseMirror em {
                    font-style: italic;
                  }

                  /* Strike */
                  .tiptap-wrapper .ProseMirror s {
                    text-decoration: line-through;
                  }
                `}</style>

                {/* Bubble Menu - appears when text is selected */}
                {editor && showFormatMenu && (
                  <div
                    className="bg-white shadow-lg rounded-lg border border-gray-200 p-1 flex gap-1 absolute z-50 transition-opacity duration-200"
                    style={{
                      top: "-50px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      opacity: showFormatMenu ? 1 : 0,
                      pointerEvents: showFormatMenu ? "auto" : "none",
                    }}
                  >
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-2 rounded hover:bg-gray-100 text-gray-700 ${
                        editor.isActive("bold")
                          ? "bg-purple-100 text-purple-700"
                          : ""
                      }`}
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                      }
                      className={`p-2 rounded hover:bg-gray-100 text-gray-700 ${
                        editor.isActive("italic")
                          ? "bg-purple-100 text-purple-700"
                          : ""
                      }`}
                    >
                      <em>I</em>
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleStrike().run()
                      }
                      className={`p-2 rounded hover:bg-gray-100 text-gray-700 ${
                        editor.isActive("strike")
                          ? "bg-purple-100 text-purple-700"
                          : ""
                      }`}
                    >
                      <s>S</s>
                    </button>
                    <div className="w-px bg-gray-300 mx-1" />
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                      }
                      className={`px-2 py-1 rounded hover:bg-gray-100 text-sm text-gray-700 ${
                        editor.isActive("heading", { level: 1 })
                          ? "bg-purple-100 text-purple-700"
                          : ""
                      }`}
                    >
                      H1
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                      }
                      className={`px-2 py-1 rounded hover:bg-gray-100 text-sm text-gray-700 ${
                        editor.isActive("heading", { level: 2 })
                          ? "bg-purple-100 text-purple-700"
                          : ""
                      }`}
                    >
                      H2
                    </button>
                    <div className="w-px bg-gray-300 mx-1" />
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                      }
                      className={`p-2 rounded hover:bg-gray-100 text-gray-700 ${
                        editor.isActive("bulletList")
                          ? "bg-purple-100 text-purple-700"
                          : ""
                      }`}
                    >
                      •
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                      }
                      className={`p-2 rounded hover:bg-gray-100 text-gray-700 ${
                        editor.isActive("blockquote")
                          ? "bg-purple-100 text-purple-700"
                          : ""
                      }`}
                    >
                      ❝
                    </button>
                  </div>
                )}

                {/* Slash Menu */}
                {showSlashMenu && (
                  <div
                    className="absolute bg-white shadow-lg rounded-lg border border-gray-200 p-2 z-50"
                    style={{
                      top: `${slashMenuPosition.top}px`,
                      left: `${slashMenuPosition.left}px`,
                    }}
                  >
                    <div className="text-xs text-gray-500 px-2 py-1 mb-1">
                      {slashMenuSearch ? (
                        <>
                          FILTERING:{" "}
                          <span className="text-purple-600 font-medium">
                            {slashMenuSearch}
                          </span>
                        </>
                      ) : (
                        "BASIC BLOCKS"
                      )}
                    </div>
                    {slashCommands.length > 0 ? (
                      slashCommands.map((command, index) => (
                        <button
                          key={index}
                          onClick={command.action}
                          onMouseEnter={() => setSelectedCommandIndex(index)}
                          className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 text-sm text-gray-700 transition-colors ${
                            index === selectedCommandIndex
                              ? "bg-purple-100 text-purple-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <span
                            className={`w-6 text-center ${
                              index === selectedCommandIndex
                                ? "text-purple-600"
                                : "text-gray-400"
                            }`}
                          >
                            {command.icon}
                          </span>
                          <span
                            className={
                              index === selectedCommandIndex
                                ? "text-purple-700"
                                : "text-gray-700"
                            }
                          >
                            {command.label}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400 px-3 py-2">
                        No commands found for &quot;{slashMenuSearch}&quot;
                      </div>
                    )}
                    <div className="text-xs text-gray-400 px-2 py-1 mt-2 border-t">
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                        ↑↓
                      </kbd>{" "}
                      Navigate{" "}
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                        Enter
                      </kbd>{" "}
                      Select{" "}
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                        ESC
                      </kbd>{" "}
                      Close
                    </div>
                  </div>
                )}

                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Paper Corner Fold */}
            <div
              className="absolute bottom-0 right-0 w-16 h-16"
              style={{
                background: `linear-gradient(135deg, transparent 50%, #f9fafb 50%)`,
                boxShadow: "-2px -2px 3px rgba(0,0,0,0.05)",
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
