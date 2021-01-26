import { useRef, useEffect } from "react";

export default function ImageModal({ src }: { src: string | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (src && container && image) {
      image.setAttribute("src", src);
      if (!container.classList.contains("open")) {
        container.classList.add("open");
      }
      if (!image.classList.contains("open")) {
        image.classList.add("open");
      }
    }
  }, [src]);

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (container && e.currentTarget === container) {
      container.classList.remove("open");
      if (image) {
        image.classList.remove("open");
      }
    }
  };

  return (
    <>
      <style>
        {`
            .fullscreen-image-modal {
                background: rgba(0, 0, 0, 0.8);
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                opacity: 0;
                pointer-events: none;
                transition: 0.25s ease-out;
              }
              .fullscreen-image-modal.open {
                opacity: 1;
                pointer-events: all;
              }
              .full-img {
                position: absolute;
                height: 70%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.5);
                transition: all 0.25s ease-out;
              }
              .full-img.open {
                transform: translate(-50%, -50%) scale(1);
              }
              .modal-content {
                margin: auto;
                background-color: #fff;
                position: relative;
                padding: 0;
                outline: 0;
                width: 600px;
              }
          `}
      </style>
      <div
        ref={containerRef}
        onClick={handleClose}
        className="fullscreen-image-modal"
      >
        <img src="" alt="" className="full-img" ref={imageRef} />
      </div>
    </>
  );
}
