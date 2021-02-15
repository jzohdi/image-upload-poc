import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  PropsWithChildren,
} from "react";
import { useRouter } from "next/router";
import { signIn, User } from "../lib/api/client";

type events = "signIn" | "signOut";

class AuthHelper {
  user?: User;
  listeners: {
    [key: string]: (() => void)[];
  } = {
    signIn: [],
    signOut: [],
  };
  constructor() {}

  getCurrentUser(): User | null {
    return this.user ?? null;
  }
  on(event: events, funct: () => void): void {
    this.listeners[event].push(funct);
  }
  notify(event: events): void {
    this.listeners[event]?.forEach((f) => f());
  }
  async signIn(email: string, password: string): Promise<User | null> {
    const res = await signIn(email, password);
    if (!res) {
      return null;
    }
    this.user = res;
    this.notify("signIn");
    return res;
  }
  async signOut(): Promise<void> {
    this.user = undefined;
    this.notify("signOut");
    return;
  }
}

let authHelper: AuthHelper;
export function useAuth(): AuthHelper {
  if (!authHelper) {
    authHelper = new AuthHelper();
  }
  return authHelper;
}

type Auth = Partial<{
  user?: {};
  signIn: (email: string, password: string) => Promise<User | null>;
}>;
type AuthState = {
  user?: {};
  isLoading: boolean;
};

export const AuthContext = createContext<Auth>({});

export function AuthProvider({ children }: PropsWithChildren<{}>) {
  const [auth, setAuth] = useState<AuthState>({ isLoading: true });
  const helper = useAuth();
  const router = useRouter();

  useEffect(() => {
    /* on init:
      - check if user (set isLoading false)
      - check for localStorage tokens (token and refresh)
      - if exist use those to check if can log in (use token then refresh if needed)
      - else set is Loading to false
    */
    const currentUser = helper.getCurrentUser();
    if (currentUser) {
      setAuth({ isLoading: false, user: currentUser });
    } else {
      router.push("/signin");
      helper.on("signIn", () => {
        console.log("signed in");
      });
    }
  }, []);

  if (auth.isLoading) {
    return <div></div>;
  }
  if (!auth.isLoading && !auth.user) {
    return <div></div>;
  }
  return (
    <AuthContext.Provider value={{ user: auth.user, signIn: helper.signIn }}>
      {children}
    </AuthContext.Provider>
  );
}
