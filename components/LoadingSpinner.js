import Lottie from 'react-lottie-player';

// We need to fetch the animation data.
// We put the JSON in /public, so it's available at this path.
import splashAnimation from '../public/splash_animation.json';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Lottie
        loop
        animationData={splashAnimation}
        play
        style={{ width: '100%', height: '100%', maxWidth: 400, maxHeight: 400 }}
      />
    </div>
  );
}