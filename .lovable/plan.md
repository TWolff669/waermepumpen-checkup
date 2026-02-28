

## Plan: Parameter-Anpassung nur für Premium-Nutzer

Ja, das ist umsetzbar. Die Architektur bleibt wie geplant, wird aber um eine Zugriffskontrolle per Nutzer-Rolle/Plan erweitert.

### Umsetzung

**1. Nutzer-Plan/Rolle in der Datenbank**
- Tabelle `user_roles` mit Rolle (z.B. `free`, `premium`) oder alternativ ein `subscriptions`-Tabelle, falls später Stripe-Zahlungen angebunden werden.
- Security-Definer-Funktion `has_role(user_id, role)` für RLS-Policies.

**2. RLS auf `user_parameters` einschränken**
- SELECT: alle authentifizierten Nutzer (eigene Zeile).
- INSERT/UPDATE: nur Nutzer mit Rolle `premium` dürfen eigene Parameter speichern.
- Free-Nutzer arbeiten ausschließlich mit den System-Defaults.

**3. Frontend-Zugriffskontrolle**
- `/settings`-Seite prüft die Rolle des Nutzers.
- Free-Nutzer sehen die Parameter **read-only** mit einem Upgrade-Hinweis ("Diese Funktion ist in der Premium-Version verfügbar").
- Premium-Nutzer können bearbeiten und speichern.

**4. Spätere Stripe-Integration (optional)**
- Stripe-Checkout für Premium-Upgrade, nach Zahlung wird die Rolle auf `premium` gesetzt.
- Webhook aktualisiert `user_roles` automatisch bei Abo-Änderungen.

### Zusammenfassung

```text
Free-Nutzer:     Login → Effizienz-Check mit Standard-Werten → Ergebnis
Premium-Nutzer:  Login → /settings (Parameter anpassen) → Effizienz-Check mit eigenen Werten → Ergebnis
```

Die Grundstruktur (Auth, Datenbank, Simulation-Refactoring) bleibt identisch — es kommt lediglich eine Rollen-Prüfung hinzu. Stripe kann jederzeit später ergänzt werden.

