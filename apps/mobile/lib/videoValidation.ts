export type VideoValidation = { status: 'match' | 'mismatch' | 'unknown'; title?: string };

function words(value: string) {
  const ignored = new Set(['como', 'fazer', 'execucao', 'corretamente', 'com', 'para', 'uma', 'the']);
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((word) => word.length > 2 && !ignored.has(word));
}

export async function validateExerciseVideo(exerciseName: string, url: string): Promise<VideoValidation> {
  if (/youtube\.com\/results/i.test(url)) return { status: 'mismatch', title: 'Página de resultados do YouTube' };
  let endpoint: string | null = null;
  if (/youtu\.be|youtube\.com/i.test(url)) endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  if (/vimeo\.com/i.test(url)) endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  if (!endpoint) return { status: 'unknown' };
  try {
    const response = await fetch(endpoint); if (!response.ok) return { status: 'unknown' };
    const metadata = await response.json() as { title?: string }; if (!metadata.title) return { status: 'unknown' };
    const expected = words(exerciseName); const actual = new Set(words(metadata.title));
    return { status: expected.some((word) => actual.has(word)) ? 'match' : 'mismatch', title: metadata.title };
  } catch { return { status: 'unknown' }; }
}
