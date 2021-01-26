import "../styles/globals.css";
import "../styles/reset.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Head from "next/head";
import type { AppProps } from "next/app";
import { FirebaseProvider } from "../hooks/firebase";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <link rel="icon" href="/favicon.ico" />
        <title>Gallery </title>
      </Head>
      <FirebaseProvider>
        <Component {...pageProps} />
      </FirebaseProvider>
    </>
  );
}

export default MyApp;
