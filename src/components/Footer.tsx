import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">WP-Check</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Wärmepumpen-Effizienz prüfen – kostenlos, unabhängig und fundiert.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Startseite</Link></li>
              <li><Link to="/efficiency-check" className="text-muted-foreground hover:text-foreground transition-colors">Effizienz-Check</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/impressum" className="text-muted-foreground hover:text-foreground transition-colors">Impressum</Link></li>
              <li><Link to="/datenschutz" className="text-muted-foreground hover:text-foreground transition-colors">Datenschutz</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TGA Planung Wolff. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
