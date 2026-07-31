const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID =
  import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

export async function googleSearch(query) {
  const url =
    `https://www.googleapis.com/customsearch/v1` +
    `?key=${API_KEY}` +
    `&cx=${SEARCH_ENGINE_ID}` +
    `&q=${encodeURIComponent(query)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Search failed");
  }

  const data = await response.json();

  return data.items || [];
}