// Data-service för att hämta och parsa Korpus.json
export async function fetchKorpusData(): Promise<any[]> {
  try {
    const res = await fetch('/data/god_korpus/Korpus.json');
    return await res.json();
  } catch (e) {
    return [];
  }
}
