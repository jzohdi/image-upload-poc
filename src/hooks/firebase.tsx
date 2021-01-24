import { createContext, useContext, PropsWithChildren } from "react";
import { useState, useEffect, useRef } from "react";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import config from "../firebase.config";
import { useRouter } from "next/router";

if (!firebase.apps.length) {
  firebase.initializeApp(config);
} else {
  firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore();

type FirebaseUser = firebase.User;

type FireBaseApps = {
  auth: firebase.auth.Auth;
  db: firebase.firestore.Firestore;
};

const FirebaseContext = createContext<FireBaseApps>({
  auth,
  db,
});

export type SnapshotSub = () => void;
export type TimeStamp = firebase.firestore.Timestamp;

export function FirebaseProvider({ children }: PropsWithChildren<{}>) {
  return (
    <FirebaseContext.Provider value={{ auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

type AuthState = {
  isLoading: boolean;
  isLoggedIn: boolean;
};

export const Protected: React.FC = ({
  children,
}: PropsWithChildren<{}>): React.ReactElement => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isLoggedIn: false,
  });
  const router = useRouter();
  const { auth } = useFirebase();
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/signin");
      setAuthState({ isLoading: false, isLoggedIn: false });
    } else {
      setAuthState({ isLoading: false, isLoggedIn: true });
    }
  }, []);

  if (authState.isLoading) {
    return <div></div>;
  }
  if (!authState.isLoading && !authState.isLoggedIn) {
    return <div></div>;
  }
  return <>{children}</>;
};
