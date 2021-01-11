import { IconProps } from "./types";

export default function CloseIcon({
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
      <title />
      <g data-name="Layer 57" id="Layer_57">
        <path d="M18.83,16l8.59-8.59a2,2,0,0,0-2.83-2.83L16,13.17,7.41,4.59A2,2,0,0,0,4.59,7.41L13.17,16,4.59,24.59a2,2,0,1,0,2.83,2.83L16,18.83l8.59,8.59a2,2,0,0,0,2.83-2.83Z" />
      </g>
    </svg>
  );
}
