interface ProberIconProps {
  size?: number;
  className?: string;
}

export function ProberIcon({ size = 24, className }: ProberIconProps) {
  return (
    <img
      src="/favicon.svg"
      alt="JSON Prober"
      width={size}
      height={size}
      className={className}
    />
  );
}
