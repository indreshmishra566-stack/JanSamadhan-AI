import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { PORTAL_LANGUAGE_OPTIONS } from "../../i18n/public";
import { useLanguage } from "../../hooks/useLanguage";

export default function LanguageSwitcher() {
  const { language: currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const currentLangLabel = PORTAL_LANGUAGE_OPTIONS.find((opt) => opt.value === currentLanguage)?.label || "English";

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-200 text-gray-700"
        title="Change language"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Globe size={18} className="text-cyan-600" />
        <span className="hidden sm:inline text-sm font-medium">{currentLangLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-xl z-50">
          <div className="sticky top-0 bg-white px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-600 uppercase">Select Language</p>
          </div>
          <div className="px-2 py-1">
            {PORTAL_LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleLanguageChange(option.value)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm rounded-lg transition-colors ${
                  currentLanguage === option.value
                    ? "bg-cyan-50 text-cyan-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                role="menuitem"
              >
                <span>{option.label}</span>
                {currentLanguage === option.value && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
