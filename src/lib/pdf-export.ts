import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SimulationResult } from "@/lib/simulation";

export function exportResultsPDF(result: SimulationResult) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // ── Header bar ──
  doc.setFillColor(58, 115, 87); // primary green
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("WP-Check Ergebnisbericht", margin, 24);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Erstellt am ${new Date().toLocaleDateString("de-DE")}`, margin, 32);

  y = 50;

  // ── Score section ──
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Effizienz-Score", margin, y);
  y += 8;

  const scoreColor = result.score >= 70 ? [34, 139, 84] : result.score >= 40 ? [200, 140, 30] : [200, 50, 50];
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${result.score}/100`, margin, y + 10);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const label = result.score >= 70 ? "Gute Effizienz" : result.score >= 40 ? "Verbesserungspotenzial" : "Deutliches Verbesserungspotenzial";
  doc.text(label, margin + 48, y + 4);
  doc.text(`Klimaregion: ${result.climateRegion}`, margin + 48, y + 10);
  if (result.isAdvanced) {
    doc.text("Erweiterter Check", margin + 48, y + 16);
  }

  y += 28;

  // ── Technical details table ──
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Technische Kennwerte", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Kennwert", "Wert"]],
    body: [
      ["JAZ Heizung", (result.jaz ?? 0).toFixed(2)],
      ["JAZ Warmwasser", (result.jazWarmwasser ?? 0).toFixed(2)],
      ["Vorlauftemperatur", `${result.vorlauftemperatur ?? 0} °C`],
      ["Spez. Heizwärmebedarf", `${result.specificHeatDemand ?? 0} kWh/m²·a`],
      ["Heizwärmebedarf gesamt", `${(result.heatingDemand ?? 0).toLocaleString("de-DE")} kWh/a`],
      ["Warmwasserbedarf", `${(result.hotWaterDemand ?? 0).toLocaleString("de-DE")} kWh/a`],
    ],
    headStyles: { fillColor: [58, 115, 87], fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 248, 245] },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Consumption comparison ──
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Stromverbrauch Wärmepumpe", margin, y);
  y += 4;

  const devColor = result.deviation > 0 ? [200, 50, 50] : [34, 139, 84];
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["", "kWh/Jahr"]],
    body: [
      ["Simuliert (Optimum)", result.simulatedConsumption.toLocaleString("de-DE")],
      ["Tatsächlich", result.actualConsumption.toLocaleString("de-DE")],
      ["Abweichung", `${result.deviation > 0 ? "+" : ""}${result.deviation}%`],
    ],
    headStyles: { fillColor: [58, 115, 87], fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === 2) {
        data.cell.styles.textColor = devColor;
        data.cell.styles.fontStyle = "bold";
      }
    },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Check if we need a new page for recommendations ──
  if (y > 220) {
    doc.addPage();
    y = margin;
  }

  // ── Recommendations ──
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Empfehlungen", margin, y);
  y += 4;

  const priorityLabel = (p: string) => p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig";

  // Render each recommendation as a block with context and prerequisites
  result.recommendations.forEach((r) => {
    if (y > 250) { doc.addPage(); y = margin; }

    // Priority + Category header
    const prioColor = r.priority === "high" ? [200, 50, 50] : r.priority === "medium" ? [200, 140, 30] : [120, 120, 120];
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(prioColor[0], prioColor[1], prioColor[2]);
    doc.text(priorityLabel(r.priority).toUpperCase(), margin, y);
    doc.setTextColor(58, 115, 87);
    doc.text(` · ${r.category}`, margin + doc.getTextWidth(priorityLabel(r.priority).toUpperCase() + " "), y);
    y += 5;

    // Title
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    const titleLines = doc.splitTextToSize(r.title, pageWidth - 2 * margin);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 4.5;

    // Impact
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const impactLines = doc.splitTextToSize(r.impact, pageWidth - 2 * margin);
    doc.text(impactLines, margin, y);
    y += impactLines.length * 4;

    // Context
    if (r.context) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      const ctxLines = doc.splitTextToSize(r.context.replace(/\n/g, " "), pageWidth - 2 * margin - 4);
      if (y + ctxLines.length * 3.5 > 270) { doc.addPage(); y = margin; }
      doc.text(ctxLines, margin + 2, y);
      y += ctxLines.length * 3.5;
    }

    // Prerequisites
    if (r.prerequisites && r.prerequisites.length > 0) {
      y += 2;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(58, 115, 87);
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
    // Separator line
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
