import {socials} from './data/socials.mjs';
import {translateText} from '../dist/localization.js';

export function puppyContactUrl(channel, puppy, language = 'ru') {
  const social = socials.find(([id]) => id === channel);
  if (!social) throw new Error(`Unknown contact channel: ${channel}`);
  const url = new URL(social[2]);
  // Telegram phone links support a draft: https://core.telegram.org/api/links#phone-number-links
  if (['telegram','whatsapp'].includes(channel)) {
    const message = puppy.status === 'available'
      ? language === 'en'
        ? `Hello! I would like to reserve ${translateText(puppy.name)} from Life with Labr. Please let me know the reservation terms.`
        : `Здравствуйте! Хочу забронировать щенка ${puppy.name} из питомника Life with Labr. Подскажите, пожалуйста, условия бронирования.`
      : language === 'en'
        ? `Hello! I am interested in ${translateText(puppy.name)} from Life with Labr. Please let me know about availability and reservation details.`
        : `Здравствуйте! Меня интересует щенок ${puppy.name} из питомника Life with Labr. Подскажите, пожалуйста, наличие и условия бронирования.`;
    url.searchParams.set('text', message);
  }
  return url.href;
}
