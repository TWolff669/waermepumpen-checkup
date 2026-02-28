import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SimulationResult, SimulationInput } from "@/lib/simulation";
import type { SzenarioExportData } from "@/components/ScenarioSimulator";

// ─── Label helpers ─────────────────────────────────────────────────

const BAUJAHR_LABELS: Record<string, string> = {
  vor1960: "Vor 1960", "1960-1978": "1960–1978", "1979-1995": "1979–1995",
  "1996-2002": "1996–2002", "2003-2015": "2003–2015", ab2016: "Ab 2016",
};

const GEBAEUDE_LABELS: Record<string, string> = {
  neubau: "Neubau", altbau: "Altbau (unsaniert)", teilsaniert: "Altbau (teilsaniert)", saniert: "Altbau (kernsaniert)",
};

const RENOVIERUNG_LABELS: Record<string, string> = {
  dach: "Dach", fenster: "Fenster", fassade: "Fassade", kellerdecke: "Kellerdecke",
};

const HEIZUNGSTYP_LABELS: Record<string, string> = {
  flaechenheizung: "Flächenheizung", heizkoerper: "Heizkörper",
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
const BLUE = [100, 180, 220] as const;
const YELLOW = [220, 180, 50] as const;

function drawScoreGauge(doc: jsPDF, cx: number, cy: number, r: number, score: number) {
  const color = score >= 70 ? GREEN : score >= 40 ? WARN : RED;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(3);
  doc.circle(cx, cy, r, "S");
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(3);
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * score) / 100;
  const steps = Math.max(20, Math.round(score));
  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + ((endAngle - startAngle) * i) / steps;
    const a2 = startAngle + ((endAngle - startAngle) * (i + 1)) / steps;
    doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
  }
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${score}`, cx, cy + 2, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("/100", cx, cy + 7, { align: "center" });
}

function drawBarChart(doc: jsPDF, x: number, y: number, width: number, bars: { label: string; value: number; color: readonly [number, number, number] }[]) {
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const barH = 10;
  const gap = 6;
  bars.forEach((bar, i) => {
    const by = y + i * (barH + gap);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(bar.label, x, by + 4);
    const barX = x + 45;
    const barW = width - 45 - 30;
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(barX, by - 1, barW, barH, 2, 2, "F");
    const fillW = Math.max(2, (bar.value / maxVal) * barW);
    doc.setFillColor(bar.color[0], bar.color[1], bar.color[2]);
    doc.roundedRect(barX, by - 1, fillW, barH, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(bar.value.toLocaleString("de-DE"), barX + barW + 2, by + 5);
  });
}

function drawPieChart(doc: jsPDF, cx: number, cy: number, r: number, segments: { value: number; color: readonly [number, number, number]; label: string }[]) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return;
  let currentAngle = -Math.PI / 2;
  segments.forEach((seg) => {
    const sweepAngle = (seg.value / total) * 2 * Math.PI;
    doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
    const steps = Math.max(12, Math.round(sweepAngle * 20));
    for (let i = 0; i < steps; i++) {
      const a1 = currentAngle + (sweepAngle * i) / steps;
      const a2 = currentAngle + (sweepAngle * (i + 1)) / steps;
      // @ts-ignore
      doc.triangle(cx, cy, cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2), "F");
    }
    currentAngle += sweepAngle;
  });
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

function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 15) {
    doc.addPage();
    return margin;
  }
  return y;
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, x, y);
  return y + 4;
}

// ─── Main export ───────────────────────────────────────────────────

export function exportResultsPDF(result: SimulationResult, input?: SimulationInput, szenarioData?: SzenarioExportData) {
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

  // ── Score Gauge + Summary ──
  const hasComparison = result.score !== -1;

  if (hasComparison) {
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
  } else {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Simulationsergebnisse", margin, y + 6);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Kein Ist-Verbrauch hinterlegt — kein Vergleich möglich", margin, y + 13);
    doc.text(`Klimaregion: ${result.climateRegion}`, margin, y + 19);
    if (result.isAdvanced) doc.text("Erweiterter Check", margin, y + 25);
  }
  y += 42;

  // ── Kostenanalyse ──
  if (result.kostenAnalyse) {
    y = ensureSpace(doc, y, 30, margin);
    y = sectionTitle(doc, "Kostenanalyse", margin, y);
    const ka = result.kostenAnalyse;
    const kostenRows: string[][] = [
      ["Strompreis", `${ka.strompreis} ct/kWh`],
    ];
    if (hasComparison && ka.einsparpotenzialJahr > 0) {
      kostenRows.push(["Aktuelle Stromkosten", `${ka.istKostenJahr} €/Jahr`]);
      kostenRows.push(["Optimale Stromkosten", `${ka.sollKostenJahr} €/Jahr`]);
      kostenRows.push(["Einsparpotenzial/Jahr", `${ka.einsparpotenzialJahr} €`]);
      kostenRows.push(["Einsparpotenzial 5 Jahre", `${ka.einsparpotenzial5Jahre} €`]);
    } else {
      kostenRows.push(["Geschätzte Stromkosten (Optimum)", `${ka.sollKostenJahr} €/Jahr`]);
    }
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Kennwert", "Wert"]],
      body: kostenRows,
      headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      theme: "grid",
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Input data table ──
  if (input) {
    y = ensureSpace(doc, y, 60, margin);
    y = sectionTitle(doc, "Eingabedaten", margin, y);

    const renovierungen = (input.renovierungen || []).map((r) => RENOVIERUNG_LABELS[r] || r).join(", ") || "Keine";
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
  y = ensureSpace(doc, y, 50, margin);
  y = sectionTitle(doc, "Technische Kennwerte", margin, y);

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

  // ── Heizstab-Analyse ──
  if (result.heizstabAnalyse) {
    y = ensureSpace(doc, y, 50, margin);
    y = sectionTitle(doc, "Heizstab-Analyse", margin, y);

    const ha = result.heizstabAnalyse;
    const bewertungLabel = ha.bewertung === "gut" ? "Gut" : ha.bewertung === "auffaellig" ? "Auffällig" : "Kritisch";

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Kennwert", "Wert"]],
      body: [
        ["Bewertung", bewertungLabel],
        ["Heizstab-Stromverbrauch", `${ha.stromverbrauchHeizstab.toLocaleString("de-DE")} kWh/a`],
        ["Anteil am Gesamtverbrauch", `${ha.anteilAmGesamtverbrauch}%`],
        ["JAZ mit Heizstab", ha.jazMitHeizstab.toFixed(2)],
        ["JAZ ohne Heizstab", ha.jazOhneHeizstab.toFixed(2)],
        ["Mehrkosten durch Heizstab", `${ha.mehrkostenProJahr} €/Jahr`],
      ],
      headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      theme: "grid",
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // JAZ comparison bar chart
    y = ensureSpace(doc, y, 30, margin);
    drawBarChart(doc, margin, y, pageWidth / 2 - 5, [
      { label: "JAZ mit Heizstab", value: Math.round(ha.jazMitHeizstab * 100) / 100, color: RED },
      { label: "JAZ ohne Heizstab", value: Math.round(ha.jazOhneHeizstab * 100) / 100, color: GREEN },
    ]);
    y += 30;
  }

  // ── Diagrams section ──
  y = ensureSpace(doc, y, 60, margin);
  y = sectionTitle(doc, "Diagramme", margin, y);
  y += 4;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Energiebilanz", margin, y);
  drawPieChart(doc, margin + 25, y + 22, 15, [
    { value: result.heatingDemand, color: PRIMARY, label: `Heizung: ${result.heatingDemand.toLocaleString("de-DE")} kWh` },
    { value: result.hotWaterDemand, color: BLUE, label: `Warmwasser: ${result.hotWaterDemand.toLocaleString("de-DE")} kWh` },
  ]);

  if (hasComparison) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Stromverbrauch Vergleich", pageWidth / 2 + 5, y);
    const devColor = result.deviation > 0 ? RED : GREEN;
    drawBarChart(doc, pageWidth / 2 + 5, y + 6, pageWidth / 2 - margin - 5, [
      { label: "Simuliert", value: result.simulatedConsumption, color: PRIMARY },
      { label: "Tatsächlich", value: result.actualConsumption, color: devColor },
    ]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(devColor[0], devColor[1], devColor[2]);
    doc.text(`Abweichung: ${result.deviation > 0 ? "+" : ""}${result.deviation}%`, pageWidth / 2 + 50, y + 35);
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Kein Ist-Verbrauch hinterlegt", pageWidth / 2 + 5, y + 10);
  }
  y += 50;

  // ── PV + Wärmepumpe ──
  if (result.pvAnalyse) {
    y = ensureSpace(doc, y, 70, margin);
    y = sectionTitle(doc, "PV + Wärmepumpe", margin, y);

    const pv = result.pvAnalyse;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Monat", "PV-Ertrag (kWh)", "WP-Bedarf (kWh)", "Eigenverbrauch (kWh)"]],
      body: pv.monatsdaten.map((m) => [m.monat, m.pvErtrag.toString(), m.wpBedarf.toString(), m.eigenverbrauch.toString()]),
      headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    // Summary
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`PV-Jahresertrag: ${pv.pvJahresertrag.toLocaleString("de-DE")} kWh | WP-Eigenverbrauch: ${pv.eigenverbrauchWP.toLocaleString("de-DE")} kWh (${pv.eigenverbrauchAnteil}%) | Ersparnis: ${pv.einsparungProJahr} €/Jahr`, margin, y + 4);
    y += 12;
  }

  // ── Recommendations ──
  y = ensureSpace(doc, y, 30, margin);
  y = sectionTitle(doc, "Empfehlungen", margin, y);

  const priorityLabel = (p: string) => p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig";

  result.recommendations.forEach((r) => {
    y = ensureSpace(doc, y, 20, margin);

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
      y = ensureSpace(doc, y, ctxLines.length * 3.5, margin);
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
        y = ensureSpace(doc, y, 8, margin);
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

  // ── Maßnahmen-Simulation (conditional) ──
  if (szenarioData) {
    const sz = szenarioData.szenario;

    y = ensureSpace(doc, y, 50, margin);
    y = sectionTitle(doc, "Kosten- & Amortisationsanalyse", margin, y);

    // Table 1: Ausgewählte Maßnahmen
    const massnahmenRows: string[][] = sz.ausgewaehlteMassnahmen.map((m) => [
      m.label,
      m.kostenMin === 0 && m.kostenMax === 0
        ? "Kostenlos"
        : `${m.kostenMin.toLocaleString("de-DE")}–${m.kostenMax.toLocaleString("de-DE")} €`,
    ]);
    massnahmenRows.push([
      "Gesamt",
      `${sz.gesamtkostenMin.toLocaleString("de-DE")}–${sz.gesamtkostenMax.toLocaleString("de-DE")} €`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Maßnahme", "Geschätzte Kosten"]],
      body: massnahmenRows,
      headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      theme: "grid",
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 } },
      didParseCell: (data) => {
        // Bold the last row (Gesamt)
        if (data.row.index === massnahmenRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 240, 230];
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Kennzahlen-Box
    y = ensureSpace(doc, y, 28, margin);
    doc.setFillColor(240, 248, 240);
    doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, "FD");

    const boxCenterY = y + 12;
    const col1 = margin + 8;
    const col2 = margin + (pageWidth - 2 * margin) / 3;
    const col3 = margin + 2 * (pageWidth - 2 * margin) / 3;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Erwartete COP-Verbesserung", col1, boxCenterY - 4);
    doc.text("Geschätzte jährl. Ersparnis", col2, boxCenterY - 4);
    doc.text("Amortisation", col3, boxCenterY - 4);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(`+${sz.effizienzgewinnGesamt}%`, col1, boxCenterY + 4);
    doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.text(`~${sz.kostenersparnisJahr.toLocaleString("de-DE")} €/Jahr`, col2, boxCenterY + 4);
    doc.setTextColor(WARN[0], WARN[1], WARN[2]);
    doc.text(
      sz.amortisationJahre > 0 ? `ca. ${sz.amortisationJahre} Jahre` : "sofort",
      col3,
      boxCenterY + 4
    );
    y += 30;

    // Table 2: Fördermöglichkeiten for selected measures
    const alleFoerderungen = [...szenarioData.foerderungenBund, ...szenarioData.foerderungenRegional];
    if (alleFoerderungen.length > 0) {
      y = ensureSpace(doc, y, 30, margin);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text("Passende Förderprogramme", margin, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Programm", "Förderung", "Hinweis"]],
        body: alleFoerderungen.map((f) => [
          f.programm,
          `${f.foerderquote > 0 ? `bis ${f.foerderquote}%` : ""}${f.maxBetrag ? ` (max. ${f.maxBetrag.toLocaleString("de-DE")} €)` : ""}`.trim() || "–",
          f.hinweis,
        ]),
        headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 248, 245] },
        theme: "grid",
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 35 } },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    }

    // Disclaimer for scenario section
    y = ensureSpace(doc, y, 12, margin);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(130, 130, 130);
    const scenarioDisclaimer = "Die Kostenschätzungen basieren auf Erfahrungswerten und aktuellen Marktpreisen (Stand 2025). Die tatsächlichen Kosten können je nach Region, Anlagengröße und Dienstleister abweichen. Förderbedingungen können sich ändern – prüfen Sie die aktuellen Richtlinien vor Antragstellung.";
    const sdLines = doc.splitTextToSize(scenarioDisclaimer, pageWidth - 2 * margin);
    doc.text(sdLines, margin, y);
    y += sdLines.length * 3 + 6;
  }

  // ── Fördermöglichkeiten ──
  if (result.foerderungen && result.foerderungen.length > 0) {
    y = ensureSpace(doc, y, 40, margin);
    y = sectionTitle(doc, "Fördermöglichkeiten", margin, y);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Programm", "Maßnahme", "Förderquote", "iSFP-Bonus", "Hinweis"]],
      body: result.foerderungen.map((f) => [
        f.programm,
        f.massnahme,
        `${f.foerderquote}%${f.maxBetrag ? ` (max. ${f.maxBetrag.toLocaleString("de-DE")}€)` : ""}`,
        f.isfpBonus ? "+5%" : "–",
        f.hinweis,
      ]),
      headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      theme: "grid",
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 35 } },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(130, 130, 130);
    doc.text("Angaben ohne Gewähr. Förderkonditionen können sich ändern – aktuelle Bedingungen unter energie-effizienz-experten.de prüfen.", margin, y + 3);
    y += 10;
  }

  // ── Disclaimer ──
  y = ensureSpace(doc, y, 15, margin);
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
