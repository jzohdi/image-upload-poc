import { IconProps } from "./types";

export default function MenuIcon({
  width,
  height,
  className,
  onClick,
  style,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={width}
      height={height}
      className={className}
      onClick={onClick}
      style={style}
    >
      <defs>
        <style>{`.cls-1{fill:#101820;}`}</style>
      </defs>
      <title />
      <g data-name="Layer 5" id="Layer_5">
        <path
          className="cls-1"
          d="M16,31A15,15,0,1,1,31,16,15,15,0,0,1,16,31ZM16,3A13,13,0,1,0,29,16,13,13,0,0,0,16,3Z"
        />
        <path className="cls-1" d="M21,17H11a1,1,0,0,1,0-2H21a1,1,0,0,1,0,2Z" />
        <path className="cls-1" d="M21,12H11a1,1,0,0,1,0-2H21a1,1,0,0,1,0,2Z" />
        <path className="cls-1" d="M21,22H11a1,1,0,0,1,0-2H21a1,1,0,0,1,0,2Z" />
      </g>
    </svg>
  );
}
