import { useState, useEffect, useRef, CSSProperties } from "react";
import AppBar from "../../components/AppBar";
import ImageWrapper from "../../components/ImageWrapper";
import { Spacer } from "../../components/utils";
import { toBase64, toDataURL } from "../../utils";
import ImageModal from "../../components/ImageModal";
import { ShowIcon, HideIcon, TrashIcon } from "../../icons";
// libs
import { MarkerArea, MarkerAreaState } from "markerjs2";
import { createImage, Gallery, getGallery } from "../../lib/api/client";
import { prisma } from "../../lib/prisma";
//bootstrap-react
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
//next
import { GetServerSideProps } from "next";
import ErrorPage from "next/error";
import Image from "next/image";
import { useAuth } from "../../hooks/auth";
import { useQuery, useQueryClient } from "react-query";

type SessionPageProps = {
  id?: string;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  if (!id || Array.isArray(id)) {
    return {
      props: {},
    };
  }

  const gallery = await prisma.gallery.findUnique({
    where: {
      id,
    },
  });

  return {
    props: !!gallery
      ? {
          id: gallery.id,
        }
      : {},
  };
};

type FileUpload = {
  isLoading: boolean;
  file?: File;
  error?: string;
};

let marker: MarkerArea | null;

function SessionPage({ id }: SessionPageProps) {
  if (!id) {
    return <ErrorPage statusCode={400} />;
  }
  const queryClient = useQueryClient();
  const auth = useAuth();
  const { isLoading, data, isError, error } = useQuery("gallery", () =>
    getGallery(id, auth.getToken())
  );
  const [currTab, setCurrTab] = useState<"create" | "gallery">("create");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [uploadImage, setUploadImage] = useState<FileUpload>({
    isLoading: false,
  });
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
  const createImageRef = useRef<HTMLImageElement | null>(null);
  const markerState = useRef<MarkerAreaState | undefined>(undefined);

  const isOwner = data?.owner === auth.getCurrentUser()?.id;

  useEffect(() => {
    if (currTab === "create" && marker) {
      marker.show();
    }
  }, [currTab]);

  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleChangeTab = (tab: string | null) => {
    if (tab === "create") {
      return setCurrTab(tab);
    }
    if (tab === "gallery") {
      if (marker) {
        marker.close();
      }
      return setCurrTab("gallery");
    }
  };

  const handleUpload = (value: string) => {
    setUploadImage({ ...uploadImage, isLoading: true });
    createImage(value, id)
      .then(() => {
        setUploadImage({ isLoading: false });
        handleClose();
        queryClient.invalidateQueries("gallery");
      })
      .catch((err) => {
        console.log("createImage failed: ");
        console.error(err);
      });
  };

  const handleSubmit = async () => {
    if (!uploadImage.file) {
      return;
    }
    setUploadImage({ ...uploadImage, isLoading: true });
    // TODO: value must be less than 1MB
    // possible solutions (in browser): https://stackoverflow.com/questions/14672746/how-to-compress-an-image-via-javascript-in-the-browser
    const value = await toBase64(uploadImage.file);
    if (!value) {
      console.log("there was a problem");
      return;
    }
    handleUpload(value);
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) {
      return;
    }
    setUploadImage({ ...uploadImage, file: files[0] });
  };

  // const handleToggleDisabled = (image: GalleryImage) => {
  //   db.collection(GALLERY_COLLECTION)
  //     .doc(id)
  //     .collection("images")
  //     .doc(image.id)
  //     .update({ disabled: !image.disabled });
  // };

  // const handleDelete = (image: GalleryImage) => {
  //   db.collection(GALLERY_COLLECTION)
  //     .doc(id)
  //     .collection("images")
  //     .doc(image.id)
  //     .delete();
  // };

  const handleInitMarker = () => {
    const target = createImageRef.current;
    if (!target) {
      return;
    }
    const markerInstance = new MarkerArea(target);
    markerInstance.addRenderEventListener((imgUrl, state) => {
      if (createImageRef.current) {
        createImageRef.current.src = imgUrl;
      }
      markerState.current = state;
    });
    markerInstance.show();
    marker = markerInstance;
  };

  const handleSubmitMarker = () => {
    const imageEle = createImageRef.current;
    if (!imageEle) {
      return;
    }
    toDataURL(imageEle.src, (value: string | null) => {
      if (!value) {
        return;
      }
      handleUpload(value);
    });
  };

  const handleFullScreenImage = (src: string) => {
    setFullscreenSrc(src);
  };

  if (!id) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <Container>
      <ImageModal
        src={fullscreenSrc}
        onClose={() => {
          setFullscreenSrc("");
        }}
      />
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header>
          <Modal.Title>Add image to gallery</Modal.Title>
        </Modal.Header>
        <Tabs defaultActiveKey="marker" id="upload-tabs">
          <Tab eventKey="marker" title="Use My Drawing">
            <Modal.Footer>
              <Button onClick={handleSubmitMarker}>Submit</Button>
            </Modal.Footer>
          </Tab>
          <Tab eventKey="upload" title="Choose file">
            <Modal.Body>
              <Form>
                <Form.File custom>
                  <Form.File.Label>
                    {uploadImage.file
                      ? uploadImage.file.name
                      : "Click here to select a file"}
                  </Form.File.Label>
                  <Form.File.Input
                    accept=".png, .jpg"
                    onChange={handleAddFile}
                  />
                </Form.File>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={handleSubmit}>Submit</Button>
            </Modal.Footer>
          </Tab>
        </Tabs>
      </Modal>
      <AppBar />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button onClick={handleOpen}>Upload Image</Button>
      </div>
      <Spacer height={34} />
      <Tabs
        activeKey={currTab}
        onSelect={handleChangeTab}
        id="see-gallery-or-create"
      >
        <Tab eventKey="create" title="Create">
          <Spacer height={40} />
          {data?.value && (
            <img
              width={500}
              height={250}
              style={{ width: "100%", height: "100%" }}
              alt="Draw on this background"
              src={createImageRef.current?.src || data?.value}
              ref={createImageRef}
              onClick={handleInitMarker}
            />
          )}
        </Tab>
        <Tab eventKey="gallery" title="Gallery">
          {data?.images && data?.images.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {data.images.map((image) => {
                return (
                  <div key={image.id} style={{ margin: "24px 0px 0px 24px" }}>
                    <ImageWrapper
                      src={image.value}
                      onClick={handleFullScreenImage}
                      style={isOwner ? { borderRadius: "8px 8px 0px 0px" } : {}}
                      disabled={image.disabled}
                    />
                    {isOwner && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "5px 10px",
                          border: "2px solid grey",
                          borderRadius: "0px 0px 8px 8px",
                        }}
                      >
                        <ToggleDisabledButton
                          disabled={image.disabled}
                          onClick={() => {
                            // handleToggleDisabled(image);
                          }}
                          style={{ cursor: "pointer " }}
                        />
                        <TrashIcon
                          width={25}
                          height={25}
                          // onClick={() => handleDelete(image)}
                          style={{ cursor: "pointer", fill: "#d00404" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}

export default SessionPage;

function ToggleDisabledButton({
  disabled,
  onClick,
  style,
}: {
  disabled: boolean;
  onClick: () => void;
  style: CSSProperties;
}) {
  if (disabled) {
    return <ShowIcon width={25} height={25} onClick={onClick} style={style} />;
  }
  return <HideIcon width={25} height={25} onClick={onClick} style={style} />;
}
