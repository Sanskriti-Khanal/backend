# Kundali Milan – DB usage (backend vs myapp_java)

## backend-main

- **Milan calculation (Ashtakoot):** No database. Uses `ashtakoot-data.js` (nakshatra metadata + matrices) and `nakshatra.js`. Same logic as myapp_java `OooO0O0` / `OooO0OO`.
- **Milan location:** `MilanService` tries **MJ1.db** first (via `mj1-location.js`) so results match myapp_java; if city/country not found in MJ1, falls back to **ThauHaru.db** (LocationService). Other features (kundali, gochar, barshafal, etc.) use ThauHaru only.
- **MJ1.db:** Used by Milan for location (Countries/Cities); also used elsewhere for prediction data (muntha, varsafal, panchanga).

## myapp_java

- **Milan calculation (Ashtakoot):** No database. Uses in-memory `OooO0O0` (nakshatra list + matrices in `OooO0OO`). All 8 kootas computed on device.
- **MJ1.db:** Used by `DatabaseHelper` / `DatabaseData` for **location** (city, country, GMT) in `KundaliMilanInfo` (birth place picker, city/country lookup). Same role as ThauHaru.db in backend.
- **ThauHaru.db:** Not present in myapp_java; Java uses MJ1.db for location.

## Summary

| Component        | backend-main (Milan)     | myapp_java |
|-----------------|--------------------------|------------|
| Milan 8 kootas  | No DB                    | No DB      |
| Milan location  | MJ1.db first, ThauHaru fallback | MJ1.db     |
| Other location  | ThauHaru.db              | MJ1.db     |
| Predictions     | MJ1.db (other)           | MJ1.db     |

So: Milan uses MJ1 for location first (match Java); fallback ThauHaru. Other flows unchanged.

**Note:** For Milan to use MJ1 for location, `data/astrology/MJ1.db` must contain `Countries` and `Cities` tables (same schema as myapp_java). If they are missing, Milan falls back to ThauHaru automatically.

---

## Why Ashtakoot results can differ from myapp_java (same data, same logic)

Even with the same birth details, results can differ for these reasons:

### 1. **Location database (most likely)**

- **myapp_java** uses **only MJ1.db** for Milan (city, country, GMT, lat/lon).
- **Backend** uses **MJ1 first, then ThauHaru** if the city/country is not found in MJ1.

If the backend falls back to ThauHaru:

- **GMT** can be different (e.g. Nepal: 5.75 in MJ1 vs 5.5 in ThauHaru).
- **Lat/lon** can be different for the same city name.
- Different GMT → different UT moment → different Moon position → different nakshatra / moon sign → **different Ashtakoot points**.

**Fix:** Use the **same MJ1.db** as the Java app (copy from the Java project into `backend-main/data/astrology/MJ1.db`). Ensure `Countries` and `Cities` have the same rows and that city/country names and timezone strings match what the app sends (e.g. "nepal", "asia/kathmandu"). Then the backend will resolve location from MJ1 and use the same GMT/lat/lon as Java.

### 2. **City/country not found in MJ1**

If the app sends a city or country that exists in ThauHaru but not in MJ1, the backend will use ThauHaru and results will not match Java (which would fail or use a different lookup). Use only cities/countries that exist in the same MJ1 used by the Java app.

### 3. **Birth time and timezone**

- Birth time must be **local time** at the place of birth.
- The app must send the **same timezone string** as stored in MJ1 (e.g. `Asia/Kathmandu`). Java uses `BirthCountry.getText().split(">>")[1].trim()` for timezone; the backend uses `location.timezone` from the request.

### 4. **Logic and data alignment (already matched)**

- Nakshatra index: backend uses `floor(moonLongitude / 13.333...)` (0–26), same as standard 27 nakshatras.
- Matrices (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi) and koota order are ported from the Java matrices; indexing is [girl-1][boy-1] where documented.
- Moon sign 1–12 and nakshatra metadata (vashya, yoni, gana, nadi) come from `ashtakoot-data.js`, aligned with the Java nakshatra list.

So: **for identical Ashtakoot to myapp_java, use the same MJ1.db, same city/country/timezone, and same birth time.** If results still differ, compare Moon longitude and nakshatra index (and which DB was used for location) for one test case.

### 5. Why swapping matrix order (boy/girl) may show no change

- **Tara** and **Nadi** matrices are symmetric (same value for [boy][girl] and [girl][boy]), so changing the lookup order does not change the points. You will see no difference for these two.
- For **Varna**, **Gana**, **Yoni**, swapping can change the result; if you still see no change, either the backend was not restarted after the code change, or for that specific pair the two cells are equal (e.g. same varna, or same gana and not the 0 case).
- The most likely cause of mismatches with the real app is **different Moon position** (different location DB or timezone → different nakshatra/sign), not matrix order. Compare the Milan API response field `raw_engine_data` (boyMoonSign, girlMoonSign, boyNakshatraIndex, girlNakshatraIndex) with what the real app uses; if these match, then the difference is in matrix data or lookup order.

---

## Optional: External Ashtakoot Milan API

Instead of the built-in Ashtakoot calculation, you can use a third-party API for Kundali Milan.

### Free Astrology API (freeastrologyapi.com)

1. Sign up at [freeastrologyapi.com](https://freeastrologyapi.com) and get an API key.
2. Set environment variables:
   - `MILAN_USE_EXTERNAL_API=freeastrologyapi`
   - `FREE_ASTROLOGY_API_KEY=<your-api-key>`
3. Restart the backend. Milan requests will call their Ashtakoot endpoint; the response is mapped to the same format as the built-in Milan so the Flutter app needs no changes.

**Requirements:** Boy and girl birth locations must include latitude/longitude (from city selection in the app), or a city/country that can be resolved to coordinates via LocationService.

**Charts:** Lagna/Navamsa/Moon charts are still computed by our backend (via `MilanService.getChartsForCouple`) and attached to the response, so the app continues to show charts when using the external API.
