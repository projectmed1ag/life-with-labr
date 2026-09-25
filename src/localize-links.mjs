import {puppyContactUrl} from './puppy-contacts.mjs';

export function localizeLinks(html, language, puppies = []) {
  if (language !== 'en') return html;
  return html.replace(/<a\b[^>]*>/g, tag => {
    if (/\bhreflang=/.test(tag)) return tag;
    const puppyId = tag.match(/data-puppy-contact="([^"]+)"/)?.[1];
    const channel = tag.match(/data-contact-channel="([^"]+)"/)?.[1];
    const puppy = puppies.find(puppy => puppy.id === puppyId);
    if (puppy && channel) {
      return tag.replace(/href="[^"]+"/, `href="${puppyContactUrl(channel,puppy,language).replaceAll('&','&amp;')}"`);
    }
    return tag.replace(/href="(\/(?:[^"?#]*\/)?)([?#][^"]*)?"/, (_, route, suffix = '') => `href="/en${route}${suffix}"`);
  });
}
