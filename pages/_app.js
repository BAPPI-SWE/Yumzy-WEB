// _app.js
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Layout from '../components/Layout';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';

const mainLayoutRoutes = ['/home', '/cart', '/orders', '/account'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100%';
  }, []);

  const useMainLayout = mainLayoutRoutes.includes(router.pathname);

  return (
    <div style={{ margin: 0, padding: 0, width: '100%', minHeight: '100vh' }}>
      <Head>
        <meta name="google-site-verification" content="o_ZP7Gh228bnvaAsyMyjC4LDXViRYDT5ic31HO4qgOM" />
        <title>Foodish BD - Daffodil Smart City's Food & Grocery Solution</title>
        <meta name="description" content="Foodish lets Daffodil Smart City residents order food and groceries quickly and conveniently." />
      </Head>
      <AuthProvider>
        <CartProvider>
          {useMainLayout ? (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          ) : (
            <Component {...pageProps} />
          )}
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default MyApp;