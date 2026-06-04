import { useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    if (ref.current) ref.current.style.height = 'auto';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envía; Ctrl+Enter / Shift+Enter = nueva línea.
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
        }}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje…"
        className="max-h-36 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400"
      />
      <Button onClick={submit} disabled={disabled || !text.trim()}>
        ▶
      </Button>
    </div>
  );
}
