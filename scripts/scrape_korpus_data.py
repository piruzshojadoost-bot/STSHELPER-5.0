import requests
from bs4 import BeautifulSoup
import json
import time

# Bas-URL för videolänkar
BASE_URL = "https://teckensprakskorpus.su.se/video/"

# Lista över filnamn (AUTOGENERERAD FRÅN Korpus, 158 st)
FILNAMN_LIST = [
    "ssl_ji_fab1.eaf", "ssl_ji_fab2.eaf", "ssl_ji_fab3.eaf", "ssl_ji_fab4.eaf", "ssl_ji_fab5.eaf", "ssl_ji_fab6.eaf", "ssl_ji_fab7.eaf", "ssl_ji_fab8.eaf", "ssl_ji_fab9.eaf", "ssl_ji_fab10.eaf", "ssl_ji_fab11.eaf", "ssl_ji_fab12.eaf", "ssl_ji_fab13.eaf", "ssl_ji_fab14.eaf", "ssl_ji_fab15.eaf", "ssl_ji_fab16.eaf", "ssl_ji_fab17.eaf", "ssl_ji_fab18.eaf", "ssl_ji_fab19.eaf", "ssl_ji_fab20.eaf", "ssl_ji_fab21.eaf", "ssl_ji_fab22.eaf", "ssl_ji_fab23.eaf", "ssl_ji_fab24.eaf", "ssl_ji_fab25.eaf", "ssl_ji_fab26.eaf", "ssl_ji_fab27.eaf", "ssl_ji_fab28.eaf", "ssl_ji_fab29.eaf", "ssl_ji_fab30.eaf", "ssl_ji_fab31.eaf", "ssl_ji_fab32.eaf", "ssl_ji_fab33.eaf", "ssl_ji_fab34.eaf", "ssl_ji_fab35.eaf", "ssl_ji_fab36.eaf", "ssl_ji_fab37.eaf", "ssl_ji_fab38.eaf", "ssl_ji_fab39.eaf", "ssl_ji_fab40.eaf", "ssl_ji_fab41.eaf", "ssl_ji_fab42.eaf", "ssl_ji_fab43.eaf", "ssl_ji_fab44.eaf", "ssl_ji_fab45.eaf", "ssl_ji_fab46.eaf", "ssl_ji_fab47.eaf", "ssl_ji_fab48.eaf", "ssl_ji_fab49.eaf", "ssl_ji_fab50.eaf", "ssl_ji_fab51.eaf", "ssl_ji_fab52.eaf", "ssl_ji_fab53.eaf", "ssl_ji_fab54.eaf", "ssl_ji_fab55.eaf", "ssl_ji_fab56.eaf", "ssl_ji_fab57.eaf", "ssl_ji_fab58.eaf", "ssl_ji_fab59.eaf", "ssl_ji_fab60.eaf", "ssl_ji_fab61.eaf", "ssl_ji_fab62.eaf", "ssl_ji_fab63.eaf", "ssl_ji_fab64.eaf", "ssl_ji_fab65.eaf", "ssl_ji_fab66.eaf", "ssl_ji_fab67.eaf", "ssl_ji_fab68.eaf", "ssl_ji_fab69.eaf", "ssl_ji_fab70.eaf", "ssl_ji_fab71.eaf", "ssl_ji_fab72.eaf", "ssl_ji_fab73.eaf", "ssl_ji_fab74.eaf", "ssl_ji_fab75.eaf", "ssl_ji_fab76.eaf", "ssl_ji_fab77.eaf", "ssl_ji_fab78.eaf", "ssl_ji_fab79.eaf", "ssl_ji_fab80.eaf", "ssl_ji_fab81.eaf", "ssl_ji_fab82.eaf", "ssl_ji_fab83.eaf", "ssl_ji_fab84.eaf", "ssl_ji_fab85.eaf", "ssl_ji_fab86.eaf", "ssl_ji_fab87.eaf", "ssl_ji_fab88.eaf", "ssl_ji_fab89.eaf", "ssl_ji_fab90.eaf", "ssl_ji_fab91.eaf", "ssl_ji_fab92.eaf", "ssl_ji_fab93.eaf", "ssl_ji_fab94.eaf", "ssl_ji_fab95.eaf", "ssl_ji_fab96.eaf", "ssl_ji_fab97.eaf", "ssl_ji_fab98.eaf", "ssl_ji_fab99.eaf", "ssl_ji_fab100.eaf", "ssl_lm_fab1.eaf", "ssl_lm_fab2.eaf", "ssl_lm_fab3.eaf", "ssl_lm_fab4.eaf", "ssl_lm_fab5.eaf", "ssl_lm_fab6.eaf", "ssl_lm_fab7.eaf", "ssl_lm_fab8.eaf", "ssl_lm_fab9.eaf", "ssl_lm_fab10.eaf", "ssl_lm_fab11.eaf", "ssl_lm_fab12.eaf", "ssl_lm_fab13.eaf", "ssl_lm_fab14.eaf", "ssl_lm_fab15.eaf", "ssl_lm_fab16.eaf", "ssl_lm_fab17.eaf", "ssl_lm_fab18.eaf", "ssl_lm_fab19.eaf", "ssl_lm_fab20.eaf", "ssl_lm_fab21.eaf", "ssl_lm_fab22.eaf", "ssl_lm_fab23.eaf", "ssl_lm_fab24.eaf", "ssl_lm_fab25.eaf", "ssl_lm_fab26.eaf", "ssl_lm_fab27.eaf", "ssl_lm_fab28.eaf", "ssl_lm_fab29.eaf", "ssl_lm_fab30.eaf", "ssl_lm_fab31.eaf", "ssl_lm_fab32.eaf", "ssl_lm_fab33.eaf", "ssl_lm_fab34.eaf", "ssl_lm_fab35.eaf", "ssl_lm_fab36.eaf", "ssl_lm_fab37.eaf", "ssl_lm_fab38.eaf", "ssl_lm_fab39.eaf", "ssl_lm_fab40.eaf", "ssl_lm_fab41.eaf", "ssl_lm_fab42.eaf", "ssl_lm_fab43.eaf", "ssl_lm_fab44.eaf", "ssl_lm_fab45.eaf", "ssl_lm_fab46.eaf", "ssl_lm_fab47.eaf", "ssl_lm_fab48.eaf", "ssl_lm_fab49.eaf", "ssl_lm_fab50.eaf", "ssl_lm_fab51.eaf", "ssl_lm_fab52.eaf", "ssl_lm_fab53.eaf", "ssl_lm_fab54.eaf", "ssl_lm_fab55.eaf", "ssl_lm_fab56.eaf", "ssl_lm_fab57.eaf", "ssl_lm_fab58.eaf"
]

# XPath-liknande CSS-selectors för respektive fält (kan behöva justeras)
SELECTORS = {
    "Glosa_DH S1": "div > main > div > div > div > div > div:nth-child(1)",
    "Glosa_NonDH S1": "div > main > div > div > div > div > div:nth-child(2)",
    "Översättning S1": "div > main > div > div > div > div > div:nth-child(3)",
    "Glosa_DH S2": "div > main > div > div > div > div > div:nth-child(4)",
    "Glosa_NonDH S2": "div > main > div > div > div > div > div:nth-child(5)",
    "Översättning S2": "div > main > div > div > div > div > div:nth-child(6)",
}

def scrape_page(filnamn):
    url = BASE_URL + filnamn
    print(f"Hämtar: {url}")
    try:
        response = requests.get(url)
        response.raise_for_status()
    except Exception as e:
        print(f"Fel vid hämtning av {url}: {e}")
        return None
    soup = BeautifulSoup(response.text, "html.parser")
    data = {"filnamn": filnamn, "länk": url}
    for key, selector in SELECTORS.items():
        el = soup.select_one(selector)
        data[key] = el.get_text(strip=True) if el else None
    return data

def main():
    results = []
    for filnamn in FILNAMN_LIST:
        entry = scrape_page(filnamn)
        if entry:
            results.append(entry)
        time.sleep(1)  # Var snäll mot servern
    with open("scraped_korpus_data.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Klart! Data sparad i scraped_korpus_data.json")

if __name__ == "__main__":
    main()
