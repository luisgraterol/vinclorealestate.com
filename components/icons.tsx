import type { SVGProps } from 'react';

// Shared line-icon set. Icons inherit `currentColor` for stroke so the
// surrounding context controls their color. viewBox is 0 0 24 24.
export type IconName =
  | 'home'
  | 'key'
  | 'dollar'
  | 'clock'
  | 'shield'
  | 'listing'
  | 'chart'
  | 'chat'
  | 'wrench'
  | 'gauge'
  | 'sparkle'
  | 'check-circle'
  | 'document'
  | 'handshake'
  | 'users'
  | 'pin'
  | 'star'
  | 'bed'
  | 'bath'
  | 'guests';

const PATHS: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  key: <><path d="M15 7a4 4 0 1 1-4 4" /><path d="M11 11l-8 8v3h3l1-1v-2h2v-2h2l2-2" /></>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  shield: <><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z" /><path d="M9 12l2 2 4-4" /></>,
  listing: <><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="7" y1="13" x2="13" y2="13" /><line x1="7" y1="16" x2="11" y2="16" /></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  chat: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></>,
  wrench: <><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.2-.3-.3-2.2z" /></>,
  gauge: <><path d="M12 22a10 10 0 1 1 10-10" /><path d="M12 12l4-3" /><circle cx="12" cy="12" r="1.5" /></>,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></>,
  'check-circle': <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  handshake: <><path d="M11 17l2 2a1 1 0 0 0 1.4 0l3.6-3.6a2 2 0 0 0 0-2.8L14 8l-2.5 2.5a2 2 0 0 1-2.8 0L7 9l-4 4" /><path d="M17 13l4-4" /><path d="M3 9l4-4 5 3" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>,
  bed: <><path d="M2 8v10" /><path d="M2 12h20v6" /><path d="M22 12v-2a2 2 0 0 0-2-2H8v4" /><circle cx="6" cy="10" r="1.6" /></>,
  bath: <><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2" /><line x1="10" y1="6" x2="12" y2="6" /></>,
  guests: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6" /><path d="M17 20a6 6 0 0 0-3-5.2" /></>,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export default function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
