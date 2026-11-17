interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  thickness?: number;
  label?: string;
  color?: string;
}

export function ProgressRing({ value = 0, size = 80, thickness = 8, label, color = '#2E9D59' }: ProgressRingProps) {
  const radius = size / 2 - thickness;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const viewBox = `0 0 ${size} ${size}`;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" viewBox={viewBox}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#E5EDE6"
          strokeWidth={thickness}
          className="text-green-soft"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {label && (
        <div className="absolute text-dark font-medium text-xs leading-none">
          {label}
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
}

export function ProgressBar({ value = 0, color = '#2E9D59', height = '8px' }: ProgressBarProps) {
  return (
    <div className="w-full bg-green-soft rounded-full h-full" style={{ height }}>
      <div
        className="rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color, height }}
      />
    </div>
  );
}
