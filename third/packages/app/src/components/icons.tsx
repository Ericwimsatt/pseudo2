/**
 * Tiny inline icon set. Avoids an external icon dependency while
 * keeping the visual style consistent. Each icon is a 1em stroke
 * SVG sized to the surrounding text.
 */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const ChevronRight = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M5 3l5 5-5 5" />
  </svg>
);

export const ChevronDown = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 5l5 5 5-5" />
  </svg>
);

export const Folder = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6c.3 0 .6.1.8.3l1 1c.2.2.5.3.8.3h3.8A1.5 1.5 0 0 1 14 6.1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5z" />
  </svg>
);

export const FolderOpen = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M2 5h11l-1 7H3a1 1 0 0 1-1-1V5z" />
    <path d="M5 5V4a1 1 0 0 1 1-1h2l1 1h2" />
  </svg>
);

export const FileText = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 2h5l3 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
    <path d="M9 2v3h3" />
    <path d="M5 8h6M5 11h4" />
  </svg>
);

export const AlertTriangle = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M8 2l6.5 11h-13L8 2z" />
    <path d="M8 6v3" />
    <circle cx="8" r="0.5" cy="11" fill="currentColor" />
  </svg>
);

export const Info = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7v4" />
    <circle cx="8" r="0.5" cy="5" fill="currentColor" />
  </svg>
);

export const Clock = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3l2 1" />
  </svg>
);

export const Activity = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M1 8h3l2-5 3 10 2-7 4 2" />
  </svg>
);

export const ListTree = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 4h6M3 8h6M3 12h6" />
    <circle cx="12" cy="4" r="1" fill="currentColor" />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const Code = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M6 4l-4 4 4 4M10 4l4 4-4 4" />
  </svg>
);

export const Languages = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M2 5h8M6 3v2M4 7c0 2 2 4 4 4M8 5c0 1-1 2-4 2" />
    <path d="M10 9l3 3 3-3M13 12V8" />
  </svg>
);

export const X = ({ size = 12, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);
