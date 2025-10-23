import Lottie from 'react-lottie-player';
import splashAnimation from '../public/splash_animation.json';

export default function LoadingSpinner() {
  return (
    // This container ensures the background color fills the screen and centers content
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Lottie
        loop
        animationData={splashAnimation}
        play
        // --- Updated Style ---
        style={{
          width: '100%',    // Make animation width fill container
          height: '100%',   // Make animation height fill container
          // Remove max width/height limits
          // maxWidth: 400, // REMOVE THIS
          // maxHeight: 400 // REMOVE THIS
          // Optional: Add object-fit if the animation itself doesn't scale well
          // objectFit: 'cover'
        }}
        // --- End Updated Style ---
        // Optional: className if you prefer Tailwind, e.g., className="w-full h-full"
      />
    </div>
  );
}