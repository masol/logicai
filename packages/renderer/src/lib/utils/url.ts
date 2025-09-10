import { BROWSER } from 'esm-env';

/**
 * 从 URL hash 中获取指定键的值。
 * 例如：#id=123&name=test -> getHashValue('id') -> '123'
 * @param key The key to look for in the hash.
 * @returns The value associated with the key, or null if not found.
 */
export function getHashValue(key: string): string | null {
  if (!BROWSER) {
    return null;
  }

  const hash = window.location.hash.substring(1); // 移除 '#'
  const params = new URLSearchParams(hash);

  return params.get(key);
}
