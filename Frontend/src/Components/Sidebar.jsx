import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpenCheck, Award, User, LogOut, Menu, X } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Quiz", path: "/quiz", icon: <BookOpenCheck className="h-5 w-5" /> },
    { name: "Recognition", path: "/recognition", icon: <Award className="h-5 w-5" /> },
    { name: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
  ];

  // Check if route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen">
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white flex flex-col z-40 h-full md:h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-green-900/30">
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            LearnFlow
          </h2>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 text-left py-3 px-4 rounded-lg ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  : "bg-[#0d1f0d]/50 border border-green-900/50 text-gray-300 hover:bg-[#0d1f0d]/70 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-green-900/30 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 flex items-center justify-center gap-2 text-sm bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white hover:bg-red-900/20 hover:border-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            <LogOut className="h-5 w-5 text-red-400" />
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}