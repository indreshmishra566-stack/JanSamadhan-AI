# Language Converter/Switcher Implementation

## Overview
A comprehensive language converter has been implemented for the JanSamadhan AI platform, allowing citizens and other users to select their preferred language after login. The system supports **24 Indian languages** with proper Right-to-Left (RTL) support for languages like Urdu, Sindhi, and Kashmiri.

## What Was Added

### 1. **LanguageSwitcher Component** (`src/components/Shared/LanguageSwitcher.jsx`)
A React component that provides a user-friendly language selection dropdown.

**Features:**
- Globe icon button in the Navbar (between notifications and profile menu)
- Displays current language name in native script
- Dropdown menu with all 24 supported languages
- Shows checkmark for currently selected language
- Click-outside-to-close functionality
- Responsive design (hides language name on mobile, shows only icon)
- Smooth transitions and hover effects

**Supported Languages:**
- English
- Assamese (অসমীয়া)
- Bengali (বাংলা)
- Bodo (बड़ो)
- Dogri (डोगरी)
- Gujarati (ગુજરાતી)
- Hindi (हिन्दी)
- Kannada (ಕನ್ನಡ)
- Kashmiri (کٲشُر)
- Konkani (कोंकणी)
- Maithili (मैथिली)
- Malayalam (മലയാളം)
- Manipuri (ꯃꯤꯇꯩꯂꯣꯟ)
- Marathi (मराठी)
- Nepali (नेपाली)
- Odia (ଓଡ଼ିଆ)
- Punjabi (ਪੰਜਾਬੀ)
- Sanskrit (संस्कृतम्)
- Santali (ᱥᱟᱱᱛᱟᱲᱤ)
- Sindhi (سنڌي)
- Tamil (தமிழ்)
- Telugu (తెలుగు)
- Urdu (اردو)

### 2. **LanguageContext & Hook** (`src/hooks/useLanguage.js`)
A React Context-based solution for managing language state globally.

**Features:**
- `LanguageProvider`: Wrapper component to provide language context
- `useLanguage()`: Hook to access `language` and `changeLanguage` function
- Listens for language changes from other browser tabs/windows via `storage` event
- Integrates with localStorage persistence

**Usage:**
```javascript
import { useLanguage } from "../hooks/useLanguage";

function MyComponent() {
  const { language, changeLanguage } = useLanguage();
  
  const handleLanguageSwitch = (lang) => {
    changeLanguage(lang);
  };
  
  return <div>{language}</div>;
}
```

### 3. **Updated Files**

#### **App.jsx**
- Wrapped the entire app with `LanguageProvider`
- Ensures language context is available to all components
- Placement: Outside `AuthProvider` and `BrowserRouter` for maximum coverage

```jsx
<LanguageProvider>
  <AuthProvider>
    <BrowserRouter>
      {/* Routes */}
    </BrowserRouter>
  </AuthProvider>
</LanguageProvider>
```

#### **Navbar.jsx**
- Imported and added `LanguageSwitcher` component
- Positioned between `NotificationsPanel` and profile menu
- Automatically shows for all authenticated users (citizens, officers, admins)

#### **Shared/index.jsx**
- Added export for `LanguageSwitcher` component
- Allows importing from `@components/Shared`

## How It Works

### User Flow (After Login)
1. **User logs in** → Redirected to their dashboard
2. **Navbar appears** with LanguageSwitcher component
3. **User clicks globe icon** → Language dropdown opens
4. **User selects language** → 
   - Language preference saved to localStorage
   - DOM language attribute updated (`document.documentElement.lang`)
   - Text direction updated for RTL languages (`document.documentElement.dir`)
   - All components can access new language via `useLanguage()` hook
5. **Language persists** across page refreshes and sessions

### Technical Implementation

#### Language Persistence
- Uses browser `localStorage` with key: `portal_language`
- Syncs across tabs/windows via `storage` event listener
- Fallback to English if no preference found

#### RTL Support
- Automatically detects RTL languages: `ks` (Kashmiri), `sd` (Sindhi), `ur` (Urdu)
- Sets `dir="rtl"` on `document.documentElement`
- Ensures UI elements flip correctly for RTL

#### State Management
- `LanguageContext` provides single source of truth
- Components can subscribe via `useLanguage()` hook
- Updates trigger re-renders automatically in all consumers

## Integration with Existing i18n Setup

The implementation builds upon the existing internationalization infrastructure:

- **Existing:** `i18n/public.js` contains all translation strings and language definitions
- **Existing:** `setPortalLanguage()` function handles DOM updates
- **New:** `LanguageProvider` manages state globally
- **New:** `LanguageSwitcher` component provides UI for selection

## Files Modified/Created

### Created Files:
1. `src/components/Shared/LanguageSwitcher.jsx` - Language selector component
2. `src/hooks/useLanguage.js` - Language context and hook

### Modified Files:
1. `src/App.jsx` - Added LanguageProvider wrapper
2. `src/components/Shared/Navbar.jsx` - Added LanguageSwitcher
3. `src/components/Shared/index.jsx` - Added LanguageSwitcher export

## Usage Examples

### In Components
```javascript
import { useLanguage } from "../hooks/useLanguage";

function MyDashboard() {
  const { language } = useLanguage();
  
  return <div>Current language: {language}</div>;
}
```

### Programmatic Language Change
```javascript
import { useLanguage } from "../hooks/useLanguage";

function LanguageSwitchButton() {
  const { changeLanguage } = useLanguage();
  
  return (
    <button onClick={() => changeLanguage("hi")}>
      Switch to Hindi
    </button>
  );
}
```

## Testing

To verify the implementation:

1. **Navigate to Login** → `/login`
2. **Note the language selector** on login page (already existed)
3. **Login as a citizen** → Redirected to `/citizen/dashboard`
4. **Check Navbar** → Should see globe icon with language dropdown
5. **Click globe icon** → Dropdown shows all 24 languages
6. **Select a language** → 
   - Page content updates (if translations are available)
   - Language name in button updates
   - For RTL languages: Check if text direction changes
7. **Refresh page** → Language preference persists
8. **Open another tab** → Language syncs if changed in this tab

## Browser Support

- All modern browsers supporting:
  - `localStorage`
  - `storage` event (cross-tab sync)
  - React 18.3+
  - Tailwind CSS

## Future Enhancements

1. **Add translations** for dashboard pages in all 24 languages
2. **Language-specific date/time formatting**
3. **RTL layout improvements** for Urdu and Arabic-based interfaces
4. **User preference storage** in database (currently localStorage only)
5. **Accessibility improvements** for language selector
6. **Analytics** to track language usage

## Notes

- The component is **always visible** for authenticated users
- Language selection is **device-specific** (uses localStorage, not server)
- Changing language **does not** clear other user preferences
- Language works **independently** of user role (Citizen, Officer, Admin)
