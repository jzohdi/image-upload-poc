import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { Spacer } from "../components/utils";
import AppBar from "../components/AppBar";
import { useFirebase } from "../hooks/firebase";
import { useRouter } from "next/router";

type StateKey = "email" | "password" | "alert";

type SignUpForm = Partial<
  Pick<
    {
      email: string;
      password: string;
      alert: {
        type: "danger" | "succes";
        message: string;
      };
    },
    StateKey
  >
>;

const defaultState = { email: "", password: "" };
export default function Home() {
  const [state, setState] = useState<SignUpForm>(defaultState);
  const { auth } = useFirebase();
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setState({ ...state, [e.currentTarget.name]: e.currentTarget.value });
  };

  const missingFields = (): string[] => {
    return (["email", "password"] as StateKey[])
      .filter((item) => !state[item])
      .map((s) => s.split("_").join(" "));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!state.email || !state.password) {
      return setState({
        ...state,
        alert: {
          type: "danger",
          message: `Please fill the following fields: ${missingFields().join(
            ", "
          )}`,
        },
      });
    }
    setState({ ...state, alert: undefined });
    auth
      .signInWithEmailAndPassword(state.email, state.password)
      .then((cred) => {
        setState(defaultState);
        router.push("/");
      });
  };

  return (
    <Container>
      <AppBar />
      <Spacer height={50} />
      <Alert variant={state?.alert?.type}>{state?.alert?.message || ""}</Alert>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            required
            type="email"
            placeholder="Enter email"
            name="email"
            onChange={handleChange}
            value={state.email}
          />
          <Form.Text className="text-muted">
            We'll never share your email with anyone else.
          </Form.Text>
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            required
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            value={state.password}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Sign In
        </Button>
      </Form>
    </Container>
  );
}
