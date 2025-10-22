import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute'; // Adjust path
import { useAuth } from '../context/AuthContext'; // Adjust path
import { db } from '../firebase/config'; // Adjust path
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner'; // Adjust path
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, PencilSquareIcon, ArrowRightOnRectangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid'; // Solid Icons

// --- Reusable Components ---

// Info Row (similar to CompactInfoRow)
const InfoRow = ({ Icon, label, value, iconColorClass = 'text-gray-500' }) => (
  <div className="flex items-center space-x-4 py-3">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColorClass.replace('text-', 'bg-')}/10 flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${iconColorClass}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value || '...'}</p>
    </div>
  </div>
);

// App Info Modal (similar to ModernAppInfoDialog)
const AppInfoModal = ({ onClose }) => {
   // Get current year dynamically
   const currentYear = new Date().getFullYear();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 text-center border-b border-gray-200">
           <h2 className="text-xl font-bold text-darkPink">🍔 Yumzy</h2>
           <p className="text-xs text-gray-500">Food & Grocery Delivery</p>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-sm">
             {/* App Info Section */}
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="font-bold text-purple-700 mb-2 text-base">App Information</p>
                <div className="space-y-1.5">
                    <p><span className="font-semibold">Version:</span> 1.0.0 (Web)</p>
                    <p><span className="font-semibold">Release:</span> Oct {currentYear}</p>
                    <p><span className="font-semibold">Platform:</span> Web</p>
                </div>
            </div>

             {/* Developer Section */}
             <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="font-bold text-green-700 mb-2 text-base">Developer</p>
                 <div className="space-y-1.5">
                    <p><span className="font-semibold">Name:</span> BAPPI</p>
                    <p><span className="font-semibold">Phone:</span> +880 1590093644</p>
                    <p><span className="font-semibold">Email:</span> bappi616@gmail.com</p>
                    <p><span className="font-semibold">LinkedIn:</span> bappi-swe</p>
                </div>
             </div>

              {/* Footer Message */}
              <p className="text-center text-gray-600 pt-2">
                 Thank you for using Yumzy! 🎉
              </p>
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full h-[45px] flex items-center justify-center bg-darkPink text-white rounded-lg text-sm font-semibold transition hover:bg-opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Account Page Component ---
function AccountPage() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null); // Full profile from Firestore
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAppInfo, setShowAppInfo] = useState(false); // State for modal

  // --- Fetch User Profile from Firestore ---
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    const userDocRef = doc(db, 'users', user.uid);

    getDoc(userDocRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          setError("Profile data not found.");
        }
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setError("Could not load profile details.");
      })
      .finally(() => setIsLoading(false));
  }, [user]); // Re-fetch if user changes

  // Construct full address
  const fullAddress = userProfile
    ? `${userProfile.subLocation || ''}, ${userProfile.baseLocation || ''}`.replace(/^, |, $/g, '') // Basic formatting
    : '...';

  // Get profile picture URL (prefer Firebase Auth URL)
  const photoUrl = user?.photoURL || userProfile?.photoUrl; // Add fallback to profile data if needed

  return (
    <div className="min-h-screen bg-lightGray pb-10">
       {/* Custom Top Bar */}
       <div className="bg-darkPink text-white pt-10 pb-5 px-4 rounded-b-[20px] shadow-md sticky top-0 z-10 flex justify-between items-center">
            <h1 className="text-xl font-bold text-center flex-1">My Account</h1>
             {/* Info Button */}
            <button
                onClick={() => setShowAppInfo(true)}
                className="p-2 rounded-full hover:bg-white/10"
                title="App Info"
            >
                <InformationCircleIcon className="w-6 h-6 text-white/90"/>
            </button>
       </div>

       {/* Content Area */}
       <div className="p-4 space-y-6">
            {isLoading && (
                <div className="flex justify-center pt-20">
                     <p>Loading profile...</p> {/* Or use LoadingSpinner */}
                </div>
            )}

            {!isLoading && error && (
              <div className="p-4 m-4 bg-red-100 text-red-700 rounded-lg text-center">
                {error}
              </div>
            )}

            {!isLoading && !error && userProfile && (
                <>
                    {/* Profile Header */}
                    <div className="flex flex-col items-center space-y-3 pt-4">
                        <div className="relative">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt="Profile"
                                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                                    referrerPolicy="no-referrer" // Important for Google photos
                                />
                            ) : (
                                <UserCircleIcon className="w-28 h-28 text-gray-300"/>
                            )}
                            {/* Edit button overlay - navigates to edit page */}
                            <button
                                onClick={() => router.push('/account/edit')} // Define this route next
                                className="absolute bottom-0 right-0 w-9 h-9 bg-darkPink text-white rounded-full flex items-center justify-center shadow hover:bg-opacity-90"
                            >
                                <PencilSquareIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{userProfile.name || user?.displayName || 'User'}</h2>
                    </div>

                    {/* Personal Information Card */}
                     <div className="bg-white rounded-xl shadow p-4 divide-y divide-gray-100">
                         <InfoRow Icon={UserCircleIcon} label="Full Name" value={userProfile.name || user?.displayName} iconColorClass="text-blue-500" />
                         <InfoRow Icon={EnvelopeIcon} label="Email Address" value={userProfile.email || user?.email} iconColorClass="text-orange-500"/>
                         <InfoRow Icon={PhoneIcon} label="Phone Number" value={userProfile.phone} iconColorClass="text-green-500"/>
                         <InfoRow Icon={MapPinIcon} label="Delivery Address" value={fullAddress} iconColorClass="text-red-500"/>
                     </div>

                     {/* Action Buttons */}
                     <div className="space-y-3 pt-2">
                         <button
                            onClick={() => router.push('/account/edit')} // Define this route next
                            className="w-full h-[45px] flex items-center justify-center space-x-2 bg-darkPink text-white rounded-lg text-sm font-semibold transition hover:bg-opacity-90 shadow"
                         >
                            <PencilSquareIcon className="w-4 h-4"/>
                            <span>Edit Profile</span>
                         </button>
                         <button
                            onClick={logOut}
                            className="w-full h-[45px] flex items-center justify-center space-x-2 border border-red-500 text-red-500 rounded-lg text-sm font-semibold transition hover:bg-red-50"
                         >
                             <ArrowRightOnRectangleIcon className="w-4 h-4"/>
                            <span>Sign Out</span>
                         </button>
                     </div>
                </>
            )}
       </div>

        {/* App Info Modal */}
        {showAppInfo && <AppInfoModal onClose={() => setShowAppInfo(false)} />}
    </div>
  );
}

// Wrap with ProtectedRoute
export default function Account() {
  return (
    <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>
  );
}