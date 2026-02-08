"use client";

import { useRef } from "react";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  label: string;
  accept?: string;
  selectedFileName?: string;
}

export default function FileUploader({
  onFileSelect,
  label,
  accept = ".csv,.xlsx,.xls",
  selectedFileName,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-text mb-3">{label}</h3>
      <div
        className="input-file"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-center">
          {selectedFileName ? (
            <div>
              <p className="text-primary font-semibold mb-2">
                ファイル選択済み
              </p>
              <p className="text-sm text-gray-600">{selectedFileName}</p>
              <p className="text-xs text-gray-400 mt-2">
                クリックで変更できます
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-400">
                対応形式: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
