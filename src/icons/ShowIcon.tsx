import { IconProps } from "./types";

export default function ShowIcon({
  width,
  height,
  className,
  onClick,
  style,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={width}
      height={height}
      className={className}
      onClick={onClick}
      style={style}
    >
      <path d="M.2 10a11 11 0 0 1 19.6 0A11 11 0 0 1 .2 10zm9.8 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  );
}
