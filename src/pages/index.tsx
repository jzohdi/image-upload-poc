import { useState, useEffect } from "react";
// import firebase from "firebase/app";
import { Divider, Spacer } from "../components/utils";
import AppBar from "../components/AppBar";
import { Gallery } from "../lib/api/client";
import { AuthProvider } from "../hooks/auth";
import { toBase64 } from "../utils";
import { createGalley, getGalleries } from "../lib/api/client";
// bootstrap components
import Carousel from "react-bootstrap/Carousel";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Accordian from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
// next
import Image from "next/image";
import Link from "next/link";
//lib
import { useQuery, useQueryClient } from "react-query";
import { Spinner } from "react-bootstrap";

export default function Home() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const { isLoading, isError, data, error } = useQuery(
    "galleries",
    getGalleries,
    {
      refetchInterval: 10000, // revalidate every 10s
    }
  );
  const handleOpen = () => {
    setShowCreate(true);
  };

  const handleClose = () => {
    setShowCreate(false);
  };

  const handleCreateNewSession = async (fileString: string): Promise<void> => {
    createGalley(fileString)
      .then(() => {
        queryClient.invalidateQueries("galleries");
        handleClose();
      })
      .catch((error) => {
        console.error("Error: ", error);
        handleClose();
      });
  };

  useEffect(() => {}, []);

  return (
    <AuthProvider>
      <Container>
        <AppBar />
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h1>Sessions</h1>
            <Button onClick={handleOpen}>Create New</Button>
          </div>
          <NewSessionModal
            onClose={handleClose}
            show={showCreate}
            onConfirm={handleCreateNewSession}
          />
          <GalleriesBody
            galleries={data as Gallery[]}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
      </Container>
    </AuthProvider>
  );
}

type BodyProps = {
  galleries: Gallery[];
  isLoading: boolean;
  isError: boolean;
};

function GalleriesBody({ galleries, isLoading, isError }: BodyProps) {
  if (isLoading) {
    return <Spinner animation="border" />;
  }
  if (galleries.length === 0) {
    return <h2>No sessions have been created yet</h2>;
  }
  return (
    <>
      {galleries.map((gallery, index) => {
        return (
          <section key={gallery.id}>
            <Spacer height={50} />
            <GalleryPreview gallery={gallery} key={index} />
            <Spacer height={40} />
          </section>
        );
      })}
    </>
  );
}

function GalleryPreview({ gallery }: { gallery: Gallery }) {
  const images = gallery?.images ?? [];
  return (
    <Accordian>
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Link href={`/session/${gallery.id}`}>
          <a>
            <h2>
              {new Date(gallery.createdAt).toLocaleDateString()} (
              {images.length})
            </h2>
          </a>
        </Link>
        {gallery.images && gallery.images.length > 0 && (
          <Accordian.Toggle as={"div"} eventKey={gallery.id}>
            <Button variant="success">Click to Expand</Button>
          </Accordian.Toggle>
        )}
      </span>
      <Spacer height={20} />
      <Divider />
      <Spacer height={24} />
      {images.length === 0 ? (
        <h3>No Images have been uploaded to this gallery yet. </h3>
      ) : (
        <Accordian.Collapse eventKey={gallery.id}>
          <Carousel>
            {images.map((image) => {
              return (
                <Carousel.Item key={image.id}>
                  <Image
                    src={`/api/image/${image.id}`}
                    width={300}
                    height={150}
                    layout="responsive"
                  />
                </Carousel.Item>
              );
            })}
          </Carousel>
        </Accordian.Collapse>
      )}
    </Accordian>
  );
}

type NewSessionModalProps = {
  onClose: () => void;
  onConfirm: (file: string) => Promise<void>;
  show: boolean;
};

type FileUpload = {
  isLoading: boolean;
  file?: File;
  error?: string;
};

function NewSessionModal({ onClose, show, onConfirm }: NewSessionModalProps) {
  const [uploadImage, setUploadImage] = useState<FileUpload>({
    isLoading: false,
  });

  const handleConfirm = async () => {
    if (!uploadImage.file) {
      return;
    }
    setUploadImage({ ...uploadImage, isLoading: true });
    const value = await toBase64(uploadImage.file);
    if (!value) {
      return setUploadImage({
        ...uploadImage,
        isLoading: false,
        error: "File could not be parsed.",
      });
    }
    onConfirm(value)
      .then(() => {
        return setUploadImage({ isLoading: false });
      })
      .catch((err) => {
        console.error(err);
        setUploadImage({
          ...uploadImage,
          isLoading: false,
          error: "There was a problem creating the session.",
        });
      });
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) {
      return;
    }
    setUploadImage({ ...uploadImage, file: files[0] });
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Session</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            Create a new session which will be enabled for users to start
            uploading to.
          </Row>
          <Spacer height={20} />
          <Row>
            <Form>
              <Form.File custom>
                <Form.File.Label>
                  {uploadImage.file
                    ? uploadImage.file.name
                    : "Click here to select a file"}
                </Form.File.Label>
                <Form.File.Input accept=".png, .jpg" onChange={handleAddFile} />
              </Form.File>
            </Form>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
