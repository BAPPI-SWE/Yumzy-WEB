import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Layout from '../components/Layout';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const mainLayoutRoutes = ['/home', '/cart', '/orders', '/account'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(router.isReady);
  }, [router.isReady]);

  // Wait for router to be ready
  if (!isReady) {
    return null; // or a loading spinner
  }

  const useMainLayout = mainLayoutRoutes.includes(router.pathname);

  console.log('Current pathname:', router.pathname); // Debug log
  console.log('Should use main layout:', useMainLayout); // Debug log

  return (
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
  );
}

export default MyApp;