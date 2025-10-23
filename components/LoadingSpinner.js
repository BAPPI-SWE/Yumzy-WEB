import Lottie from 'react-lottie-player';
import splashAnimation from '../public/splash_animation.json';

export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'white'
    }}>
      <Lottie
        loop
        animationData={splashAnimation}
        play
        style={{ 
          width: '100%', 
          height: '100%', 
          maxWidth: 400, 
          maxHeight: 400 
        }}
      />
    </div>
  );
}