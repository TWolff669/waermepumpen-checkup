export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  author: string;
  publishedAt: string;
  readingTime: string;
  excerpt: string;
  sections: {
    id: string;
    title: string;
    level: "h2" | "h3";
    content: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export const blogCategories = [
  "Effizienz",
  "Sanierung",
  "Optimierung",
  "Fachplanung",
  "Förderung",
] as const;

export const blogArticles: BlogArticle[] = [
  {
    slug: "waermepumpe-effizienz-pruefen",
    title: "Wärmepumpe effizient? So prüfen Sie die Jahresarbeitszahl Ihrer Anlage",
    metaTitle: "Wärmepumpe Effizienz prüfen – JAZ richtig bewerten & optimieren",
    metaDescription: "Lernen Sie, wie Sie die Jahresarbeitszahl (JAZ) Ihrer Wärmepumpe korrekt bewerten und ob Ihre Anlage effizient arbeitet.",
    category: "Effizienz",
    author: "Redaktion WP-Check",
    publishedAt: "2026-02-20",
    readingTime: "8 Min.",
    excerpt: "Viele Wärmepumpen arbeiten unter ihrem Potenzial. Wir zeigen, wie Sie die Jahresarbeitszahl (JAZ) richtig bewerten und wann Handlungsbedarf besteht.",
    sections: [
      {
        id: "was-ist-jaz",
        title: "Was ist die Jahresarbeitszahl (JAZ)?",
        level: "h2",
        content: "Die Jahresarbeitszahl (JAZ) ist der wichtigste Kennwert für die Effizienz einer Wärmepumpe. Sie gibt an, wie viel Wärmeenergie die Anlage pro eingesetzter Kilowattstunde Strom über ein ganzes Jahr erzeugt. Eine JAZ von 3,5 bedeutet: Aus 1 kWh Strom werden 3,5 kWh Wärme. Je höher die JAZ, desto effizienter arbeitet die Anlage.\n\nDie JAZ ist nicht zu verwechseln mit dem COP (Coefficient of Performance), der nur einen Momentanwert unter Laborbedingungen beschreibt. Die JAZ bildet den realen Jahresbetrieb ab – inklusive Abtauzyklen, Warmwasserbereitung und schwankender Außentemperaturen."
      },
      {
        id: "gute-jaz-werte",
        title: "Welche JAZ-Werte sind gut?",
        level: "h2",
        content: "Für Luft-Wasser-Wärmepumpen gilt eine JAZ ab 3,0 als akzeptabel, ab 3,5 als gut und ab 4,0 als sehr gut. Sole-Wasser-Wärmepumpen erreichen typischerweise höhere Werte von 4,0 bis 5,0, da die Erdtemperatur stabiler ist als die Außenluft.\n\nEntscheidend ist der Vergleich mit der Norm-JAZ für Ihren Gebäudetyp und Ihre Vorlauftemperatur. Ein Altbau mit 55 °C Vorlauf hat andere Referenzwerte als ein Neubau mit Fußbodenheizung bei 35 °C."
      },
      {
        id: "jaz-selbst-berechnen",
        title: "JAZ selbst berechnen: So geht's",
        level: "h2",
        content: "Für eine grobe JAZ-Berechnung benötigen Sie zwei Werte: den Stromverbrauch der Wärmepumpe (abzulesen am separaten Stromzähler) und die erzeugte Wärmemenge (abzulesen am Wärmemengenzähler).\n\nDie Formel lautet: JAZ = Wärmemenge (kWh) ÷ Stromverbrauch (kWh). Ohne Wärmemengenzähler können Sie den Wärmebedarf über die beheizte Fläche und den spezifischen Wärmebedarf Ihres Gebäudes abschätzen – genau das macht unser WP-Check Tool."
      },
      {
        id: "ursachen-niedrige-jaz",
        title: "Häufige Ursachen für eine niedrige JAZ",
        level: "h2",
        content: "Eine zu niedrige JAZ kann viele Ursachen haben: zu hohe Vorlauftemperaturen, fehlender hydraulischer Abgleich, falsch dimensionierte Anlage, häufiges Takten oder eine überdimensionierte Warmwasserbereitung.\n\nBesonders kritisch: Wenn der Heizstab regelmäßig mitläuft, sinkt die JAZ dramatisch. Viele Betreiber bemerken das nicht, weil der Heizstab automatisch zuschaltet. Ein Blick auf die Betriebsstunden des Heizstabs im Wärmepumpen-Menü gibt Aufschluss."
      },
      {
        id: "wp-check-nutzen",
        title: "WP-Check: Ihre JAZ objektiv bewerten",
        level: "h2",
        content: "Mit dem WP-Check können Sie Ihre gemessene JAZ mit dem simulierten Sollwert vergleichen. Weicht der tatsächliche Stromverbrauch deutlich nach oben ab, besteht Optimierungspotenzial. Die Analyse berücksichtigt Ihren Gebäudetyp, das Baujahr, die Klimazone und die Art der Wärmeverteilung."
      }
    ],
    faq: [
      {
        question: "Was ist eine gute Jahresarbeitszahl für eine Wärmepumpe?",
        answer: "Für Luft-Wasser-Wärmepumpen gilt eine JAZ ab 3,5 als gut. Sole-Wasser-Wärmepumpen sollten mindestens 4,0 erreichen. Der konkrete Sollwert hängt von Gebäude, Vorlauftemperatur und Klimazone ab."
      },
      {
        question: "Wie kann ich die JAZ meiner Wärmepumpe verbessern?",
        answer: "Die wichtigsten Hebel sind: Vorlauftemperatur senken, hydraulischen Abgleich durchführen, Heizkurve optimieren und den Heizstab-Einsatz minimieren. In vielen Fällen bringt eine Optimierung der Regelung bereits 10–20 % Verbesserung."
      },
      {
        question: "Brauche ich einen Wärmemengenzähler?",
        answer: "Für eine exakte JAZ-Berechnung ja. Ohne Wärmemengenzähler können Sie die JAZ nur schätzen. Der Einbau kostet ca. 200–500 € und lohnt sich zur Betriebsüberwachung in jedem Fall."
      }
    ]
  },
  {
    slug: "waermepumpe-altbau-optimieren",
    title: "Wärmepumpe im Altbau: So optimieren Sie Effizienz und Betriebskosten",
    metaTitle: "Wärmepumpe Altbau optimieren – Vorlauftemperatur, Abgleich & Sanierung",
    metaDescription: "Wärmepumpe im Altbau ineffizient? Erfahren Sie, welche Maßnahmen die Effizienz steigern und wann sich eine Nachrüstung lohnt.",
    category: "Optimierung",
    author: "Redaktion WP-Check",
    publishedAt: "2026-02-10",
    readingTime: "9 Min.",
    excerpt: "Wärmepumpen im Altbau haben es schwerer – aber mit den richtigen Maßnahmen arbeiten sie auch hier wirtschaftlich. Wir zeigen die wichtigsten Stellschrauben.",
    sections: [
      {
        id: "herausforderung-altbau",
        title: "Warum der Altbau eine besondere Herausforderung ist",
        level: "h2",
        content: "Im Altbau sind die Vorlauftemperaturen oft höher als in Neubauten, da die Heizkörper für Betriebstemperaturen von 55–70 °C ausgelegt wurden. Eine Wärmepumpe arbeitet jedoch umso effizienter, je niedriger die Vorlauftemperatur ist. Jedes Grad weniger verbessert die JAZ um etwa 2–3 %.\n\nDazu kommt ein höherer Wärmebedarf durch schlechtere Dämmung. Gebäude vor 1979 haben oft spezifische Wärmebedarfe von 120–180 kWh/m²·a, während moderne Gebäude bei 30–50 kWh/m²·a liegen."
      },
      {
        id: "vorlauftemperatur-senken",
        title: "Vorlauftemperatur senken: Der wichtigste Hebel",
        level: "h2",
        content: "Bevor Sie in Dämmung investieren, prüfen Sie, ob die Vorlauftemperatur gesenkt werden kann. Viele Altbauten sind überdimensioniert beheizt – die Heizkörper wurden für Extremtemperaturen ausgelegt, die in der Praxis selten erreicht werden.\n\nEin pragmatischer Ansatz: Senken Sie die Heizkurve schrittweise um 2–3 °C und beobachten Sie, ob die Räume noch ausreichend warm werden. Oft reicht eine Vorlauftemperatur von 45–50 °C statt der eingestellten 60 °C."
      },
      {
        id: "hydraulischer-abgleich",
        title: "Hydraulischer Abgleich: Pflicht und Chance",
        level: "h2",
        content: "Der hydraulische Abgleich stellt sicher, dass jeder Heizkörper genau die richtige Wassermenge erhält. Ohne Abgleich werden raumnahe Heizkörper überversorgt und entfernte unterversorgt. Die Folge: Die Vorlauftemperatur muss höher eingestellt werden als nötig.\n\nSeit 2024 ist der hydraulische Abgleich bei Wärmepumpen-Installation Pflicht. Er kostet je nach Gebäudegröße 500–1.500 € und wird über die Heizungsförderung mitgefördert."
      },
      {
        id: "heizkörper-tauschen",
        title: "Heizkörper tauschen oder ergänzen?",
        level: "h2",
        content: "Nicht immer ist ein kompletter Heizkörpertausch nötig. Oft reicht es, einzelne kritische Heizkörper durch größere Modelle zu ersetzen oder Plattenheizkörper mit höherer Leistung einzubauen. In Bädern kann eine Fußbodenheizung nachgerüstet werden.\n\nFaustregel: Wenn alle Räume bei 50 °C Vorlauf ausreichend warm werden, ist kein Heizkörpertausch erforderlich."
      },
      {
        id: "daemmung-priorisieren",
        title: "Dämmung gezielt priorisieren",
        level: "h2",
        content: "Nicht jede Dämmmaßnahme bringt den gleichen Effekt. Die größte Wirkung erzielen: Kellerdeckendämmung (günstig, schnell umsetzbar), oberste Geschossdecke (oft Pflicht nach GEG) und Fenstererneuerung in den Hauptwohnräumen.\n\nEine Komplettsanierung ist ideal, aber nicht immer nötig. Unser WP-Check zeigt Ihnen, wie sich einzelne Sanierungsmaßnahmen auf den simulierten Verbrauch und die JAZ auswirken."
      }
    ],
    faq: [
      {
        question: "Funktioniert eine Wärmepumpe im unsanierten Altbau?",
        answer: "Ja, aber mit Einschränkungen. Entscheidend ist die erreichbare Vorlauftemperatur. Bis 55 °C arbeiten moderne Wärmepumpen noch wirtschaftlich. Darüber sinkt die Effizienz deutlich. Einzelne Maßnahmen wie hydraulischer Abgleich helfen bereits enorm."
      },
      {
        question: "Was bringt eine Kellerdeckendämmung für die Wärmepumpe?",
        answer: "Eine Kellerdeckendämmung reduziert den Wärmebedarf um ca. 5–10 % und kostet nur 30–50 €/m². Sie ist eine der wirtschaftlichsten Maßnahmen zur Effizienzsteigerung."
      }
    ]
  },
  {
    slug: "heizstab-waermepumpe-stromfresser",
    title: "Der Heizstab: Stiller Stromfresser in vielen Wärmepumpen-Anlagen",
    metaTitle: "Heizstab Wärmepumpe – Warum er die JAZ ruiniert & wie Sie ihn vermeiden",
    metaDescription: "Der Heizstab in der Wärmepumpe kann die Stromkosten massiv erhöhen. Erfahren Sie, wann er zuschält und wie Sie seinen Einsatz minimieren.",
    category: "Effizienz",
    author: "Redaktion WP-Check",
    publishedAt: "2026-01-25",
    readingTime: "6 Min.",
    excerpt: "Bis zu 30 % Mehrverbrauch durch den Heizstab – und viele Betreiber wissen es nicht. Wir erklären, warum der Heizstab zuschält und wie Sie ihn bändigen.",
    sections: [
      {
        id: "was-macht-heizstab",
        title: "Was macht der Heizstab in der Wärmepumpe?",
        level: "h2",
        content: "Der Heizstab ist ein elektrischer Durchlauferhitzer, der in nahezu jeder Wärmepumpe verbaut ist. Er dient als Backup für Situationen, in denen die Wärmepumpe allein nicht genug Leistung liefert – etwa bei extremer Kälte oder für die Legionellen-Schutzschaltung.\n\nDas Problem: Der Heizstab wandelt Strom 1:1 in Wärme um (COP = 1,0), während die Wärmepumpe aus 1 kWh Strom 3–5 kWh Wärme erzeugt. Jede Heizstab-Stunde senkt die Gesamt-JAZ erheblich."
      },
      {
        id: "wann-schaltet-er-zu",
        title: "Wann schaltet der Heizstab zu?",
        level: "h2",
        content: "Typische Auslöser sind: Außentemperaturen unter dem Bivalenzpunkt (oft -5 bis -10 °C), Warmwasserbereitung über 55 °C (Legionellenschutz), zu hohe Vorlauftemperatur-Anforderungen und falsch eingestellte Sperrzeiten der EVU.\n\nBesonders tückisch: Bei manchen Anlagen ist der Heizstab ab Werk auf eine niedrige Einsatzschwelle eingestellt. Er springt dann schon bei +2 °C an – völlig unnötig."
      },
      {
        id: "heizstab-minimieren",
        title: "So minimieren Sie den Heizstab-Einsatz",
        level: "h2",
        content: "Prüfen Sie in den Einstellungen Ihrer Wärmepumpe die Bivalenztemperatur. Für moderne Luft-Wärmepumpen reicht oft -15 °C. Senken Sie die Warmwasser-Solltemperatur auf 48–50 °C (mit thermischer Desinfektion 1x/Woche auf 60 °C). Optimieren Sie die Heizkurve, damit die Vorlauftemperatur nicht unnötig hoch liegt.\n\nUnd vor allem: Kontrollieren Sie die Betriebsstunden des Heizstabs regelmäßig. Mehr als 200 Stunden pro Jahr bei einer Luft-Wärmepumpe sind ein Warnsignal."
      }
    ],
    faq: [
      {
        question: "Wie viele Heizstab-Stunden pro Jahr sind normal?",
        answer: "Bei einer gut eingestellten Luft-Wärmepumpe sollte der Heizstab weniger als 200 Betriebsstunden pro Jahr haben. Bei Sole-Wärmepumpen sollte er im Normalbetrieb gar nicht laufen."
      },
      {
        question: "Kann ich den Heizstab komplett abschalten?",
        answer: "Das wird nicht empfohlen, da er als Sicherheits-Backup dient. Sie können aber die Einsatzschwelle deutlich anheben und so seinen Einsatz auf echte Extremsituationen beschränken."
      }
    ]
  },
  {
    slug: "waermepumpe-richtig-einstellen-fachbetrieb",
    title: "Wärmepumpe richtig einstellen: Worauf Fachbetriebe achten sollten",
    metaTitle: "Wärmepumpe einstellen – Leitfaden für Heizungsbauer & Energieberater",
    metaDescription: "Praxisleitfaden für Fachbetriebe: Heizkurve, Bivalenzpunkt, Warmwasser und häufige Einstellungsfehler bei Wärmepumpen vermeiden.",
    category: "Fachplanung",
    author: "Redaktion WP-Check",
    publishedAt: "2026-02-01",
    readingTime: "10 Min.",
    excerpt: "Viele Effizienzprobleme entstehen durch falsche Einstellungen bei der Inbetriebnahme. Ein Praxisleitfaden für Heizungsbauer und Energieberater.",
    sections: [
      {
        id: "heizkurve-einstellen",
        title: "Heizkurve: Steilheit und Parallelverschiebung richtig wählen",
        level: "h2",
        content: "Die Heizkurve bestimmt, welche Vorlauftemperatur bei welcher Außentemperatur angefahren wird. Eine zu steile Kurve führt zu unnötig hohen Temperaturen bei mildem Wetter. Eine zu flache Kurve reicht an kalten Tagen nicht aus.\n\nAls Ausgangspunkt empfiehlt sich: Steilheit 0,3–0,5 für gut gedämmte Gebäude mit Fußbodenheizung, 0,6–0,8 für Altbauten mit Heizkörpern. Die Parallelverschiebung gleicht individuelle Gebäudeeigenschaften aus. Grundregel: So niedrig wie möglich starten und nach Rückmeldung der Nutzer nachregeln."
      },
      {
        id: "bivalenzpunkt",
        title: "Bivalenzpunkt und Heizstab-Freigabe",
        level: "h2",
        content: "Der Bivalenzpunkt definiert, ab welcher Außentemperatur der Heizstab zugeschaltet wird. Viele Installateure setzen ihn aus Sicherheitsgründen zu hoch an (z. B. -5 °C). Moderne Luft-Wärmepumpen arbeiten jedoch bis -20 °C oder tiefer.\n\nEmpfehlung: Bivalenzpunkt auf -12 bis -15 °C setzen. Die Heizstab-Freigabe auf 'nur EVU-Sperre' oder manuell beschränken. Dokumentieren Sie die Einstellung für den Kunden."
      },
      {
        id: "warmwasser-einstellung",
        title: "Warmwasser effizient konfigurieren",
        level: "h2",
        content: "Warmwasserbereitung ist oft der größte Effizienz-Killer. Standardmäßig wird auf 55 °C oder höher erwärmt – das erfordert hohe Verdichterleistung und senkt die JAZ.\n\nOptimale Einstellung: Warmwasser-Solltemperatur 48 °C mit einmaliger Legionellen-Schaltung pro Woche auf 60 °C. Warmwasserbereitung auf Tagstunden beschränken (10–16 Uhr), wenn PV vorhanden idealerweise mit PV-Priorisierung."
      },
      {
        id: "haeufige-fehler",
        title: "Die häufigsten Einstellungsfehler",
        level: "h2",
        content: "Aus der Praxis kennen wir folgende wiederkehrende Fehler: Pufferspeicher zu groß dimensioniert (erhöht Bereitschaftsverluste), Verdichterdrehzahl nicht an Teillast angepasst, Abtauintervalle manuell verkürzt (erhöht Energieverbrauch), fehlende Nachtabsenkung bzw. falscher Absenkbetrieb.\n\nEin systematischer Abnahme-Check nach der Inbetriebnahme – idealerweise nach 4–6 Wochen Betrieb – kann diese Fehler frühzeitig aufdecken."
      },
      {
        id: "wp-check-fachbetrieb",
        title: "WP-Check als Werkzeug für den Fachbetrieb",
        level: "h2",
        content: "WP-Check eignet sich auch für Fachbetriebe als schnelles Screening-Tool: Stimmt der gemessene Verbrauch mit dem simulierten überein? Wo liegen Abweichungen? Das hilft bei der Fehlersuche und gibt dem Kunden eine nachvollziehbare Referenz."
      }
    ],
    faq: [
      {
        question: "Welche Vorlauftemperatur sollte eine Wärmepumpe im Altbau haben?",
        answer: "Idealerweise unter 50 °C. Durch hydraulischen Abgleich und ggf. Heizkörpertausch in kritischen Räumen ist das in vielen Altbauten erreichbar. Jedes Grad weniger steigert die JAZ um ca. 2,5 %."
      },
      {
        question: "Wie oft sollte die Einstellung einer Wärmepumpe kontrolliert werden?",
        answer: "Mindestens einmal nach der ersten Heizperiode und danach jährlich im Rahmen der Wartung. Die Heizkurve sollte bei Änderungen am Gebäude (z. B. neue Fenster) angepasst werden."
      }
    ]
  },
  {
    slug: "foerderung-waermepumpe-2026",
    title: "Förderung für Wärmepumpen 2026: Alle Programme und Boni im Überblick",
    metaTitle: "Wärmepumpe Förderung 2026 – KfW, Boni & Antragstellung erklärt",
    metaDescription: "Bis zu 70 % Förderung für Ihre Wärmepumpe: Alle aktuellen KfW-Programme, Boni und Tipps zur Antragstellung 2026.",
    category: "Förderung",
    author: "Redaktion WP-Check",
    publishedAt: "2026-01-15",
    readingTime: "7 Min.",
    excerpt: "Bis zu 70 % Förderung – aber nur mit dem richtigen Antrag. Wir erklären die aktuellen Programme und wie Sie den maximalen Zuschuss für Ihre Wärmepumpe erhalten.",
    sections: [
      {
        id: "kfw-grundfoerderung",
        title: "KfW-Grundförderung: 30 % für alle",
        level: "h2",
        content: "Die Grundförderung beträgt 30 % der förderfähigen Kosten und steht jedem Eigentümer zu, der seine alte Heizung durch eine Wärmepumpe ersetzt. Förderfähig sind Investitionskosten bis 30.000 € für die erste Wohneinheit.\n\nDie Grundförderung deckt Anschaffung, Installation, hydraulischen Abgleich und notwendige Anpassungen an der Wärmeverteilung ab."
      },
      {
        id: "einkommensbonus",
        title: "Einkommensbonus: Zusätzliche 30 %",
        level: "h2",
        content: "Haushalte mit einem zu versteuernden Einkommen unter 40.000 € pro Jahr erhalten einen Einkommensbonus von 30 %. Dieser wird zusätzlich zur Grundförderung gewährt. Nachzuweisen ist das Einkommen über den Steuerbescheid des vorletzten Jahres."
      },
      {
        id: "geschwindigkeitsbonus",
        title: "Geschwindigkeitsbonus: 20 % für schnelle Entscheider",
        level: "h2",
        content: "Der Geschwindigkeitsbonus von 20 % gilt für den Austausch funktionstüchtiger Gas- oder Ölheizungen, die mindestens 20 Jahre alt sind. Er belohnt den proaktiven Wechsel vor dem Ausfall der Altanlage.\n\nWichtig: Der Bonus wird schrittweise reduziert. Wer 2026 noch handelt, profitiert vom vollen Satz."
      },
      {
        id: "kombination-maximum",
        title: "Maximale Förderung erreichen",
        level: "h2",
        content: "Grundförderung (30 %) + Einkommensbonus (30 %) + Geschwindigkeitsbonus (20 %) = 80 %, gedeckelt auf 70 % der förderfähigen Kosten. Bei 30.000 € Investition sind das maximal 21.000 € Zuschuss.\n\nTipp: Ergänzende Maßnahmen wie Dämmung können über das BEG-Programm separat gefördert werden – mit bis zu 20 % Zuschuss."
      }
    ],
    faq: [
      {
        question: "Kann ich die Förderung auch für eine bestehende Wärmepumpe bekommen?",
        answer: "Nein, die KfW-Förderung gilt nur für den Austausch einer bestehenden Heizung durch eine neue Wärmepumpe. Für die Optimierung bestehender Anlagen gibt es separate BEG-Fördertöpfe."
      },
      {
        question: "Muss der Antrag vor der Installation gestellt werden?",
        answer: "Ja, der Antrag muss vor Beginn der Maßnahme bei der KfW eingereicht werden. Ein Vertrag mit aufschiebender Bedingung ist zulässig."
      }
    ]
  },
  {
    slug: "energieberater-waermepumpe-bewertung",
    title: "Für Energieberater: Wärmepumpen-Effizienz systematisch bewerten",
    metaTitle: "Energieberater Wärmepumpe – Systematische Effizienzbewertung & Beratung",
    metaDescription: "Leitfaden für Energieberater: So bewerten Sie die Effizienz bestehender Wärmepumpen und beraten Ihre Kunden fundiert.",
    category: "Fachplanung",
    author: "Redaktion WP-Check",
    publishedAt: "2026-02-25",
    readingTime: "8 Min.",
    excerpt: "Ein praxisnaher Leitfaden für Energieberater: Wie Sie bestehende Wärmepumpen-Anlagen systematisch bewerten und Optimierungspotenziale identifizieren.",
    sections: [
      {
        id: "bestandsaufnahme",
        title: "Systematische Bestandsaufnahme",
        level: "h2",
        content: "Eine fundierte Bewertung beginnt mit der Erfassung der Rahmendaten: Gebäudetyp, Baujahr, beheizte Fläche, Dämmstandard, Art der Wärmeverteilung (Heizkörper/Fußbodenheizung), Vorlauf- und Rücklauftemperaturen sowie die Klimazone (PLZ-basiert).\n\nDazu kommen die Anlagendaten: Wärmepumpentyp, Nennleistung, Baujahr der Anlage, Betriebsstunden Verdichter und Heizstab, Stromverbrauch und – falls vorhanden – Wärmemengenzähler-Daten."
      },
      {
        id: "soll-ist-vergleich",
        title: "Soll-Ist-Vergleich: Erwartete vs. gemessene Effizienz",
        level: "h2",
        content: "Der Kern der Bewertung ist der Vergleich zwischen erwartetem und tatsächlichem Stromverbrauch. Der erwartete Verbrauch ergibt sich aus dem spezifischen Wärmebedarf, der beheizten Fläche und der zu erwartenden JAZ für die gegebene Vorlauftemperatur und Klimazone.\n\nEine Abweichung von mehr als 15 % nach oben deutet auf Optimierungsbedarf hin. Abweichungen über 30 % erfordern eine detaillierte Fehleranalyse."
      },
      {
        id: "optimierungsempfehlungen",
        title: "Optimierungsempfehlungen priorisieren",
        level: "h2",
        content: "Nicht jede Maßnahme ist gleich wirtschaftlich. Priorisieren Sie nach Kosten-Nutzen: 1) Regelungsoptimierung (Heizkurve, Bivalenzpunkt) – kostenlos bis gering, 2) Hydraulischer Abgleich – 500–1.500 €, 3) Einzelne Heizkörper tauschen – 300–800 € pro Stück, 4) Teilsanierung (Kellerdecke, oberste Geschossdecke) – 2.000–8.000 €.\n\nWP-Check kann als Screening-Tool dienen, um den Soll-Ist-Vergleich schnell für viele Kunden durchzuführen."
      },
      {
        id: "dokumentation",
        title: "Dokumentation für den Kunden",
        level: "h2",
        content: "Eine professionelle Bewertung sollte dem Kunden eine klare Zusammenfassung liefern: aktuelle JAZ, Soll-JAZ, Abweichung, empfohlene Maßnahmen mit geschätzten Kosten und erwarteter Einsparung. Der PDF-Export von WP-Check kann als Basis für Ihren Beratungsbericht dienen."
      }
    ],
    faq: [
      {
        question: "Kann ich WP-Check in meiner Energieberatung einsetzen?",
        answer: "Ja, WP-Check eignet sich als schnelles Screening-Tool für die Erstbewertung. Die Ergebnisse ersetzen keine detaillierte Berechnung nach DIN/TS, bieten aber eine gute Orientierung für das Kundengespräch."
      },
      {
        question: "Wie genau ist die Simulation von WP-Check?",
        answer: "Die Simulation basiert auf normierten Wärmebedarfswerten, HGT-gewichteten Klimadaten und anerkannten JAZ-Berechnungsverfahren. Die Genauigkeit liegt bei ±10–15 % im Vergleich zur gemessenen Realität."
      }
    ]
  }
];
