import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
    {/* FAVICON DO SITE: */}
      <Head>
        <link rel="icon" type="image/png" href="/favicon-fossa-2025.png" /> 
        <title>Meu Site</title>
      </Head>
    <Component {...pageProps} />
    </>
  );
}