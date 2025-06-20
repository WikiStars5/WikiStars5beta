
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Ensure these locales match your [locale] directories and middleware config
const locales = ['en', 'es', 'pt'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.warn(`Invalid locale "${locale}" requested, returning 404.`);
    notFound();
  }

  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Could not load messages for locale "${locale}":`, error);
    // Fallback to empty messages or a default locale's messages if preferred
    // For now, let's proceed with empty messages if a file is missing or corrupt,
    // but ideally, you'd ensure all JSON files exist and are valid.
    messages = {}; 
  }
  
  return {
    messages
  };
});

