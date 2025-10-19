let cachedKeys: string[] | null = null;
let counter = 0;

function loadKeys(): string[] {
  if (cachedKeys) return cachedKeys;
  const envKeys = [
    Deno.env.get('OPENAI_KEY_1'),
    Deno.env.get('OPENAI_KEY_2'),
    Deno.env.get('OPENAI_KEY_3'),
    Deno.env.get('OPENAI_KEY_4'),
    Deno.env.get('OPENAI_KEY_5'),
  ].filter((k): k is string => Boolean(k));
  cachedKeys = envKeys;
  return envKeys;
}

export function getNextKey(): { key: string, ref: string } {
  const keys = loadKeys();
  if (keys.length === 0) {
    throw new Error('No OpenAI keys configured in Edge Function secrets');
  }
  const key = keys[counter % keys.length];
  counter++;
  const ref = key.slice(0, 10) + '...';
  return { key, ref };
}










