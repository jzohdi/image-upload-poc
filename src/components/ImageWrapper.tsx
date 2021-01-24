import Image from "next/image";

function ImageWrapper({
  src,
  width,
  height,
}: {
  src: string;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: "2px solid grey",
        padding: 15,
        margin: "0 20px 0 0",
        cursor: "pointer",
      }}
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
