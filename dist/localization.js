import english from './translations-en.js';

export function translateText(text, language = 'en') {
  if (language !== 'en' || typeof text !== 'string') return text;
  const key = text.trim().replace(/\s+/g, ' ');
  const translated = english[key];
  return translated === undefined ? text : text.replace(text.trim(), translated);
}

const decode = value => value.replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"})[entity]);
const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

// Shared by the static build and the dog profile dialogs. Only human-facing
// text is translated; selectors, IDs and embedded data remain stable.
export function translateMarkup(html, language = 'en') {
  if (language !== 'en') return html;
  return html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<[^>]*>|[^<]+/gi, token => {
    if (/^<(?:script|style)\b|^<!--/i.test(token)) return token;
    if (token.startsWith('<')) return token.replace(/\b(aria-label|alt|title|placeholder|content)="([^"]*)"/g, (attribute, name, value) => {
      const translated = translateText(decode(value));
      return translated === decode(value) ? attribute : `${name}="${escape(translated)}"`;
    });
    const translated = translateText(decode(token));
    return translated === decode(token) ? token : escape(translated);
  });
}
