import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Layout from '../components/Layout';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
const mainLayoutRoutes = ['/home', '/cart', '/orders', '/account'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(router.isReady);
  }, [router.isReady]);

  // Add global styles to remove any default padding
  useEffect(() => {
    // Set body styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';
    
    // Set html styles
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100%';
  }, []);

  // Wait for router to be ready
  if (!isReady) {
    return null;
  }

  const useMainLayout = mainLayoutRoutes.includes(router.pathname);

  console.log('Current pathname:', router.pathname);
  console.log('Should use main layout:', useMainLayout);

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100%',
      minHeight: '100vh'
    }}>
      <AuthProvider>

        <Head>
        <meta name="google-site-verification" content="o_ZP7Gh228bnvaAsyMyjC4LDXViRYDT5ic31HO4qgOM" />
        {/* You can also add your site title here */}
        <title><title>Yumzy - Daffodil Smart City’s Food & Grocery Solution</title>
</title>
        <meta name="description" content="Yumzy lets Daffodil Smart City residents order food and groceries quickly and conveniently."" />
      </Head>
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