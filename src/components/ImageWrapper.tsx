import Image from "next/image";
import { CSSProperties } from "react";

function ImageWrapper({
  src,
  disabled,
  width,
  height,
  style,
  onClick,
}: {
  src: string;
  disabled: boolean;
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
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      onClick={handleClick}
    >
      {disabled && (
        <div
          style={{
            height: "100%",
            position: "absolute",
            width: "100%",
            backgroundColor: "#000000a6",
            zIndex: 1,
          }}
        ></div>
      )}
      <div
        style={{
          width: width || 300,
          height: height || 150,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: 15,
        }}
      >
        <img
          alt="Uploaded Image"
          src={src}
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
            position: "absolute",
          }}
        />
        {/* <Image
          src={src}
          layout="fill"
          objectFit="contain"
          objectPosition="50% 50%"
        /> */}
      </div>
    </div>
  );
}

export default ImageWrapper;
