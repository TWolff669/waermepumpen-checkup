import Header from "@/components/Header";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl py-16 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">Impressum</h1>
        <p className="text-muted-foreground mb-8">
          für die Web-App WP-Check (Wärmepumpen-Effizienzprüfung)
        </p>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground">Angaben gemäß § 5 TMG</h2>
            <p>
              TGA Planung Wolff<br />
              Inhaber: Thomas Wolff<br />
              Sommerhofenstraße 120<br />
              71067 Sindelfingen<br />
              Deutschland
            </p>
            <p>
              Telefon: 0176 / 80657994<br />
              E-Mail: one@tgaassist.app
            </p>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
              DE297316484
            </p>
            <p>
              Eintragung im Handelsregister:<br />
              Nicht vorhanden (Einzelunternehmen)
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">Berufsbezeichnung und berufsrechtliche Angaben</h2>
            <p>
              <strong className="text-foreground">Berufsbezeichnung:</strong><br />
              Techniker für Heizungs-, Lüftungs- und Klimatechnik
            </p>
            <p>
              <strong className="text-foreground">Verliehen in:</strong><br />
              Deutschland
            </p>
            <p>
              <strong className="text-foreground">Berufsrechtliche Grundlage:</strong><br />
              Honorarordnung für Architekten und Ingenieure (HOAI)
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">Redaktionell verantwortlich gemäß § 18 Abs. 2 MStV</h2>
            <p>
              Thomas Wolff<br />
              Sommerhofenstraße 120<br />
              71067 Sindelfingen
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">Hosting</h2>
            <p>
              Die Web-App wird über Lovable (DSGVO-konforme Infrastruktur) bereitgestellt.
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">🔒 Haftungshinweise zur Web-App (WP-Check)</h2>
            <p>
              Die auf WP-Check bereitgestellten Berechnungen stellen Prognosen und Simulationen dar, die auf eingegebenen Gebäudedaten, technischen Annahmen und Klimadaten beruhen.
            </p>
            <p>
              Die dargestellten Ergebnisse dienen ausschließlich der unverbindlichen Einschätzung der Wärmepumpen-Effizienz und stellen keine verbindliche technische Bewertung dar.
            </p>
            <p>
              Insbesondere können tatsächliche Betriebsbedingungen, Anlagenqualität und gebäudespezifische Gegebenheiten von den modellierten Annahmen abweichen.
            </p>
            <p>
              Eine individuelle Fachplanung und technische Detailprüfung sind für eine verbindliche Bewertung der Wärmepumpeneffizienz erforderlich.
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">Haftung für Inhalte</h2>
            <p>
              Die Inhalte dieser Web-App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">Haftung für externe Links</h2>
            <p>
              Diese Web-App kann Links zu externen Websites Dritter enthalten, auf deren Inhalte kein Einfluss besteht. Für diese fremden Inhalte wird keine Haftung übernommen.
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">Urheberrecht</h2>
            <p>
              Die durch den Betreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Eine Vervielfältigung oder Verwendung bedarf der schriftlichen Zustimmung.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Impressum;