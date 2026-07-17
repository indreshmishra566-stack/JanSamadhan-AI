import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, Pencil, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import NotificationsPanel from "./NotificationsPanel";
import LanguageSwitcher from "./LanguageSwitcher";

const ROLE_LABELS = {
  CITIZEN: "Citizen",
  ADMIN: "Admin",
  OFFICER: "Officer",
};

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const displayName = user?.first_name || user?.username;
  const initials = `${user?.first_name?.[0] || user?.username?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();
  const isCitizen = user?.role === "CITIZEN";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCitizenProfile = (edit = false) => {
    setProfileOpen(false);
    navigate(`/citizen/dashboard?tab=profile${edit ? "&edit=1" : ""}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuClick ? (
          <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden" aria-label="Open navigation">
            <Menu size={20} />
          </button>
        ) : null}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-950 text-sm font-bold">JS</div>
          <span className="font-semibold text-white hidden sm:block">Jan Samadhan AI</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsPanel />
        <LanguageSwitcher />
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title="Profile"
          >
            <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700 text-sm font-semibold">
              {initials || "U"}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <ChevronDown size={15} className={`hidden text-gray-400 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl" role="menu">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              {isCitizen ? (
                <>
                  <button
                    type="button"
                    onClick={() => openCitizenProfile(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-cyan-50 hover:text-gray-950"
                    role="menuitem"
                  >
                    <UserCircle size={17} className="text-cyan-600" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => openCitizenProfile(true)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-cyan-50 hover:text-gray-950"
                    role="menuitem"
                  >
                    <Pencil size={16} className="text-cyan-600" />
                    Edit Profile
                  </button>
                </>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500">Profile details are shown in your dashboard.</p>
              )}
            </div>
          )}
        </div>
        <button onClick={logout} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
