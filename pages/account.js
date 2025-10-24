import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, PencilSquareIcon, ArrowRightOnRectangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

// --- Reusable Components ---

// Info Row
const InfoRow = ({ Icon, label, value, iconColorClass = 'text-gray-500' }) => {
  const iconColor = iconColorClass.replace('text-', '');
  const colorMap = {
    'blue-500': '#3B82F6',
    'orange-500': '#F97316',
    'green-500': '#22C55E',
    'red-500': '#EF4444',
    'gray-500': '#6B7280'
  };

  const bgColorMap = {
    'blue-500': 'rgba(59, 130, 246, 0.1)',
    'orange-500': 'rgba(249, 115, 22, 0.1)',
    'green-500': 'rgba(34, 197, 94, 0.1)',
    'red-500': 'rgba(239, 68, 68, 0.1)',
    'gray-500': 'rgba(107, 114, 128, 0.1)'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      paddingTop: '12px',
      paddingBottom: '12px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColorMap[iconColor] || 'rgba(107, 114, 128, 0.1)',
        flexShrink: 0
      }}>
        <Icon style={{
          width: '20px',
          height: '20px',
          color: colorMap[iconColor] || '#6B7280'
        }} />
      </div>
      <div style={{
        flex: 1,
        minWidth: 0
      }}>
        <p style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#6B7280'
        }}>{label}</p>
        <p style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1F2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{value || '...'}</p>
      </div>
    </div>
  );
};

// App Info Modal
const AppInfoModal = ({ onClose }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '448px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          textAlign: 'center',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#B70314'
          }}>🍔 Yumzy</h2>
          <p style={{
            fontSize: '12px',
            color: '#6B7280'
          }}>Food & Grocery Delivery</p>
        </div>

        {/* Scrollable Content */}
        <div style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          fontSize: '14px'
        }}>
          {/* App Info Section */}
          <div style={{
            backgroundColor: '#FAF5FF',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #E9D5FF'
          }}>
            <p style={{
              fontWeight: 700,
              color: '#7C3AED',
              marginBottom: '8px',
              fontSize: '16px'
            }}>App Information</p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <p><span style={{ fontWeight: 600 }}>Version:</span> 1.0.0 (Web)</p>
              <p><span style={{ fontWeight: 600 }}>Release:</span> Oct {currentYear}</p>
              <p><span style={{ fontWeight: 600 }}>Platform:</span> Web</p>
            </div>
          </div>

          {/* Developer Section */}
          <div style={{
            backgroundColor: '#F0FDF4',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #BBF7D0'
          }}>
            <p style={{
              fontWeight: 700,
              color: '#16A34A',
              marginBottom: '8px',
              fontSize: '16px'
            }}>Developer</p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <p><span style={{ fontWeight: 600 }}>Name:</span> BAPPI</p>
              <p><span style={{ fontWeight: 600 }}>Email:</span> bappi616@gmail.com</p>
              <p><span style={{ fontWeight: 600 }}>LinkedIn:</span> bappi-swe</p>
            </div>
          </div>

          {/* Footer Message */}
          <p style={{
            textAlign: 'center',
            color: '#4B5563',
            paddingTop: '8px'
          }}>
            Thank you for using Yumzy! 🎉
          </p>
        </div>

        {/* Close Button */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#B70314',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'opacity 0.2s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAppInfo, setShowAppInfo] = useState(false);

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
  }, [user]);

  // Construct full address
  const fullAddress = userProfile
    ? `${userProfile.subLocation || ''}, ${userProfile.baseLocation || ''}`.replace(/^, |, $/g, '')
    : '...';

  // Get profile picture URL
  const photoUrl = user?.photoURL || userProfile?.photoUrl;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      paddingBottom: '40px'
    }}>
      {/* Custom Top Bar */}
      <div style={{
        background: 'linear-gradient(to bottom, #B70314, #8B0A10)',
        color: 'white',
        paddingTop: '40px',
        paddingBottom: '20px',
        paddingLeft: '16px',
        paddingRight: '16px',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 700,
          textAlign: 'center',
          flex: 1
        }}>My Account</h1>
        {/* Info Button */}
        <button
          onClick={() => setShowAppInfo(true)}
          title="App Info"
          style={{
            padding: '8px',
            borderRadius: '9999px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <InformationCircleIcon style={{
            width: '24px',
            height: '24px',
            color: 'rgba(255, 255, 255, 0.9)'
          }} />
        </button>
      </div>

      {/* Content Area */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '80px'
          }}>
            <p>Loading profile...</p>
          </div>
        )}

        {!isLoading && error && (
          <div style={{
            padding: '16px',
            margin: '16px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {!isLoading && !error && userProfile && (
          <>
            {/* Profile Header */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '16px'
            }}>
              <div style={{ position: 'relative' }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    style={{
                      width: '112px',
                      height: '112px',
                      borderRadius: '9999px',
                      objectFit: 'cover',
                      border: '4px solid white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCircleIcon style={{
                    width: '112px',
                    height: '112px',
                    color: '#D1D5DB'
                  }} />
                )}
                {/* Edit button overlay */}
                <button
                  onClick={() => router.push('/account/edit')}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#B70314',
                    color: 'white',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <PencilSquareIcon style={{
                    width: '20px',
                    height: '20px'
                  }} />
                </button>
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#1F2937'
              }}>
                {userProfile.name || user?.displayName || 'User'}
              </h2>
            </div>

            {/* Personal Information Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '16px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0
              }}>
                <InfoRow
                  Icon={UserCircleIcon}
                  label="Full Name"
                  value={userProfile.name || user?.displayName}
                  iconColorClass="text-blue-500"
                />
                <div style={{ borderTop: '1px solid #F3F4F6' }} />
                <InfoRow
                  Icon={EnvelopeIcon}
                  label="Email Address"
                  value={userProfile.email || user?.email}
                  iconColorClass="text-orange-500"
                />
                <div style={{ borderTop: '1px solid #F3F4F6' }} />
                <InfoRow
                  Icon={PhoneIcon}
                  label="Phone Number"
                  value={userProfile.phone}
                  iconColorClass="text-green-500"
                />
                <div style={{ borderTop: '1px solid #F3F4F6' }} />
                <InfoRow
                  Icon={MapPinIcon}
                  label="Delivery Address"
                  value={fullAddress}
                  iconColorClass="text-red-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingTop: '8px'
            }}>
              <button
                onClick={() => router.push('/account/edit')}
                style={{
                  width: '100%',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#B70314',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'opacity 0.2s',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <PencilSquareIcon style={{ width: '16px', height: '16px' }} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={logOut}
                style={{
                  width: '100%',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ArrowRightOnRectangleIcon style={{ width: '16px', height: '16px' }} />
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