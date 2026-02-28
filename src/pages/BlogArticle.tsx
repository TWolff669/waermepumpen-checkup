import { useParams, Link } from "react-router-dom";
import { blogArticles } from "@/data/blogArticles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, Clock, User } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = blogArticles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-16 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Artikel nicht gefunden</h1>
          <Button variant="outline" asChild>
            <Link to="/blog"><ArrowLeft size={16} className="mr-2" /> Zurück zum Blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    author: { "@type": "Person", name: article.author },
    datePublished: article.publishedAt,
    description: article.metaDescription,
  };

  const faqSchema = article.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <article className="container mx-auto py-16 px-4">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary">Startseite</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <span>/</span>
            <span className="text-foreground">{article.category}</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <span className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-full text-sm">
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4 leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User size={14} /> {article.author}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(article.publishedAt).toLocaleDateString("de-DE")}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {article.readingTime} Lesezeit</span>
            </div>
          </div>

          {/* Table of Contents */}
          <nav className="bg-card rounded-xl border border-border p-6 mb-10">
            <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Inhaltsverzeichnis</h2>
            <ul className="space-y-2">
              {article.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`text-sm text-muted-foreground hover:text-primary transition-colors ${
                      section.level === "h3" ? "ml-4" : ""
                    }`}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
              {article.faq.length > 0 && (
                <li>
                  <a href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Häufig gestellte Fragen
                  </a>
                </li>
              )}
            </ul>
          </nav>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {article.sections.map((section) => (
              <div key={section.id} id={section.id} className="mb-10">
                {section.level === "h2" ? (
                  <h2 className="text-2xl font-bold text-foreground mb-4">{section.title}</h2>
                ) : (
                  <h3 className="text-xl font-bold text-foreground mb-3">{section.title}</h3>
                )}
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          {article.faq.length > 0 && (
            <div id="faq" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Häufig gestellte Fragen</h2>
              <Accordion type="single" collapsible className="space-y-3">
                {article.faq.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="bg-card rounded-xl border border-border px-6"
                  >
                    <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* CTA */}
          <div className="bg-primary rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-2xl font-bold text-primary-foreground mb-3">
              Jetzt Wärmepumpen-Effizienz prüfen
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              Finden Sie heraus, ob Ihre Wärmepumpe optimal arbeitet – kostenlos und in wenigen Minuten.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/efficiency-check" className="gap-2">
                Effizienz-Check starten <ArrowRight size={18} />
              </Link>
            </Button>
          </div>

          {/* Back */}
          <div className="mt-10">
            <Button variant="outline" asChild>
              <Link to="/blog"><ArrowLeft size={16} className="mr-2" /> Alle Artikel</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogArticle;
