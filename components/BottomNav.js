import { useRouter } from 'next/router';
import Link from 'next/link';
import { HomeIcon as HomeOutline, ShoppingCartIcon as CartOutline, DocumentTextIcon as OrdersOutline, UserCircleIcon as AccountOutline } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, ShoppingCartIcon as CartSolid, DocumentTextIcon as OrdersSolid, UserCircleIcon as AccountSolid } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

const navItems = [
  { path: '/home', label: 'Home', IconOutline: HomeOutline, IconSolid: HomeSolid },
  { path: '/cart', label: 'Cart', IconOutline: CartOutline, IconSolid: CartSolid },
  { path: '/orders', label: 'Orders', IconOutline: OrdersOutline, IconSolid: OrdersSolid },
  { path: '/account', label: 'Account', IconOutline: AccountOutline, IconSolid: AccountSolid },
];

const NavItem = ({ item, isSelected, totalItems }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = isSelected ? item.IconSolid : item.IconOutline;
  const isCart = item.path === '/cart';

  return (
    <Link href={item.path} passHref style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          width: '60px',
          padding: '8px',
          textDecoration: 'none'
        }}
      >
        {/* Icon container */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: isSelected ? 'rgba(220, 12, 37, 0.1)' : 'transparent',
            transition: 'all 0.3s',
            transform: isHovered && !isSelected ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <Icon
            style={{
              width: '24px',
              height: '24px',
              color: isSelected ? '#DC0C25' : '#6B7280',
              transition: 'color 0.3s'
            }}
          />
          {/* Cart Badge - Show only on Cart icon and if items > 0 */}
          {isCart && totalItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'white',
                backgroundColor: '#DC2626',
                borderRadius: '9999px',
                border: '2px solid white'
              }}
            >
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </div>
        {/* Label */}
        <span
          style={{
            marginTop: '4px',
            fontSize: '12px',
            fontWeight: 500,
            color: isSelected ? '#DC0C25' : '#4B5563',
            transition: 'color 0.3s'
          }}
        >
          {item.label}
        </span>
      </div>
    </Link>
  );
};

export default function BottomNav() {
  console.log("BottomNav component is rendering!");
  const router = useRouter();
  const currentPath = router.pathname;
  const { totalItems } = useCart();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: 'white',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
        zIndex: 50,
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '100%',
          maxWidth: '512px',
          margin: '0 auto',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        {navItems.map((item) => {
          const isSelected = currentPath === item.path;
          return (
            <NavItem
              key={item.path}
              item={item}
              isSelected={isSelected}
              totalItems={totalItems}
            />
          );
        })}
      </div>
    </nav>
  );
}