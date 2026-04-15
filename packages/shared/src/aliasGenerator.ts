import { ADJECTIVES, ANIMALS } from './aliasWords';

export function generateAlias(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${animal}${num}`;
}

const ALIAS_RE = /^[A-Za-z][A-Za-z0-9_]{2,23}$/;
export function isValidAlias(alias: string): boolean {
  return ALIAS_RE.test(alias);
}
