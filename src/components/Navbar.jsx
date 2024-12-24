import  { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../services/firebase";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      const driverDocRef = doc(firestore, "drivers", user.uid)
      await updateDoc(driverDocRef, {
        status: "Offline",
        lastLoggedOut: new Date(),
      });
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout failed:", error);
    }
  };

  const protectedNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    { href: "/orders", label: "Orders" },
    { href: "/earnings", label: "Earnings" },
    { href: "/support", label: "Support" },
    { href: "/game", label: "Game" },
    { href: "/tracking", label: "Tracking" },
  ];

  const publicNavItems = [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
  ];

  const currentNavItems = user ? protectedNavItems : publicNavItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex justify-between items-center p-4 md:px-8 lg:px-16">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          EcoDelivery
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-600 hover:text-gray-900"
        >
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <ul className="flex space-x-6">
            {currentNavItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {user && (
              <li>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute md:hidden top-full left-0 right-0 bg-white shadow-lg">
            <ul className="flex flex-col py-4">
              {currentNavItems.map((item) => (
                <li key={item.label} className="w-full">
                  <Link
                    to={item.href}
                    className="block px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {user && (
                <li className="w-full">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
