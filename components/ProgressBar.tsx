"use client";

interface ProgressBarProps {
  progress: number; // 0-100
  message: string;
}

export default function ProgressBar({ progress, message }: ProgressBarProps) {
  return (
    <div className="card">
      <div className="mb-2">
        <p className="text-sm font-semibold text-text">{message}</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-right">
        <span className="text-sm text-gray-600">{progress}%</span>
      </div>
    </div>
  );
}
