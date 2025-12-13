// Data-service för att hämta och parsa genuina_tecken.json
export async function fetchGenuinaTeckenData(): Promise<any[]> {
  try {
    const response = await fetch('/data/genuina_tecken.json');
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    return [];
  }
}
