
interface IconProps {
  className?: string;
  size?: number;
}

export function NodeIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}

export function LinkIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8z"/>
      <path d="M10.5 4.5L14 8l-3.5 3.5M5.5 11.5L2 8l3.5-3.5" stroke="currentColor" strokeWidth="1" fill="none"/>
    </svg>
  );
}

export function FileIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L10.5 0H4zm0 1h6v3a1 1 0 0 0 1 1h3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
    </svg>
  );
}

export function CopyIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h8.5a1.5 1.5 0 0 0 1.5-1.5V13a1.5 1.5 0 0 0-1.5-1.5H3a.5.5 0 0 1-.5-.5V3.5a.5.5 0 0 1 .5-.5h1V1.5z"/>
      <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5v8A1.5 1.5 0 0 0 6.5 12h5A1.5 1.5 0 0 0 13 10.5v-8A1.5 1.5 0 0 0 11.5 1h-5zM11.5 2a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h5z"/>
    </svg>
  );
}