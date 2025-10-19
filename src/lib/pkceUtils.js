/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * 
 * Implements RFC 7636 for secure OAuth flows without client secrets
 */

/**
 * Generate a cryptographically random code verifier
 * @returns {string} - Base64URL-encoded code verifier
 */
export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate code challenge from verifier
 * @param {string} codeVerifier - The code verifier
 * @returns {Promise<string>} - Base64URL-encoded SHA256 hash
 */
export async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Base64URL encode (RFC 4648)
 * @param {Uint8Array} buffer - Buffer to encode
 * @returns {string} - Base64URL-encoded string
 */
function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode
 * @param {string} str - Base64URL-encoded string
 * @returns {Uint8Array} - Decoded buffer
 */
export function base64URLDecode(str) {
  // Add padding back
  str += '='.repeat((4 - str.length % 4) % 4);
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verify code challenge against verifier
 * @param {string} codeVerifier - The code verifier
 * @param {string} codeChallenge - The code challenge
 * @returns {Promise<boolean>} - Whether the challenge matches
 */
export async function verifyCodeChallenge(codeVerifier, codeChallenge) {
  const expectedChallenge = await generateCodeChallenge(codeVerifier);
  return expectedChallenge === codeChallenge;
}
