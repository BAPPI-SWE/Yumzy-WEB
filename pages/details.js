import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { db } from '../firebase/config';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

// This component replicates the Dropdown/ExposedDropdownMenuBox
const SelectDropdown = ({
  label,
  value,
  options,
  onSelect,
  required = false,
  disabled = false,
}) => {
  const isError = required && !value;
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 mt-1 text-lg border ${
          isError ? 'border-red-500' : 'border-gray-300'
        } rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink`}
      >
        <option value="">
          {disabled ? 'Loading...' : `Select ${label}`}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {isError && (
        <p className="mt-1 text-sm text-red-600">{label} is required.</p>
      )}
    </div>
  );
};

export default function UserDetails() {
  const { user, profileExists, loading } = useAuth();
  const router = useRouter();

  // Form State (from UserDetailsScreen.kt)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');

  // Location State (from LocationViewModel.kt)
  const [allLocations, setAllLocations] = useState({});
  const [baseLocationOptions, setBaseLocationOptions] = useState([]);
  const [subLocationOptions, setSubLocationOptions] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState('');

  // --- Validation ---
  const isFormValid = phone && selectedBase && selectedSub;

  // --- Fetch locations on load (replicating LocationViewModel) ---
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'locations'));
        const locationMap = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const baseName = data.name || '';
          const subLocations = data.subLocations || [];
          if (baseName) {
            locationMap[baseName] = subLocations;
          }
        });

        const baseOptions = Object.keys(locationMap);
        setAllLocations(locationMap);
        setBaseLocationOptions(baseOptions);
      } catch (err) {
        console.error('Failed to fetch locations', err);
        setFormError('Could not load locations. Please refresh.');
      }
    };

    fetchLocations();
  }, []);

  // --- Set initial name from auth profile ---
  useEffect(() => {
    if (user && user.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  // --- Handle location selections ---
  const handleBaseSelect = (base) => {
    setSelectedBase(base);
    setSubLocationOptions(allLocations[base] || []);
    setSelectedSub(''); // Reset sub-location
  };

  // --- Handle Save (replicating onSaveClicked) ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid || isProcessing || !user) return;

    setIsProcessing(true);
    setFormError('');

    const userProfile = {
      name: name || user.displayName || 'Yumzy User',
      phone: phone,
      baseLocation: selectedBase,
      subLocation: selectedSub,
      building: building,
      floor: floor,
      room: room,
      email: user.email,
      // We can't get FCM/OneSignal tokens securely here.
      // We will handle that in the main app.
    };

    try {
      // Save the data to Firestore in the 'users' collection
      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Success! Reload the page. The AuthContext will now see
      // profileExists=true and redirect to '/home'
      window.location.reload();
    } catch (err) {
      console.error('Failed to save profile', err);
      setFormError('Failed to save profile. Please try again.');
      setIsProcessing(false);
    }
  };

  // --- Redirect logic ---
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, go to auth
        router.push('/auth');
      }
      if (user && profileExists) {
        // Already set up, go to home
        router.push('/home');
      }
    }
  }, [user, profileExists, loading, router]);

  if (loading || !user || profileExists) {
    return <LoadingSpinner />;
  }

  // --- This is the UI, translated from UserDetailsScreen.kt ---
  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-50">
      <form
        onSubmit={handleSave}
        className="w-full max-w-md p-6 py-8 my-10 bg-white shadow-xl rounded-2xl"
      >
        <h1 className="text-3xl font-bold text-center text-deepPink">
          Complete Your Profile
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Please provide this info for accurate delivery.
        </p>

        {formError && (
          <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">
            {formError}
          </p>
        )}

        <div className="mt-8 space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number *"
            className={`w-full px-4 py-3 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink ${
              phone ? 'border-gray-300' : 'border-red-500'
            }`}
          />

          <SelectDropdown
            label="Main Location"
            value={selectedBase}
            options={baseLocationOptions}
            onSelect={handleBaseSelect}
            required
          />

          <SelectDropdown
            label="Your Area"
            value={selectedSub}
            options={subLocationOptions}
            onSelect={setSelectedSub}
            required
            disabled={!selectedBase}
          />

          <input
            type="text"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="Building Name / Detail Home Address"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink"
          />

          <div className="flex gap-4">
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Floor No."
              className="w-1/2 px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink"
            />
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Room No."
              className="w-1/2 px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isProcessing}
          className={`w-full h-[56px] mt-10 text-lg font-semibold text-white rounded-xl transition ${
            !isFormValid || isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-deepPink hover:bg-opacity-90'
          }`}
        >
          {isProcessing ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
}