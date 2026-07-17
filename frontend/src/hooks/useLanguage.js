import { createContext, useContext, useState, useEffect } from "react";
import { getPortalLanguage, setPortalLanguage } from "../i18n/public";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getPortalLanguage());

  useEffect(() => {
    // Listen for language changes from other tabs/windows
    const handleStorageChange = (event) => {
      if (event.key === "portal_language" && event.newValue) {
        setLanguageState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const changeLanguage = (newLanguage) => {
    setPortalLanguage(newLanguage);
    setLanguageState(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
