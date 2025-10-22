import { useRouter } from 'next/router';
import Link from 'next/link';
import { HomeIcon as HomeOutline, ShoppingCartIcon as CartOutline, DocumentTextIcon as OrdersOutline, UserCircleIcon as AccountOutline } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, ShoppingCartIcon as CartSolid, DocumentTextIcon as OrdersSolid, UserCircleIcon as AccountSolid } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext'; // Import useCart

const navItems = [
  { path: '/home', label: 'Home', IconOutline: HomeOutline, IconSolid: HomeSolid },
  { path: '/cart', label: 'Cart', IconOutline: CartOutline, IconSolid: CartSolid },
  { path: '/orders', label: 'Orders', IconOutline: OrdersOutline, IconSolid: OrdersSolid },
  { path: '/account', label: 'Account', IconOutline: AccountOutline, IconSolid: AccountSolid },
];

export default function BottomNav() {
    console.log("BottomNav component is rendering!"); // <-- ADD THIS
  const router = useRouter();
  const currentPath = router.pathname;
  const { totalItems } = useCart(); // Get totalItems from cart context

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-50 rounded-t-[24px]">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isSelected = currentPath === item.path;
          const Icon = isSelected ? item.IconSolid : item.IconOutline;
          const isCart = item.path === '/cart';

          return (
            <Link key={item.path} href={item.path} passHref>
              <div className="relative flex flex-col items-center justify-center cursor-pointer w-[60px]"> {/* Added relative here */}
                {/* Icon container */}
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    isSelected ? 'bg-brandPink/10' : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isSelected ? 'text-brandPink' : 'text-gray-500'
                    }`}
                  />
                  {/* Cart Badge - Show only on Cart icon and if items > 0 */}
                  {isCart && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={`mt-1 text-xs font-medium transition-colors ${
                    isSelected ? 'text-brandPink' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}