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
export type DB = firebase.firestore.Firestore;
export type Auth = firebase.auth.Auth;

type FireBaseApps = {
  auth: Auth;
  db: DB;
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
  const { auth } = useFirebase();
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isLoggedIn: false,
  });

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthState({ isLoading: false, isLoggedIn: true });
      } else {
        router.push("/signin");
        setAuthState({ isLoading: false, isLoggedIn: false });
      }
    });
  }, []);

  if (authState.isLoading) {
    return <div></div>;
  }
  if (!authState.isLoading && !authState.isLoggedIn) {
    return <div></div>;
  }
  return <>{children}</>;
};
