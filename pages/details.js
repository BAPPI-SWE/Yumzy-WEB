import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { db } from '../firebase/config';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

// Dropdown component
const SelectDropdown = ({
  label,
  value,
  options,
  onSelect,
  required = false,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isError = required && !value;

  return (
    <div style={{ width: '100%' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151'
      }}>
        {label} {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          padding: '12px 16px',
          marginTop: '4px',
          fontSize: '18px',
          border: isError ? '2px solid #EF4444' : isFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
          borderRadius: '12px',
          outline: 'none',
          backgroundColor: disabled ? '#F3F4F6' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border 0.2s'
        }}
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
        <p style={{
          marginTop: '4px',
          fontSize: '14px',
          color: '#DC2626'
        }}>
          {label} is required.
        </p>
      )}
    </div>
  );
};

export default function UserDetails() {
  const { user, profileExists, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');

  const [allLocations, setAllLocations] = useState({});
  const [baseLocationOptions, setBaseLocationOptions] = useState([]);
  const [subLocationOptions, setSubLocationOptions] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState('');

  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [buildingFocused, setBuildingFocused] = useState(false);
  const [floorFocused, setFloorFocused] = useState(false);
  const [roomFocused, setRoomFocused] = useState(false);

  const isFormValid = phone && selectedBase && selectedSub;

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

  useEffect(() => {
    if (user && user.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const handleBaseSelect = (base) => {
    setSelectedBase(base);
    setSubLocationOptions(allLocations[base] || []);
    setSelectedSub('');
  };

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
    };

    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      window.location.reload();
    } catch (err) {
      console.error('Failed to save profile', err);
      setFormError('Failed to save profile. Please try again.');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth');
      }
      if (user && profileExists) {
        router.push('/home');
      }
    }
  }, [user, profileExists, loading, router]);

  if (loading || !user || profileExists) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '16px',
      backgroundColor: '#F9FAFB'
    }}>
      <form
        onSubmit={handleSave}
        style={{
          width: '100%',
          maxWidth: '448px',
          padding: '24px',
          paddingTop: '32px',
          paddingBottom: '32px',
          marginTop: '40px',
          marginBottom: '40px',
          backgroundColor: 'white',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px'
        }}
      >
        <h1 style={{
          fontSize: '30px',
          fontWeight: 700,
          textAlign: 'center',
          color: '#D50032'
        }}>
          Complete Your Profile
        </h1>
        <p style={{
          marginTop: '8px',
          textAlign: 'center',
          color: '#4B5563'
        }}>
          Please provide this info for accurate delivery.
        </p>

        {formError && (
          <p style={{
            marginTop: '16px',
            textAlign: 'center',
            color: '#991B1B',
            backgroundColor: '#FEE2E2',
            padding: '12px',
            borderRadius: '8px'
          }}>
            {formError}
          </p>
        )}

        <div style={{
          marginTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            placeholder="Your Name"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              border: nameFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            placeholder="Phone Number *"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              border: phone ? (phoneFocused ? '2px solid #D50032' : '1px solid #D1D5DB') : '2px solid #EF4444',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
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
            onFocus={() => setBuildingFocused(true)}
            onBlur={() => setBuildingFocused(false)}
            placeholder="Building Name / Detail Home Address"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              border: buildingFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
          />

          <div style={{ display: 'flex', gap: '16px' }}>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              onFocus={() => setFloorFocused(true)}
              onBlur={() => setFloorFocused(false)}
              placeholder="Floor No."
              style={{
                width: '50%',
                padding: '12px 16px',
                fontSize: '18px',
                border: floorFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
            />
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              onFocus={() => setRoomFocused(true)}
              onBlur={() => setRoomFocused(false)}
              placeholder="Room No."
              style={{
                width: '50%',
                padding: '12px 16px',
                fontSize: '18px',
                border: roomFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isProcessing}
          style={{
            width: '100%',
            height: '56px',
            marginTop: '40px',
            fontSize: '18px',
            fontWeight: 600,
            color: 'white',
            backgroundColor: (!isFormValid || isProcessing) ? '#9CA3AF' : '#D50032',
            borderRadius: '12px',
            border: 'none',
            cursor: (!isFormValid || isProcessing) ? 'not-allowed' : 'pointer',
            opacity: (!isFormValid || isProcessing) ? 1 : 1,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (!isFormValid || isProcessing) ? null : (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (!isFormValid || isProcessing) ? null : (e.currentTarget.style.opacity = '1')}
        >
          {isProcessing ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
}