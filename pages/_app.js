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