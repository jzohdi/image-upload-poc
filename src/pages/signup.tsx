import { ChangeEvent, FormEvent, useState } from "react";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import AppBar from "../components/AppBar";
import { Spacer } from "../components/utils";
import { useFirebase } from "../hooks/firebase";

type StateKey = "email" | "password" | "confirm_password" | "alert";

type SignUpForm = Partial<
  Pick<
    {
      email: string;
      password: string;
      confirm_password: string;
      alert: {
        type: "danger" | "succes";
        message: string;
      };
    },
    StateKey
  >
>;

const defaultState = { email: "", password: "", confirm_password: "" };
export default function Home() {
  const [state, setState] = useState<SignUpForm>(defaultState);
  const { auth } = useFirebase();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setState({ ...state, [e.currentTarget.name]: e.currentTarget.value });
  };

  const missingFields = (): string[] => {
    return (["email", "password", "confirm_password"] as StateKey[])
      .filter((item) => !state[item])
      .map((s) => s.split("_").join(" "));
  };

  const doPasswordsMatch = (): boolean => {
    return state.password === state.confirm_password;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!state.email || !state.password || !state.confirm_password) {
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
    if (!doPasswordsMatch()) {
      return setState({
        ...state,
        alert: { type: "danger", message: "Passwords do not match" },
      });
    }
    setState({ ...state, alert: undefined });
    auth
      .createUserWithEmailAndPassword(state.email, state.password)
      .then((cred) => {
        setState(defaultState);
        // cred.user?.sendEmailVerification().then(() => {});
      })
      .catch((err) => {
        setState({
          ...state,
          alert: { type: "danger", message: err?.message },
        });
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
        <Form.Group controlId="formConfirmPass">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            required
            name="confirm_password"
            type="password"
            placeholder="Confirm Password"
            onChange={handleChange}
            value={state.confirm_password}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Sign Up
        </Button>
      </Form>
    </Container>
  );
}
