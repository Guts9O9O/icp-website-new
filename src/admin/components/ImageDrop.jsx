import { useRef, useState } from 'react';

// Drag-and-drop / click-to-choose area. Calls onFiles(File[]) with image files only.
export default function ImageDrop({ onFiles, multiple = true, accept, label, hint, compact = false, disabled }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  const handle = (fileList) => {
    const files = Array.from(fileList ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) handle(e.dataTransfer.files);
      }}
      className={[
        'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors',
        compact ? 'p-4' : 'p-8',
        over ? 'border-icp-red bg-icp-red/5' : 'border-icp-mist bg-white hover:border-icp-slate/50',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
      <p className="text-[14px] font-medium text-icp-slate">{label ?? (multiple ? 'Drop photos here, or click to choose' : 'Drop a photo here, or click to choose')}</p>
      {hint && <p className="mt-1 text-[12px] text-icp-slate/60">{hint}</p>}
    </div>
  );
}
