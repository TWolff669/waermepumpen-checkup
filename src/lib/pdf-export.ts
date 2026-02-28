import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SimulationResult, SimulationInput } from "@/lib/simulation";

// ─── Label helpers ─────────────────────────────────────────────────

const BAUJAHR_LABELS: Record<string, string> = {
  vor1960: "Vor 1960",
  "1960-1978": "1960–1978",
  "1979-1995": "1979–1995",
  "1996-2002": "1996–2002",
  "2003-2015": "2003–2015",
  ab2016: "Ab 2016",
};

const GEBAEUDE_LABELS: Record<string, string> = {
  neubau: "Neubau",
  altbau: "Altbau (unsaniert)",
  teilsaniert: "Altbau (teilsaniert)",
  saniert: "Altbau (kernsaniert)",
};

const RENOVIERUNG_LABELS: Record<string, string> = {
  dach: "Dach",
  fenster: "Fenster",
  fassade: "Fassade",
  kellerdecke: "Kellerdecke",
};

const HEIZUNGSTYP_LABELS: Record<string, string> = {
  flaechenheizung: "Flächenheizung",
  heizkoerper: "Heizkörper",
};

function yesNo(val?: string) {
  return val === "ja" ? "Ja" : val === "nein" ? "Nein" : "Unbekannt";
}

// ─── Drawing helpers ───────────────────────────────────────────────

const PRIMARY = [58, 115, 87] as const;
const GREEN = [34, 139, 84] as const;
const WARN = [200, 140, 30] as const;
const RED = [200, 50, 50] as const;
const GREY = [160, 160, 160] as const;

/** Draw a filled score gauge arc */
function drawScoreGauge(doc: jsPDF, cx: number, cy: number, r: number, score: number) {
  const color = score >= 70 ? GREEN : score >= 40 ? WARN : RED;

  // Background circle
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(3);
  doc.circle(cx, cy, r, "S");

  // Score arc (approximated with small line segments)
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(3);
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * score) / 100;
  const steps = Math.max(20, Math.round(score));
  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + ((endAngle - startAngle) * i) / steps;
    const a2 = startAngle + ((endAngle - startAngle) * (i + 1)) / steps;
    doc.line(
      cx + r * Math.cos(a1), cy + r * Math.sin(a1),
      cx + r * Math.cos(a2), cy + r * Math.sin(a2)
    );
  }

  // Score text in center
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${score}`, cx, cy + 2, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("/100", cx, cy + 7, { align: "center" });
}

/** Draw a simple horizontal bar chart */
function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  bars: { label: string; value: number; color: readonly [number, number, number] }[]
) {
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const barH = 10;
  const gap = 6;

  bars.forEach((bar, i) => {
    const by = y + i * (barH + gap);
    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(bar.label, x, by + 4);

    // Bar background
    const barX = x + 45;
    const barW = width - 45 - 30;
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(barX, by - 1, barW, barH, 2, 2, "F");

    // Bar fill
    const fillW = Math.max(2, (bar.value / maxVal) * barW);
    doc.setFillColor(bar.color[0], bar.color[1], bar.color[2]);
    doc.roundedRect(barX, by - 1, fillW, barH, 2, 2, "F");

    // Value
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(bar.value.toLocaleString("de-DE"), barX + barW + 2, by + 5);
  });
}

/** Draw a simple pie chart with two segments */
function drawPieChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  segments: { value: number; color: readonly [number, number, number]; label: string }[]
) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return;

  let currentAngle = -Math.PI / 2;

  segments.forEach((seg) => {
    const sweepAngle = (seg.value / total) * 2 * Math.PI;
    const endAngle = currentAngle + sweepAngle;

    // Draw filled sector using triangles
    doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
    const steps = Math.max(12, Math.round(sweepAngle * 20));
    for (let i = 0; i < steps; i++) {
      const a1 = currentAngle + (sweepAngle * i) / steps;
      const a2 = currentAngle + (sweepAngle * (i + 1)) / steps;
      // @ts-ignore - triangle method
      doc.triangle(
        cx, cy,
        cx + r * Math.cos(a1), cy + r * Math.sin(a1),
        cx + r * Math.cos(a2), cy + r * Math.sin(a2),
        "F"
      );
    }

    currentAngle = endAngle;
  });

  // Legend
  let ly = cy + r + 6;
  segments.forEach((seg) => {
    doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
    doc.rect(cx - r, ly, 3, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const pct = Math.round((seg.value / total) * 100);
    doc.text(`${seg.label} (${pct}%)`, cx - r + 5, ly + 2.5);
    ly += 5;
  });
}

// ─── Main export ───────────────────────────────────────────────────

export function exportResultsPDF(result: SimulationResult, input?: SimulationInput) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0;

  // ── Header bar ──
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("WP-Check Ergebnisbericht", margin, 24);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Erstellt am ${new Date().toLocaleDateString("de-DE")}`, margin, 32);

  y = 48;

  // ── Score Gauge + Summary (side by side) ──
  drawScoreGauge(doc, margin + 18, y + 18, 16, result.score);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Effizienz-Score", margin + 42, y + 6);

  const label = result.score >= 70 ? "Gute Effizienz" : result.score >= 40 ? "Verbesserungspotenzial" : "Deutliches Verbesserungspotenzial";
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(label, margin + 42, y + 13);
  doc.text(`Klimaregion: ${result.climateRegion}`, margin + 42, y + 19);
  if (result.isAdvanced) doc.text("Erweiterter Check", margin + 42, y + 25);
  if (result.isPartialPeriod) {
    doc.setTextColor(200, 140, 30);
    doc.text(`⚠ Daten aus ${result.measurementDays} Tagen hochgerechnet`, margin + 42, y + 31);
  }

  y += 42;

  // ── Input data table ──
  if (input) {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Eingabedaten", margin, y);
    y += 4;

    const renovierungen = (input.renovierungen || [])
      .map((r) => RENOVIERUNG_LABELS[r] || r)
      .join(", ") || "Keine";

    const inputRows: string[][] = [
      ["Postleitzahl", input.postleitzahl || "–"],
      ["Gebäudetyp", GEBAEUDE_LABELS[input.gebaeudetyp] || input.gebaeudetyp || "–"],
      ["Baujahr", BAUJAHR_LABELS[input.baujahr] || input.baujahr || "–"],
      ["Beheizte Fläche", `${input.beheizteFlaeche || "–"} m²`],
      ["Renovierungen", renovierungen],
      ["Personen im Haushalt", input.personenAnzahl || "–"],
      ["Heizungstyp", HEIZUNGSTYP_LABELS[input.heizungstyp] || input.heizungstyp || "–"],
      ["Hydraulischer Abgleich", yesNo(input.hydraulischerAbgleich)],
      ["Pufferspeicher", yesNo(input.pufferspeicher)],
    ];

    if (input.isAdvanced) {
      if (input.vorlauftemperatur) inputRows.push(["Vorlauftemperatur (eingeg.)", `${input.vorlauftemperatur} °C`]);
      if (input.raumtemperatur) inputRows.push(["Raumtemperatur", `${input.raumtemperatur} °C`]);
      if (input.duschenProTag) inputRows.push(["Duschen pro Tag", input.duschenProTag]);
      inputRows.push(["WP-Heizkörper", yesNo(input.wpHeizkoerper)]);
      inputRows.push(["Autom. Raumregler", yesNo(input.automatischeRaumregler)]);
    }

    if (input.abrechnungVon && input.abrechnungBis) {
      const von = new Date(input.abrechnungVon).toLocaleDateString("de-DE");
      const bis = new Date(input.abrechnungBis).toLocaleDateString("de-DE");
      inputRows.push(["Abrechnungszeitraum", `${von} – ${bis}`]);
    }
    inputRows.push(["Stromverbrauch (eingeg.)", `${input.gesamtverbrauch || "–"} kWh`]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Parameter", "Wert"]],
      body: inputRows,
      headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      theme: "grid",
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Technical details table ──
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Technische Kennwerte", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Kennwert", "Wert", "Bewertung"]],
    body: [
      ["JAZ Heizung", (result.jaz ?? 0).toFixed(2), result.jaz >= 4.0 ? "Sehr gut" : result.jaz >= 3.5 ? "Gut" : result.jaz >= 3.0 ? "Befriedigend" : "Verbesserungsbedürftig"],
      ["JAZ Warmwasser", (result.jazWarmwasser ?? 0).toFixed(2), result.jazWarmwasser >= 3.0 ? "Sehr gut" : result.jazWarmwasser >= 2.5 ? "Gut" : "Niedrig"],
      ["Vorlauftemperatur", `${result.vorlauftemperatur ?? 0} °C`, result.vorlauftemperatur <= 35 ? "Optimal" : result.vorlauftemperatur <= 45 ? "Gut" : "Erhöht"],
      ["Spez. Heizwärmebedarf", `${result.specificHeatDemand ?? 0} kWh/m²·a`, result.specificHeatDemand <= 50 ? "Effizient" : result.specificHeatDemand <= 100 ? "Mittel" : "Hoch"],
      ["Heizwärmebedarf gesamt", `${(result.heatingDemand ?? 0).toLocaleString("de-DE")} kWh/a`, ""],
      ["Warmwasserbedarf", `${(result.hotWaterDemand ?? 0).toLocaleString("de-DE")} kWh/a`, ""],
    ],
    headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 248, 245] },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Diagrams section ──
  if (y > 180) { doc.addPage(); y = margin; }

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Diagramme", margin, y);
  y += 8;

  // Energy breakdown pie chart (left side)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Energiebilanz", margin, y);
  drawPieChart(doc, margin + 25, y + 22, 15, [
    { value: result.heatingDemand, color: PRIMARY, label: `Heizung: ${result.heatingDemand.toLocaleString("de-DE")} kWh` },
    { value: result.hotWaterDemand, color: [100, 180, 220], label: `Warmwasser: ${result.hotWaterDemand.toLocaleString("de-DE")} kWh` },
  ]);

  // Consumption comparison bar chart (right side)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Stromverbrauch Vergleich", pageWidth / 2 + 5, y);

  const devColor = result.deviation > 0 ? RED : GREEN;
  drawBarChart(doc, pageWidth / 2 + 5, y + 6, pageWidth / 2 - margin - 5, [
    { label: "Simuliert", value: result.simulatedConsumption, color: PRIMARY },
    { label: "Tatsächlich", value: result.actualConsumption, color: devColor },
  ]);

  // Deviation note
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(devColor[0], devColor[1], devColor[2]);
  doc.text(
    `Abweichung: ${result.deviation > 0 ? "+" : ""}${result.deviation}%`,
    pageWidth / 2 + 50, y + 35
  );

  y += 50;

  // ── Check if we need a new page for recommendations ──
  if (y > 220) { doc.addPage(); y = margin; }

  // ── Recommendations ──
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Empfehlungen", margin, y);
  y += 4;

  const priorityLabel = (p: string) => p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig";

  result.recommendations.forEach((r) => {
    if (y > 250) { doc.addPage(); y = margin; }

    const prioColor = r.priority === "high" ? RED : r.priority === "medium" ? WARN : GREY;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(prioColor[0], prioColor[1], prioColor[2]);
    doc.text(priorityLabel(r.priority).toUpperCase(), margin, y);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(` · ${r.category}`, margin + doc.getTextWidth(priorityLabel(r.priority).toUpperCase() + " "), y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    const titleLines = doc.splitTextToSize(r.title, pageWidth - 2 * margin);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 4.5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const impactLines = doc.splitTextToSize(r.impact, pageWidth - 2 * margin);
    doc.text(impactLines, margin, y);
    y += impactLines.length * 4;

    if (r.context) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      const ctxLines = doc.splitTextToSize(r.context.replace(/\n/g, " "), pageWidth - 2 * margin - 4);
      if (y + ctxLines.length * 3.5 > 270) { doc.addPage(); y = margin; }
      doc.text(ctxLines, margin + 2, y);
      y += ctxLines.length * 3.5;
    }

    if (r.prerequisites && r.prerequisites.length > 0) {
      y += 2;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text("Voraussetzungen / nächste Schritte:", margin + 2, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      r.prerequisites.forEach((step, j) => {
        if (y > 270) { doc.addPage(); y = margin; }
        const stepLines = doc.splitTextToSize(`${j + 1}. ${step}`, pageWidth - 2 * margin - 8);
        doc.text(stepLines, margin + 6, y);
        y += stepLines.length * 3.5;
      });
    }

    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
  });

  y += 4;

  // ── Disclaimer ──
  if (y > 260) { doc.addPage(); y = margin; }
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130, 130, 130);
  const disclaimer = "Hinweis: Diese Ergebnisse basieren auf einer vereinfachten Simulation nach VDI 4650 / DIN V 18599 und ersetzen keine professionelle Beratung durch einen Energieberater oder Fachplaner.";
  const lines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
  doc.text(lines, margin, y);

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(`WP-Check · Seite ${i} von ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 10);
    doc.text("wp-check.de", pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  doc.save(`WP-Check_Ergebnis_${new Date().toISOString().slice(0, 10)}.pdf`);
}
