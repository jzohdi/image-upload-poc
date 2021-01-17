import { useState, useEffect } from "react";
import firebase from "firebase/app";
import { Divider, Spacer } from "../components/utils";
import AppBar from "../components/AppBar";
import { useFirebase, TimeStamp, Protected } from "../hooks/firebase";
// bootstrap components
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Image from "next/image";
import Link from "next/link";
import { GALLERY_COLLECTION, Gallery } from "../types";

export default function Home() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const { auth, db } = useFirebase();

  const handleOpen = () => {
    setShowCreate(true);
  };

  const handleClose = () => {
    setShowCreate(false);
  };

  const handleCreateNewSession = () => {
    if (!auth.currentUser?.uid) {
      return;
    }
    db.collection(GALLERY_COLLECTION)
      .add({
        createdAt: firebase.firestore.Timestamp.now(),
        disabled: false,
        images: {},
        roles: { [auth.currentUser.uid]: "owner" },
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log("error creating a new session", err);
      });
    handleClose();
  };

  useEffect(() => {
    db.collection(GALLERY_COLLECTION).onSnapshot((snapshot) => {
      const galleries = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      }) as Gallery[];
      setGalleries(
        galleries.sort((o1, o2) => o1.createdAt.seconds - o2.createdAt.seconds)
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
          <NewSessionModal
            onClose={handleClose}
            show={showCreate}
            onConfirm={handleCreateNewSession}
          />
          {galleries.length === 0 && <h2>No sessions have been created yet</h2>}
          {galleries.map((gallery, index) => {
            console.log(gallery);
            return (
              <section>
                <Spacer height={50} />
                <GalleryPreview gallery={gallery} key={index} />
                <Spacer height={20} />
                <Divider />
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
  const images = Object.entries(gallery.images);
  return (
    <div>
      <Link href={`/session/${gallery.id}`}>
        <a>
          <h2>{gallery.createdAt.toDate().toLocaleDateString()}</h2>
        </a>
      </Link>
      <Spacer height={24} />
      {images.length === 0 && (
        <h3>No Images have been uploaded to this gallery yet. </h3>
      )}
      {images.map(([key, image]) => {
        return (
          <Image
            src={image.value}
            width={image.dimensions.w}
            height={image.dimensions.h}
          />
        );
      })}
    </div>
  );
}

type NewSessionModalProps = {
  onClose: () => void;
  onConfirm: () => void;
  show: boolean;
};

function NewSessionModal({ onClose, show, onConfirm }: NewSessionModalProps) {
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Session</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Create a new session which will be enabled for users to start uploading
        to.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
