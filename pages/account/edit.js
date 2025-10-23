import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

// Dropdown Component
const SelectDropdown = ({ label, value, options, onSelect, required = false, disabled = false, error = false, errorText = '' }) => {
  return (
    <div style={{ width: '100%' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '4px'
      }}>
        {label} {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          border: error ? '1px solid #EF4444' : '1px solid #D1D5DB',
          borderRadius: '12px',
          outline: 'none',
          backgroundColor: disabled ? '#F3F4F6' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(213, 0, 50, 0.2)'}
        onBlur={(e) => e.target.style.boxShadow = 'none'}
      >
        <option value="">{disabled ? 'Loading...' : `Select ${label}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && errorText && (
        <p style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#DC2626'
        }}>{errorText}</p>
      )}
    </div>
  );
};

// Input Field Component
const InputField = ({ label, value, onChange, placeholder = '', required = false, error = false, errorText = '', type = 'text' }) => {
  return (
    <div style={{ width: '100%' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '4px'
      }}>
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          border: error ? '1px solid #EF4444' : '1px solid #D1D5DB',
          borderRadius: '12px',
          outline: 'none'
        }}
        onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(213, 0, 50, 0.2)'}
        onBlur={(e) => e.target.style.boxShadow = 'none'}
      />
      {error && errorText && (
        <p style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#DC2626'
        }}>{errorText}</p>
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
  const [validationErrors, setValidationErrors] = useState({});

  // --- Validation ---
  const validateForm = () => {
    const errors = {};
    if (!phone) errors.phone = "Phone number is required.";
    if (!selectedBase) errors.baseLocation = "Main location is required.";
    if (!selectedSub) errors.subLocation = "Area is required.";
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
    if (!user || baseLocationOptions.length === 0) return;

    setIsLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || user.displayName || '');
          setPhone(data.phone || '');
          setBuilding(data.building || '');
          setFloor(data.floor || '');
          setRoom(data.room || '');
          const savedBase = data.baseLocation || '';
          if (savedBase && allLocations[savedBase]) {
            setSelectedBase(savedBase);
            setSubLocationOptions(allLocations[savedBase]);
            setSelectedSub(data.subLocation || '');
          } else {
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
  }, [user, allLocations, baseLocationOptions]);

  // --- Handle location selections ---
  const handleBaseSelect = (base) => {
    setSelectedBase(base);
    setSubLocationOptions(allLocations[base] || []);
    setSelectedSub('');
    setValidationErrors(prev => ({ ...prev, baseLocation: '', subLocation: '' }));
  };

  const handleSubSelect = (sub) => {
    setSelectedSub(sub);
    setValidationErrors(prev => ({ ...prev, subLocation: '' }));
  };

  // --- Handle Save Changes ---
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving || !user) return;

    setIsSaving(true);
    setError('');

    const profileUpdates = {};
    if (name !== (user.displayName || '')) profileUpdates.displayName = name;

    const firestoreUpdates = {
      name: name || 'Yumzy User',
      phone: phone,
      baseLocation: selectedBase,
      subLocation: selectedSub,
      building: building,
      floor: floor,
      room: room,
    };

    try {
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(user, profileUpdates);
        console.log("Firebase Auth profile updated");
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, firestoreUpdates);
      console.log("Firestore profile updated");

      alert("Profile Updated Successfully!");
      router.back();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to save changes. Please try again.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      paddingBottom: '40px'
    }}>
      {/* Top Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={() => router.back()}
          disabled={isSaving}
          style={{
            padding: '8px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeftIcon style={{ width: '24px', height: '24px', color: '#374151' }} />
        </button>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#1F2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          Edit Profile
        </h1>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSaveChanges} style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ExclamationCircleIcon style={{ width: '20px', height: '20px' }} />
            <span>{error}</span>
          </div>
        )}

        <InputField label="Your Name" value={name} onChange={setName} />
        <InputField
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          type="tel"
          required
          error={!!validationErrors.phone}
          errorText={validationErrors.phone}
        />

        <SelectDropdown
          label="Main Location"
          value={selectedBase}
          options={baseLocationOptions}
          onSelect={handleBaseSelect}
          required
          error={!!validationErrors.baseLocation}
          errorText={validationErrors.baseLocation}
        />

        <SelectDropdown
          label="Your Area"
          value={selectedSub}
          options={subLocationOptions}
          onSelect={handleSubSelect}
          required
          disabled={!selectedBase}
          error={!!validationErrors.subLocation}
          errorText={validationErrors.subLocation}
        />

        <InputField
          label="Building Name / Detail Home Address"
          value={building}
          onChange={setBuilding}
        />

        <div style={{ display: 'flex', gap: '16px' }}>
          <InputField label="Floor No." value={floor} onChange={setFloor} />
          <InputField label="Room No." value={room} onChange={setRoom} />
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isSaving}
          style={{
            width: '100%',
            height: '50px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            transition: 'all 0.2s',
            color: 'white',
            backgroundColor: (!isFormValid || isSaving) ? '#9CA3AF' : '#B70314',
            cursor: (!isFormValid || isSaving) ? 'not-allowed' : 'pointer',
            border: 'none',
            opacity: (!isFormValid || isSaving) ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!(!isFormValid || isSaving)) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!(!isFormValid || isSaving)) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isSaving ? (
            <>
              <svg
                style={{
                  animation: 'spin 1s linear infinite',
                  marginLeft: '-4px',
                  marginRight: '12px',
                  height: '20px',
                  width: '20px',
                  color: 'white'
                }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  style={{ opacity: 0.25 }}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  style={{ opacity: 0.75 }}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              Save Changes
            </>
          )}
        </button>
      </form>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
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