import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationsPanel from "./NotificationsPanel";

const ROLE_LABELS = {
  CITIZEN: "Citizen",
  ADMIN: "Admin",
  OFFICER: "Officer",
};

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuClick ? (
          <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden" aria-label="Open navigation">
            <Menu size={20} />
          </button>
        ) : null}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white text-sm font-bold">JS</div>
          <span className="font-semibold text-gray-900 hidden sm:block">Jan Samadhan AI</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsPanel />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-semibold">
            {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900">{user?.first_name || user?.username}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
