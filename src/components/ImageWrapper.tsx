import Image from "next/image";
import { CSSProperties } from "react";

function ImageWrapper({
  src,
  width,
  height,
  style,
  onClick,
}: {
  src: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  onClick?: (src: string) => void;
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(src);
    }
  };

  return (
    <div
      className="hover-paper"
      style={{
        borderRadius: 8,
        border: "2px solid grey",
        padding: 15,
        cursor: "pointer",
        ...style,
      }}
      onClick={handleClick}
    >
      <div
        style={{
          width: width || 300,
          height: height || 150,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          src={src}
          layout="fill"
          objectFit="contain"
          objectPosition="50% 50%"
        />
      </div>
    </div>
  );
}

export default ImageWrapper;
