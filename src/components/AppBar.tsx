import { useAuth } from "../hooks/auth";
import { Spacer } from "./utils";
import { CSSProperties, PropsWithChildren } from "react";
import { Nav } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";

function AppBar() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    if (auth.getCurrentUser()) {
      auth.signOut().then(() => {
        router.push("/");
      });
    }
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          minHeight: "64px",
          padding: "10px 50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ul style={{ display: "flex", alignItems: "center" }}>
          <NavItem href="/">Home</NavItem>
          {auth.getCurrentUser() === null ? (
            <>
              <NavItem href="/signin">Sign In</NavItem>
              <NavItem href="/signup">Sign Up</NavItem>
            </>
          ) : (
            <NavItem onClick={handleSignOut}>Sign Out</NavItem>
          )}
        </ul>
      </div>
      <Spacer height={64} />
    </>
  );
}

export default AppBar;

type NavItemProps = {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
};

const navItemStyle: CSSProperties = {
  margin: "0px 10px",
  fontSize: "24px",
  color: "black",
  cursor: "pointer",
};

function NavItem({ href, onClick, children }: PropsWithChildren<NavItemProps>) {
  if (href) {
    return (
      <li style={navItemStyle}>
        <Link href={href}>
          <a>{children}</a>
        </Link>
      </li>
    );
  }
  return (
    <li style={navItemStyle} onClick={onClick}>
      {children}
    </li>
  );
}
