const Datenschutz = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl py-16 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Datenschutzerklärung</h1>
        <p className="text-muted-foreground mb-8">
          für WP-Check (Web-App zur Wärmepumpen-Effizienzprüfung)
        </p>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Verantwortlicher</h2>
            <p>
              TGA Planung Wolff<br />
              Inhaber: Thomas Wolff<br />
              Sommerhofenstraße 120<br />
              71067 Sindelfingen<br />
              Deutschland
            </p>
            <p>
              E-Mail: one@tgaassist.app<br />
              Telefon: 0176 / 80657994
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Allgemeine Hinweise zur Datenverarbeitung</h2>
            <p>
              Wir verarbeiten personenbezogene Daten ausschließlich im Einklang mit der Datenschutz-Grundverordnung (DSGVO) sowie den einschlägigen nationalen Datenschutzbestimmungen.
            </p>
            <p>
              Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare Person beziehen.
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Hosting</h2>
            <p>
              Die Web-App wird über Lovable (DSGVO-konforme Infrastruktur) bereitgestellt.
            </p>
            <p>
              Beim Aufruf der Website werden automatisch Server-Logdaten verarbeitet (IP-Adresse, Datum, Uhrzeit, Browsertyp). Diese Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabiler und sicherer Bereitstellung).
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Nutzung der Web-App (WP-Check)</h2>
            <p>Bei Nutzung der Effizienzprüfung werden folgende Daten verarbeitet:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gebäudedaten (z. B. Baujahr, Wohnfläche, Gebäudetyp)</li>
              <li>Energieverbrauchsdaten (sofern eingegeben)</li>
              <li>Technische Anlagenparameter der Wärmepumpe</li>
              <li>Standortdaten (PLZ zur Klimadatenermittlung)</li>
            </ul>
            <p>Diese Daten werden ausschließlich lokal im Browser verarbeitet und nicht an einen Server übertragen. Es erfolgt keine Speicherung personenbezogener Daten.</p>
            <p>
              <strong className="text-foreground">Rechtsgrundlage:</strong><br />
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bereitstellung des Tools)
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
            <p>
              Die Web-App verwendet ausschließlich technisch notwendige Cookies, sofern keine Analyse- oder Trackingdienste aktiv sind.
            </p>
            <p>
              Sollten Tracking- oder Analyse-Tools eingebunden werden, erfolgt eine gesonderte Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Speicherdauer</h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie dies für die Erfüllung des jeweiligen Zwecks erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
            </p>
          </section>

          <hr className="border-border" />

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Rechte der betroffenen Personen</h2>
            <p>Sie haben das Recht auf:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Auskunft gemäß Art. 15 DSGVO</li>
              <li>Berichtigung gemäß Art. 16 DSGVO</li>
              <li>Löschung gemäß Art. 17 DSGVO</li>
              <li>Einschränkung gemäß Art. 18 DSGVO</li>
              <li>Datenübertragbarkeit gemäß Art. 20 DSGVO</li>
              <li>Widerspruch gemäß Art. 21 DSGVO</li>
            </ul>
            <p>Sie haben außerdem das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Datenschutz;