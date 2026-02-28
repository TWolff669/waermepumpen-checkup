import { Link } from "react-router-dom";
import { blogArticles, blogCategories } from "@/data/blogArticles";
import { useState } from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Header from "@/components/Header";

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? blogArticles.filter((a) => a.category === activeCategory)
    : blogArticles;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fachwissen rund um Wärmepumpen-Effizienz, Optimierung und Sanierung – für Bauherren, Energieberater und Fachbetriebe.
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Alle
            </button>
            {blogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((article) => (
              <Link
                key={article.slug}
                to={`/blog/${article.slug}`}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="bg-primary/10 text-primary font-medium px-2.5 py-0.5 rounded-full">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(article.publishedAt).toLocaleDateString("de-DE")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {article.readingTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
                    {article.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {article.excerpt}
                  </p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Weiterlesen <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
