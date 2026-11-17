interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  thickness?: number;
  label?: string;
  color?: string;
  trackColor?: string;
}

export function ProgressRing({
  value = 0,
  size = 80,
  thickness = 8,
  label,
  color = '#169C5C',
  trackColor = '#E6F1E9',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = size / 2 - thickness;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const viewBox = `0 0 ${size} ${size}`;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" viewBox={viewBox}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={trackColor} strokeWidth={thickness} />
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
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {label && (
        <div className="absolute text-sm font-semibold leading-none tracking-tight text-dark">{label}</div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
}

export function ProgressBar({ value = 0, color = '#169C5C', height = '8px' }: ProgressBarProps) {
  return (
    <div className="h-full w-full rounded-full bg-[#E9F2EC]" style={{ height }}>
      <div
        className="rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          height,
        }}
      />
    </div>
  );
}
