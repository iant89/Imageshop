/**
 * SF Symbols-style monochrome line icons as inline SVG React components.
 * ~1.5px stroke, currentColor fill. All icons render at a 16x16 viewBox unless noted.
 */

import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const Icon = (Comp: React.FC<IconProps>) => {
  const IconC = (props: IconProps) => (
    <Comp {...props} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
  );
  IconC.displayName = Comp.name;
  return IconC;
};

export const AppleIcon = Icon(function AppleIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M10 10a4 4 0 0 1-4-4c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" />
    </svg>
  );
});

export const MenuIcon = Icon(function MenuIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
});

export const CloseIcon = Icon(function CloseIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
});

export const MinimizeIcon = Icon(function MinimizeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 8h8" />
    </svg>
  );
});

export const MaximizeIcon = Icon(function MaximizeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <rect width="10" height="10" x="3" y="3" />
    </svg>
  );
});

export const SearchIcon = Icon(function SearchIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l2.5 2.5" />
    </svg>
  );
});

export const PlusIcon = Icon(function PlusIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M8 4v8M4 8h8" />
    </svg>
  );
});

export const TrashIcon = Icon(function TrashIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M6 4v6M10 4v6M7 7l2 2M7 9l2-2" />
    </svg>
  );
});

export const ChevronDownIcon = Icon(function ChevronDownIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 7l4 4 4-4" />
    </svg>
  );
});

export const EyeIcon = Icon(function EyeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M2 8a6 6 0 0 1 12 0c0 2.2-1.8 4-4 4S8 10.2 8 8" />
      <circle cx="8" cy="8" r="1" />
    </svg>
  );
});

export const EyeOffIcon = Icon(function EyeOffIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M2 8a6 6 0 0 1 12 0c0 2.2-1.8 4-4 4S8 10.2 8 8" />
      <circle cx="8" cy="8" r="1" />
      <path d="M2 8 14 16" />
    </svg>
  );
});

export const LayersIcon = Icon(function LayersIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M2 4h12l-6-4-6 4M2 12h12l-6-4-6 4" />
    </svg>
  );
});

export const BrushIcon = Icon(function BrushIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4l2 8M8 12l-2-2" />
    </svg>
  );
});

export const EraserIcon = Icon(function EraserIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4l8 8M10 4l2 6" />
    </svg>
  );
});

export const CropIcon = Icon(function CropIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4h6v6H4zM14 14l-3-3" />
    </svg>
  );
});

export const EyedropperIcon = Icon(function EyedropperIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 10l2-2 4 4-2 2M6 10l-4 4L2 14z" />
    </svg>
  );
});

export const MagicWandIcon = Icon(function MagicWandIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M6 6l4 4M4 10l4-4M10 14l-2 2M12 12l2-2" />
    </svg>
  );
});

export const HandIcon = Icon(function HandIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    </svg>
  );
});

export const ZoomInIcon = Icon(function ZoomInIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="7" cy="7" r="5" />
      <path d="M9 7v2M7 9h2M12 12l3 3" />
    </svg>
  );
});

export const TextIcon = Icon(function TextIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4h8M4 8h4M4 12h8" />
    </svg>
  );
});

export const ShapeIcon = Icon(function ShapeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <rect width="8" height="8" x="4" y="4" rx="1" />
    </svg>
  );
});

export const GradientIcon = Icon(function GradientIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <rect width="10" height="10" x="3" y="3" rx="1" />
      <path d="M3 13l10-10" />
    </svg>
  );
});

export const PenIcon = Icon(function PenIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4l4 4 6-6" />
      <circle cx="8" cy="8" r="1" />
    </svg>
  );
});

export const ColorIcon = Icon(function ColorIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4a4 4 0 1 1 8 0 4 4 0 0 1-8 0" />
      <path d="M8 4V8" />
    </svg>
  );
});

export const HistoryIcon = Icon(function HistoryIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8" />
      <path d="M12 8H8M6 12l2-2 2 2" />
    </svg>
  );
});

export const NavigatorIcon = Icon(function NavigatorIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <rect width="10" height="6" x="3" y="5" />
      <path d="M8 5l4 4M8 11l4-4M5 8l3 0" />
    </svg>
  );
});

export const AdjustmentsIcon = Icon(function AdjustmentsIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M6 4h4M6 8h4M6 12h4M10 4v8" />
    </svg>
  );
});

export const FilterIcon = Icon(function FilterIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M8 2l4 6H4l4-6M6 10h4" />
    </svg>
  );
});

export const CloneIcon = Icon(function CloneIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="7" cy="7" r="2" />
      <path d="M5 5l5 5M12 5l-5 5" />
    </svg>
  );
});

export const HelpIcon = Icon(function HelpIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 6v1M8 10h.01" />
    </svg>
  );
});

export const WindowIcon = Icon(function WindowIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <rect width="10" height="10" x="3" y="3" />
    </svg>
  );
});

export const SplitIcon = Icon(function SplitIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M4 4h8M4 12h8M12 4v8" />
    </svg>
  );
});

export const Icons = {
  Apple: AppleIcon,
  Menu: MenuIcon,
  Close: CloseIcon,
  Minimize: MinimizeIcon,
  Maximize: MaximizeIcon,
  Search: SearchIcon,
  Plus: PlusIcon,
  Trash: TrashIcon,
  ChevronDown: ChevronDownIcon,
  Eye: EyeIcon,
  EyeOff: EyeOffIcon,
  Layers: LayersIcon,
  Brush: BrushIcon,
  Eraser: EraserIcon,
  Crop: CropIcon,
  Eyedropper: EyedropperIcon,
  MagicWand: MagicWandIcon,
  Hand: HandIcon,
  ZoomIn: ZoomInIcon,
  Text: TextIcon,
  Shape: ShapeIcon,
  Gradient: GradientIcon,
  Pen: PenIcon,
  Color: ColorIcon,
  History: HistoryIcon,
  Navigator: NavigatorIcon,
  Adjustments: AdjustmentsIcon,
  Filter: FilterIcon,
  Clone: CloneIcon,
  Help: HelpIcon,
  Window: WindowIcon,
  Split: SplitIcon,
} as const;

export type IconName = keyof typeof Icons;
