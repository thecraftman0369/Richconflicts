'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useEffect, useRef } from 'react'
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, ImageIcon, Link2, Quote, Code,
} from 'lucide-react'

interface Props {
  content: string
  onChange: (html: string) => void
  onImageUpload?: (file: File) => Promise<string>
  placeholder?: string
}

function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'text-white bg-white/10'
          : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ content, onChange, onImageUpload, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none min-h-[320px] px-5 py-4 focus:outline-none font-mono text-[13px] leading-relaxed text-white',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // sync external content changes (e.g. load from DB)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === content) return
    editor.commands.setContent(content || '')
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageFile = async (file: File) => {
    if (!onImageUpload || !editor) return
    const url = await onImageUpload(file)
    editor.chain().focus().setImage({ src: url }).run()
  }

  const insertLink = () => {
    if (!editor) return
    const url = window.prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div className="border border-rc-border rounded-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-rc-border bg-white/[0.02]">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={13} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={13} />
        </ToolbarBtn>

        <span className="w-px h-4 bg-rc-border mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={13} />
        </ToolbarBtn>

        <span className="w-px h-4 bg-rc-border mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Code size={13} />
        </ToolbarBtn>

        <span className="w-px h-4 bg-rc-border mx-1" />

        <ToolbarBtn onClick={insertLink} active={editor.isActive('link')} title="Add link">
          <Link2 size={13} />
        </ToolbarBtn>

        {onImageUpload && (
          <>
            <ToolbarBtn onClick={() => fileRef.current?.click()} title="Insert image" active={false}>
              <ImageIcon size={13} />
            </ToolbarBtn>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleImageFile(file)
                e.target.value = ''
              }}
            />
          </>
        )}
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
