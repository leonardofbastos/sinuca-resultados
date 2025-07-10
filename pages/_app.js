import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
    {/* FAVICON DO SITE: */}
      <Head>
        <link rel="icon" type="image/png" href="/icons8-scoreboard-32.png" /> 
        <title>Placar FOSSA</title>
      </Head>
    <Component {...pageProps} />
    </>
  );
}