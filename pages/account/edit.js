import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute'; // Adjust path
import { useAuth } from '../../context/AuthContext'; // Adjust path
import { db } from '../../firebase/config'; // Adjust path
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; // Firebase Auth function
import LoadingSpinner from '../../components/LoadingSpinner'; // Adjust path
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

// Dropdown Component (copied from pages/details.js - consider making this reusable)
const SelectDropdown = ({ label, value, options, onSelect, required = false, disabled = false, error = false, errorText = ''}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-base border ${ error ? 'border-red-500' : 'border-gray-300' } rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink bg-white disabled:bg-gray-100`}
      >
        <option value="">{disabled ? 'Loading...' : `Select ${label}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && errorText && (
        <p className="mt-1 text-xs text-red-600">{errorText}</p>
      )}
    </div>
  );
};

// Input Field Component
const InputField = ({ label, value, onChange, placeholder = '', required = false, error = false, errorText = '', type = 'text' }) => {
   return (
    <div className="w-full">
       <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
       <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || label}
            className={`w-full px-4 py-3 text-base border ${ error ? 'border-red-500' : 'border-gray-300' } rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink`}
        />
         {error && errorText && (
            <p className="mt-1 text-xs text-red-600">{errorText}</p>
         )}
    </div>
   );
};

// --- Main Edit Profile Page Component ---
function EditProfilePageContent() {
  const { user } = useAuth();
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');

  // Location State
  const [allLocations, setAllLocations] = useState({});
  const [baseLocationOptions, setBaseLocationOptions] = useState([]);
  const [subLocationOptions, setSubLocationOptions] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  // Loading/Processing/Error State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({}); // For field-specific errors

  // --- Validation ---
  const validateForm = () => {
      const errors = {};
      if (!phone) errors.phone = "Phone number is required."; //
      if (!selectedBase) errors.baseLocation = "Main location is required."; //
      if (!selectedSub) errors.subLocation = "Area is required."; //
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const isFormValid = !validationErrors.phone && !validationErrors.baseLocation && !validationErrors.subLocation;

   // --- Fetch Locations ---
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'locations'));
        const locationMap = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.name) locationMap[data.name] = data.subLocations || [];
        });
        setAllLocations(locationMap);
        setBaseLocationOptions(Object.keys(locationMap));
      } catch (err) {
        console.error('Failed to fetch locations', err);
        setError('Could not load location options.');
      }
    };
    fetchLocations();
  }, []);

  // --- Fetch Current Profile Data ---
  useEffect(() => {
    if (!user || baseLocationOptions.length === 0) return; // Wait for user and locations

    setIsLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || user.displayName || ''); //
          setPhone(data.phone || ''); //
          setBuilding(data.building || ''); //
          setFloor(data.floor || ''); //
          setRoom(data.room || ''); //
          // Set location dropdowns
          const savedBase = data.baseLocation || '';
          if (savedBase && allLocations[savedBase]) {
             setSelectedBase(savedBase); //
             setSubLocationOptions(allLocations[savedBase]);
             setSelectedSub(data.subLocation || ''); //
          } else {
              // Handle case where saved location is invalid or not set
              setSelectedBase('');
              setSubLocationOptions([]);
              setSelectedSub('');
          }

        } else {
          setError("Profile data not found.");
        }
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setError("Could not load profile details.");
      })
      .finally(() => setIsLoading(false));
  }, [user, allLocations, baseLocationOptions]); // Depend on user and fetched locations


   // --- Handle location selections ---
  const handleBaseSelect = (base) => {
    setSelectedBase(base);
    setSubLocationOptions(allLocations[base] || []);
    setSelectedSub(''); // Reset sub-location
    setValidationErrors(prev => ({...prev, baseLocation: '', subLocation: ''})); // Clear errors
  };
  const handleSubSelect = (sub) => {
      setSelectedSub(sub);
      setValidationErrors(prev => ({...prev, subLocation: ''})); // Clear error
  };


  // --- Handle Save Changes ---
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving || !user) return;

    setIsSaving(true);
    setError('');

    const profileUpdates = {};
    if (name !== (user.displayName || '')) profileUpdates.displayName = name; // Only update if changed

    const firestoreUpdates = { //
        name: name || 'Yumzy User',
        phone: phone,
        baseLocation: selectedBase,
        subLocation: selectedSub,
        building: building,
        floor: floor,
        room: room,
    };

    try {
        // Update Firebase Auth display name if changed
        if (Object.keys(profileUpdates).length > 0) {
             await updateProfile(user, profileUpdates); //
             console.log("Firebase Auth profile updated");
        }

        // Update Firestore document
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, firestoreUpdates); //
        console.log("Firestore profile updated");

        // Navigate back (pass a flag if needed, but router.back() is simpler)
         alert("Profile Updated Successfully!"); // Simple feedback
         router.back(); // Go back to the previous screen (Account Page)

    } catch (err) {
        console.error("Error updating profile:", err);
        setError("Failed to save changes. Please try again.");
        setIsSaving(false);
    }
    // No finally block needed here as we navigate away on success
  };

  if (isLoading) {
      return <LoadingSpinner />;
  }

  return (
     <div className="min-h-screen bg-lightGray pb-10">
        {/* Top Bar */}
         <div className="sticky top-0 z-30 bg-white shadow-sm p-3 flex items-center space-x-2">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100" disabled={isSaving}>
                <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 truncate flex-1">Edit Profile</h1>
         </div>

         {/* Form Content */}
         <form onSubmit={handleSaveChanges} className="p-4 space-y-5">
            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center space-x-2">
                    <ExclamationCircleIcon className="w-5 h-5"/>
                    <span>{error}</span>
                </div>
            )}

            <InputField label="Your Name" value={name} onChange={setName} />
            <InputField label="Phone Number" value={phone} onChange={setPhone} type="tel" required
                        error={!!validationErrors.phone} errorText={validationErrors.phone} />

            <SelectDropdown
                label="Main Location" value={selectedBase} options={baseLocationOptions}
                onSelect={handleBaseSelect} required
                error={!!validationErrors.baseLocation} errorText={validationErrors.baseLocation} />

            <SelectDropdown
                label="Your Area" value={selectedSub} options={subLocationOptions}
                onSelect={handleSubSelect} required disabled={!selectedBase}
                error={!!validationErrors.subLocation} errorText={validationErrors.subLocation} />

            <InputField label="Building Name / Detail Home Address" value={building} onChange={setBuilding} />

            <div className="flex gap-4">
                <InputField label="Floor No." value={floor} onChange={setFloor} />
                <InputField label="Room No." value={room} onChange={setRoom} />
            </div>

            <button
                type="submit"
                disabled={!isFormValid || isSaving}
                className={`w-full h-[50px] mt-4 flex items-center justify-center rounded-xl text-base font-semibold transition text-white ${
                     (!isFormValid || isSaving)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-darkPink hover:bg-opacity-90'
                }`}
            >
                {isSaving ? (
                     <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /* SVG copied from checkout */>...</svg>
                        Saving...
                    </>
                ) : (
                     <>
                        <CheckIcon className="w-5 h-5 mr-2"/>
                        Save Changes
                    </>
                )}
            </button>
         </form>
     </div>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute>
      <EditProfilePageContent />
    </ProtectedRoute>
  );
}