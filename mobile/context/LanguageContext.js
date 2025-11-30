import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n, { resolveLocale } from '../services/i18n';
import AsyncStorage from "@react-native-async-storage/async-storage";

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = 'user_language';

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(resolveLocale());

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) {
          i18n.locale = storedLanguage;
          setLocale(storedLanguage);
        } else {
           // Fallback to device locale if not set
           const deviceLocale = resolveLocale();
           i18n.locale = deviceLocale;
           setLocale(deviceLocale);
        }
      } catch (error) {
        console.log("Error loading language", error);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (newLocale) => {
    i18n.locale = newLocale;
    setLocale(newLocale);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
    } catch (error) {
      console.log("Error saving language", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t: (scope, options) => i18n.t(scope, options) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
