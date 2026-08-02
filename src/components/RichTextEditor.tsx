'use client';

import { useEffect, useRef } from 'react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Heading1, Heading2, Italic, List, ListOrdered, Minus, Underline } from 'lucide-react';

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || '';
  }, [value]);

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !ref.current?.contains(selection.anchorNode)) return;
    selectionRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    ref.current?.focus();
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function ensureEditableBlock() {
    if (!ref.current || ref.current.textContent?.trim()) return;
    ref.current.innerHTML = '<p><br></p>';
    const range = document.createRange();
    const first = ref.current.querySelector('p') || ref.current;
    range.selectNodeContents(first);
    range.collapse(true);
    selectionRef.current = range;
  }

  function command(name: string, argument?: string) {
    ensureEditableBlock();
    restoreSelection();
    document.execCommand(name, false, argument);
    saveSelection();
    onChange(ref.current?.innerHTML ?? '');
  }

  return <div>
    <div className="flex flex-wrap gap-1 rounded-t-lg border border-slate-200 bg-slate-50 p-2">
      <Tool title="Negrito" onClick={() => command('bold')}><Bold /></Tool>
      <Tool title="Itálico" onClick={() => command('italic')}><Italic /></Tool>
      <Tool title="Sublinhado" onClick={() => command('underline')}><Underline /></Tool>
      <Tool title="Título grande" onClick={() => command('formatBlock', 'h1')}><Heading1 /></Tool>
      <Tool title="Título médio" onClick={() => command('formatBlock', 'h2')}><Heading2 /></Tool>
      <Tool title="Lista" onClick={() => command('insertUnorderedList')}><List /></Tool>
      <Tool title="Lista numerada" onClick={() => command('insertOrderedList')}><ListOrdered /></Tool>
      <Tool title="Alinhar à esquerda" onClick={() => command('justifyLeft')}><AlignLeft /></Tool>
      <Tool title="Centralizar" onClick={() => command('justifyCenter')}><AlignCenter /></Tool>
      <Tool title="Alinhar à direita" onClick={() => command('justifyRight')}><AlignRight /></Tool>
      <Tool title="Justificar" onClick={() => command('justifyFull')}><AlignJustify /></Tool>
      <Tool title="Linha divisória" onClick={() => command('insertHorizontalRule')}><Minus /></Tool>
      <button type="button" className="ml-2 rounded border border-slate-200 bg-white px-2 text-xs" onMouseDown={e => { e.preventDefault(); command('fontSize', '2'); }}>A-</button>
      <button type="button" className="rounded border border-slate-200 bg-white px-2 text-sm" onMouseDown={e => { e.preventDefault(); command('fontSize', '3'); }}>A</button>
      <button type="button" className="rounded border border-slate-200 bg-white px-2 text-base" onMouseDown={e => { e.preventDefault(); command('fontSize', '5'); }}>A+</button>
    </div>
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={() => { saveSelection(); onChange(ref.current?.innerHTML ?? ''); }}
      onKeyUp={saveSelection}
      onMouseUp={saveSelection}
      onFocus={saveSelection}
      className="min-h-52 rounded-b-lg border border-t-0 border-slate-200 bg-white p-4 outline-none focus:ring-2 focus:ring-brand-200 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
    />
    <p className="mt-1 text-xs text-slate-400">Você também pode inserir emojis normalmente.</p>
  </div>;
}

function Tool({ title, onClick, children }: any) {
  return <button type="button" title={title} onMouseDown={e => { e.preventDefault(); onClick(); }} className="grid h-8 w-8 place-items-center rounded border border-slate-200 bg-white hover:bg-slate-100 [&_svg]:h-4 [&_svg]:w-4">{children}</button>;
}
