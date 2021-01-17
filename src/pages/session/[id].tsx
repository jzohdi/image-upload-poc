import { useState, useEffect } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import { GALLERY_COLLECTION, Gallery, GalleryImage } from "../../types";
import { GetServerSideProps } from "next";
import { useFirebase } from "../../hooks/firebase";
import AppBar from "../../components/AppBar";
import { Spacer } from "../../components/utils";
//bootstrap-react
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
//next
import ErrorPage from "next/error";
import Image from "next/image";

type SessionPageProps = {
  id?: string;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const firestore = firebase.firestore();
  const { id } = context.query;
  if (Array.isArray(id)) {
    return {
      props: {},
    };
  }

  const galleryRef = firestore.collection(GALLERY_COLLECTION).doc(id);
  const gallery = await galleryRef.get();
  if (!gallery.exists) {
    return {
      props: {},
    };
  }
  return {
    props: {
      id: gallery.id,
    },
  };
};

type FileUpload = {
  isLoading: boolean;
  file?: File;
  error?: string;
};

function SessionPage({ id }: SessionPageProps) {
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [uploadImage, setUploadImage] = useState<FileUpload>({
    isLoading: false,
  });
  const { db } = useFirebase();

  useEffect(() => {
    let unsub;
    if (id) {
      const fetchGallery = async () => {
        const galleryRef = await db
          .collection(GALLERY_COLLECTION)
          .doc(id)
          .get();
        const data = galleryRef.data() as Gallery;
        setGallery({ ...data, id });
      };
      fetchGallery();
      unsub = db
        .collection(GALLERY_COLLECTION)
        .doc(id)
        .collection("images")
        .onSnapshot((res) => {
          const images = res.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }));
          setImages(images as GalleryImage[]);
        });
    }
    return () => {
      // cleanup snapshot
      if (unsub) {
        unsub();
      }
    };
  }, []);

  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleSubmit = async () => {
    if (!uploadImage.file) {
      return;
    }
    setUploadImage({ ...uploadImage, isLoading: true });
    const value = await toBase64(uploadImage.file);
    const newImage = {
      createdAt: firebase.firestore.Timestamp.now(),
      disabled: false,
      value,
    };
    db.collection(GALLERY_COLLECTION)
      .doc(id)
      .collection("images")
      .add(newImage)
      .then(() => {
        setUploadImage({ isLoading: false });
        handleClose();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) {
      return;
    }
    setUploadImage({ ...uploadImage, file: files[0] });
  };

  if (!id) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <Container>
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header>
          <Modal.Title>Add image to gallery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
      <AppBar />
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <h1>Session Gallery</h1>
        <Button onClick={handleOpen}>Add Image</Button>
      </div>
      <Spacer height={34} />
      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {images.map((image) => {
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
                  key={image.id}
                  style={{
                    width: 300,
                    height: 150,
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src={image.value}
                    layout="fill"
                    objectFit="contain"
                    objectPosition="50% 50%"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}

export default SessionPage;

async function toBase64(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
}
