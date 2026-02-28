/**
 * German climate zones mapped by PLZ prefix (first 2 digits).
 * Returns heating degree days (Heizgradtage, HGT15/15) and design outdoor temperature.
 * Based on DIN 4710 / DWD reference data, simplified by region.
 */

interface ClimateData {
  /** Heating degree days (Kd) based on HGT 15/15 */
  heizgradtage: number;
  /** Design outdoor temperature °C (Norm-Außentemperatur) */
  normAussentemp: number;
  /** Average annual outdoor temperature °C */
  avgTemp: number;
  /** Region name */
  region: string;
}

// PLZ-prefix (2 digits) → climate data
// Grouped by approximate German climate zones
const climateByPlzPrefix: Record<string, ClimateData> = {
  // Northern Germany (maritime, mild winters)
  "20": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 9.0, region: "Hamburg" },
  "21": { heizgradtage: 3250, normAussentemp: -12, avgTemp: 8.8, region: "Hamburg Umland" },
  "22": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 9.0, region: "Hamburg" },
  "23": { heizgradtage: 3150, normAussentemp: -12, avgTemp: 9.1, region: "Lübeck" },
  "24": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 8.7, region: "Kiel" },
  "25": { heizgradtage: 3050, normAussentemp: -10, avgTemp: 8.9, region: "Nordfriesland" },
  "26": { heizgradtage: 3050, normAussentemp: -10, avgTemp: 9.2, region: "Ostfriesland" },
  "27": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.1, region: "Bremen Nord" },
  "28": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.2, region: "Bremen" },
  "29": { heizgradtage: 3300, normAussentemp: -14, avgTemp: 8.8, region: "Lüneburger Heide" },

  // Northwest
  "30": { heizgradtage: 3250, normAussentemp: -12, avgTemp: 9.0, region: "Hannover" },
  "31": { heizgradtage: 3300, normAussentemp: -12, avgTemp: 8.9, region: "Hildesheim" },
  "32": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 9.0, region: "Herford" },
  "33": { heizgradtage: 3250, normAussentemp: -12, avgTemp: 8.9, region: "Bielefeld" },
  "34": { heizgradtage: 3350, normAussentemp: -14, avgTemp: 8.5, region: "Kassel" },
  "35": { heizgradtage: 3300, normAussentemp: -12, avgTemp: 8.8, region: "Gießen" },
  "36": { heizgradtage: 3400, normAussentemp: -14, avgTemp: 8.3, region: "Fulda" },
  "37": { heizgradtage: 3400, normAussentemp: -14, avgTemp: 8.4, region: "Göttingen" },
  "38": { heizgradtage: 3450, normAussentemp: -14, avgTemp: 8.3, region: "Braunschweig" },
  "39": { heizgradtage: 3400, normAussentemp: -14, avgTemp: 8.6, region: "Magdeburg" },

  // West (Ruhrgebiet / Rheinland)
  "40": { heizgradtage: 3000, normAussentemp: -10, avgTemp: 10.0, region: "Düsseldorf" },
  "41": { heizgradtage: 3000, normAussentemp: -10, avgTemp: 10.0, region: "Mönchengladbach" },
  "42": { heizgradtage: 3050, normAussentemp: -10, avgTemp: 9.8, region: "Wuppertal" },
  "43": { heizgradtage: 3050, normAussentemp: -10, avgTemp: 9.7, region: "Essen Nord" },
  "44": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.5, region: "Dortmund" },
  "45": { heizgradtage: 3050, normAussentemp: -10, avgTemp: 9.7, region: "Essen" },
  "46": { heizgradtage: 3050, normAussentemp: -10, avgTemp: 9.8, region: "Oberhausen" },
  "47": { heizgradtage: 3000, normAussentemp: -10, avgTemp: 10.0, region: "Duisburg" },
  "48": { heizgradtage: 3150, normAussentemp: -12, avgTemp: 9.3, region: "Münster" },
  "49": { heizgradtage: 3150, normAussentemp: -12, avgTemp: 9.2, region: "Osnabrück" },

  // Rhineland / Southwest
  "50": { heizgradtage: 2950, normAussentemp: -10, avgTemp: 10.2, region: "Köln" },
  "51": { heizgradtage: 2950, normAussentemp: -10, avgTemp: 10.2, region: "Köln Umland" },
  "52": { heizgradtage: 3050, normAussentemp: -10, avgTemp: 9.8, region: "Aachen" },
  "53": { heizgradtage: 3000, normAussentemp: -10, avgTemp: 10.0, region: "Bonn" },
  "54": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.5, region: "Trier" },
  "55": { heizgradtage: 3000, normAussentemp: -10, avgTemp: 10.1, region: "Mainz" },
  "56": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.5, region: "Koblenz" },
  "57": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 9.0, region: "Siegen" },
  "58": { heizgradtage: 3150, normAussentemp: -12, avgTemp: 9.2, region: "Hagen" },
  "59": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.4, region: "Hamm" },

  // Southwest / Hessen
  "60": { heizgradtage: 2900, normAussentemp: -10, avgTemp: 10.3, region: "Frankfurt" },
  "61": { heizgradtage: 3000, normAussentemp: -10, avgTemp: 10.0, region: "Bad Homburg" },
  "63": { heizgradtage: 2950, normAussentemp: -10, avgTemp: 10.1, region: "Offenbach" },
  "64": { heizgradtage: 2900, normAussentemp: -10, avgTemp: 10.3, region: "Darmstadt" },
  "65": { heizgradtage: 2950, normAussentemp: -10, avgTemp: 10.1, region: "Wiesbaden" },
  "66": { heizgradtage: 3000, normAussentemp: -10, avgTemp: 10.0, region: "Saarbrücken" },
  "67": { heizgradtage: 2800, normAussentemp: -10, avgTemp: 10.5, region: "Mannheim" },
  "68": { heizgradtage: 2800, normAussentemp: -10, avgTemp: 10.5, region: "Mannheim" },
  "69": { heizgradtage: 2850, normAussentemp: -10, avgTemp: 10.4, region: "Heidelberg" },

  // Baden-Württemberg
  "70": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.5, region: "Stuttgart" },
  "71": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.5, region: "Böblingen" },
  "72": { heizgradtage: 3300, normAussentemp: -14, avgTemp: 8.8, region: "Tübingen" },
  "73": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 9.0, region: "Esslingen" },
  "74": { heizgradtage: 3100, normAussentemp: -12, avgTemp: 9.4, region: "Heilbronn" },
  "75": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 9.1, region: "Pforzheim" },
  "76": { heizgradtage: 2850, normAussentemp: -10, avgTemp: 10.3, region: "Karlsruhe" },
  "77": { heizgradtage: 2900, normAussentemp: -10, avgTemp: 10.2, region: "Offenburg" },
  "78": { heizgradtage: 3300, normAussentemp: -14, avgTemp: 8.5, region: "Villingen" },
  "79": { heizgradtage: 2900, normAussentemp: -10, avgTemp: 10.5, region: "Freiburg" },

  // Bayern (South)
  "80": { heizgradtage: 3400, normAussentemp: -16, avgTemp: 8.3, region: "München" },
  "81": { heizgradtage: 3400, normAussentemp: -16, avgTemp: 8.3, region: "München" },
  "82": { heizgradtage: 3500, normAussentemp: -16, avgTemp: 8.0, region: "München Süd" },
  "83": { heizgradtage: 3500, normAussentemp: -16, avgTemp: 7.8, region: "Rosenheim" },
  "84": { heizgradtage: 3400, normAussentemp: -16, avgTemp: 8.2, region: "Landshut" },
  "85": { heizgradtage: 3450, normAussentemp: -16, avgTemp: 8.1, region: "Freising" },
  "86": { heizgradtage: 3400, normAussentemp: -16, avgTemp: 8.2, region: "Augsburg" },
  "87": { heizgradtage: 3600, normAussentemp: -16, avgTemp: 7.5, region: "Kempten" },
  "88": { heizgradtage: 3400, normAussentemp: -14, avgTemp: 8.5, region: "Ravensburg" },
  "89": { heizgradtage: 3350, normAussentemp: -14, avgTemp: 8.5, region: "Ulm" },

  // Bayern (North)
  "90": { heizgradtage: 3350, normAussentemp: -14, avgTemp: 8.6, region: "Nürnberg" },
  "91": { heizgradtage: 3350, normAussentemp: -14, avgTemp: 8.6, region: "Erlangen" },
  "92": { heizgradtage: 3400, normAussentemp: -14, avgTemp: 8.4, region: "Amberg" },
  "93": { heizgradtage: 3350, normAussentemp: -14, avgTemp: 8.5, region: "Regensburg" },
  "94": { heizgradtage: 3500, normAussentemp: -16, avgTemp: 7.8, region: "Passau" },
  "95": { heizgradtage: 3500, normAussentemp: -16, avgTemp: 7.8, region: "Bayreuth" },
  "96": { heizgradtage: 3450, normAussentemp: -14, avgTemp: 8.2, region: "Bamberg" },
  "97": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 9.0, region: "Würzburg" },

  // Eastern Germany
  "01": { heizgradtage: 3350, normAussentemp: -14, avgTemp: 8.6, region: "Dresden" },
  "02": { heizgradtage: 3450, normAussentemp: -16, avgTemp: 8.2, region: "Görlitz" },
  "03": { heizgradtage: 3400, normAussentemp: -14, avgTemp: 8.4, region: "Cottbus" },
  "04": { heizgradtage: 3300, normAussentemp: -14, avgTemp: 8.8, region: "Leipzig" },
  "06": { heizgradtage: 3350, normAussentemp: -14, avgTemp: 8.7, region: "Halle" },
  "07": { heizgradtage: 3400, normAussentemp: -14, avgTemp: 8.3, region: "Jena" },
  "08": { heizgradtage: 3500, normAussentemp: -16, avgTemp: 7.9, region: "Zwickau" },
  "09": { heizgradtage: 3500, normAussentemp: -16, avgTemp: 7.8, region: "Chemnitz" },
  "10": { heizgradtage: 3200, normAussentemp: -14, avgTemp: 9.1, region: "Berlin" },
  "12": { heizgradtage: 3200, normAussentemp: -14, avgTemp: 9.1, region: "Berlin" },
  "13": { heizgradtage: 3200, normAussentemp: -14, avgTemp: 9.1, region: "Berlin" },
  "14": { heizgradtage: 3250, normAussentemp: -14, avgTemp: 9.0, region: "Potsdam" },
  "15": { heizgradtage: 3300, normAussentemp: -14, avgTemp: 8.8, region: "Frankfurt (Oder)" },
  "16": { heizgradtage: 3300, normAussentemp: -14, avgTemp: 8.8, region: "Eberswalde" },
  "17": { heizgradtage: 3250, normAussentemp: -14, avgTemp: 8.5, region: "Greifswald" },
  "18": { heizgradtage: 3150, normAussentemp: -12, avgTemp: 8.8, region: "Rostock" },
  "19": { heizgradtage: 3200, normAussentemp: -12, avgTemp: 8.9, region: "Schwerin" },

  // Thüringen / Sachsen-Anhalt
  "98": { heizgradtage: 3600, normAussentemp: -16, avgTemp: 7.5, region: "Suhl" },
  "99": { heizgradtage: 3500, normAussentemp: -16, avgTemp: 7.8, region: "Erfurt" },
};

// Default for unmapped PLZ prefixes
const defaultClimate: ClimateData = {
  heizgradtage: 3200,
  normAussentemp: -12,
  avgTemp: 9.0,
  region: "Deutschland (Durchschnitt)",
};

export function getClimateData(plz: string): ClimateData {
  const prefix = plz.substring(0, 2);
  return climateByPlzPrefix[prefix] || defaultClimate;
}
