import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!['es', 'en', 'pt'].includes(locale as any)) {
    // Potentially redirect or throw an error if the locale is invalid
    // For now, we'll just log and default to English messages
    console.warn(`Invalid locale: ${locale}. Defaulting to English messages.`);
    return {
      messages: (await import(`./messages/en.json`)).default
    };
  }
 
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});