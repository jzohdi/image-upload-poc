import { useState, useEffect } from "react";
import firebase from "firebase/app";
import { Divider, Spacer } from "../components/utils";
import AppBar from "../components/AppBar";
import {
  useFirebase,
  TimeStamp,
  Protected,
  SnapshotSub,
} from "../hooks/firebase";
import { GALLERY_COLLECTION, Gallery, GalleryImage } from "../types";
import { compressImageFile, imageUrl } from "../utils";
import { uploadImage } from "../lib/api/client";
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

export default function Home() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const { auth, db } = useFirebase();
  const [test, setTest] = useState("");
  const handleOpen = () => {
    setShowCreate(true);
  };

  const handleClose = () => {
    setShowCreate(false);
  };

  const handleCreateNewSession = async (background: File): Promise<void> => {
    if (!auth.currentUser?.uid) {
      return;
    }
    // get image as base64 string
    const parsedBackground = await compressImageFile(background);
    if (parsedBackground === null) {
      throw new Error("File provided could not be parsed.");
    }
    const { base64, width, height } = parsedBackground;
    // setTest(base64);
    // return;
    const imageId = await uploadImage(base64);
    db.collection(GALLERY_COLLECTION)
      .add({
        createdAt: firebase.firestore.Timestamp.now(),
        disabled: false,
        roles: { [auth.currentUser.uid]: "owner" },
        background: {
          id: imageId,
          width,
          height,
        },
      })
      .then((res) => {
        // console.log(res);
        handleClose();
      })
      .catch((err) => {
        console.log("error creating a new session", err);
        handleClose();
      });
  };

  useEffect(() => {
    db.collection(GALLERY_COLLECTION).onSnapshot((snapshot) => {
      const galleries = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      }) as Gallery[];
      setGalleries(
        galleries.sort((o1, o2) => o2.createdAt.seconds - o1.createdAt.seconds)
      );
    });
  }, []);

  return (
    <Protected>
      <Container>
        <AppBar />
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h1>Sessions</h1>
            <Button onClick={handleOpen}>Create New</Button>
          </div>
          {/* <img alt="testImage" src={test} /> */}
          <NewSessionModal
            onClose={handleClose}
            show={showCreate}
            onConfirm={handleCreateNewSession}
          />
          {galleries.length === 0 && <h2>No sessions have been created yet</h2>}
          {galleries.map((gallery, index) => {
            return (
              <section key={gallery.id}>
                <Spacer height={50} />
                <GalleryPreview gallery={gallery} key={index} />
                <Spacer height={40} />
              </section>
            );
          })}
        </div>
      </Container>
    </Protected>
  );
}

function GalleryPreview({ gallery }: { gallery: Gallery }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const { db } = useFirebase();

  useEffect(() => {
    const unsub: SnapshotSub = db
      .collection(GALLERY_COLLECTION)
      .doc(gallery.id)
      .collection("images")
      .onSnapshot((snapshot) => {
        const docs = snapshot.docs.map((item) => {
          return { id: item.id, ...item.data() };
        });
        setImages(docs as GalleryImage[]);
      });

    return () => {
      unsub();
    };
  }, []);

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
              {gallery.createdAt.toDate().toLocaleDateString()} ({images.length}
              )
            </h2>
          </a>
        </Link>
        {images.length > 0 && (
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
                    src={imageUrl(image.src)}
                    width={image.width}
                    height={image.height}
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
  onConfirm: (file: File) => Promise<void>;
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
      return setUploadImage({
        ...uploadImage,
        isLoading: false,
        error: "Please provide an image for the session background.",
      });
    }
    setUploadImage({ ...uploadImage, isLoading: true });
    onConfirm(uploadImage.file)
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
