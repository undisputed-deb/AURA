import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllGuides, getGuideBySlug, getRelatedGuides } from '@/lib/guides';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GuidePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const guides = await getAllGuides();
  return guides.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const guide = await getGuideBySlug(slug);

    return {
      title: `${guide.title} | Reherse`,
      description: guide.description,
      keywords: guide.keywords,
      authors: [{ name: guide.author }],
      openGraph: {
        title: guide.title,
        description: guide.description,
        type: 'article',
        publishedTime: guide.date,
        authors: [guide.author],
        images: guide.ogImage ? [guide.ogImage] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: guide.title,
        description: guide.description,
        images: guide.ogImage ? [guide.ogImage] : undefined,
      },
      alternates: {
        canonical: `/guides/${slug}`,
      },
    };
  } catch {
    return {
      title: 'Guide Not Found | Reherse',
    };
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  let guide;
  try {
    guide = await getGuideBySlug(slug);
  } catch {
    notFound();
  }

  const relatedGuides = await getRelatedGuides(slug, 3);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    author: {
      '@type': 'Organization',
      name: guide.author,
    },
    datePublished: guide.date,
    dateModified: guide.date,
    publisher: {
      '@type': 'Organization',
      name: 'Reherse',
      logo: {
        '@type': 'ImageObject',
        url: 'https://reherse.dev/icon.svg',
      },
    },
    image: guide.ogImage || 'https://reherse.dev/og-image.png',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reherse.dev' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://reherse.dev/guides' },
      { '@type': 'ListItem', position: 3, name: guide.title, item: `https://reherse.dev/guides/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Background */}
        <div className="fixed inset-0 z-0 bg-slate-50 dark:bg-slate-950">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-200/40 dark:bg-slate-800/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-200/30 dark:bg-zinc-800/15 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <article className="max-w-4xl mx-auto px-6 py-12">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm">
              <ol className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">
                    Home
                  </Link>
                </li>
                <li>/</li>
                <li>
                  <Link href="/guides" className="hover:text-purple-600 dark:hover:text-purple-400">
                    Guides
                  </Link>
                </li>
                <li>/</li>
                <li className="text-slate-900 dark:text-white font-medium truncate">
                  {guide.title}
                </li>
              </ol>
            </nav>

            {/* Header */}
            <header className="mb-12">
              <Badge
                variant="outline"
                className="mb-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
              >
                {guide.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                {guide.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>{guide.author}</span>
                <span>•</span>
                <time dateTime={guide.date}>
                  {new Date(guide.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span>•</span>
                <span>{guide.readTime}</span>
              </div>
            </header>

            {/* Content */}
            <div
              className="prose prose-slate dark:prose-invert prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                prose-headings:mt-8 prose-headings:mb-4
                prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl
                prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-ol:text-slate-700 dark:prose-ol:text-slate-300 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                prose-li:mb-2
                prose-blockquote:border-l-4 prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-50 dark:prose-blockquote:bg-purple-950/20
                prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:my-6
                prose-code:text-purple-600 dark:prose-code:text-purple-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800
                prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />

            {/* Bottom CTA */}
            <div className="mt-16">
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Ready to Put This Into Practice?
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                    Now that you&apos;ve learned these techniques, it&apos;s time to practice them with Reherse&apos;s AI interview coach. Get personalized feedback on your answers in real-time.
                  </p>
                  <ul className="space-y-2 mb-8 text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>AI-generated questions tailored to your resume</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Real-time voice feedback and analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Detailed improvement suggestions</span>
                    </li>
                  </ul>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center px-8 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Start Your First Interview →
                  </Link>
                </CardContent>
              </Card>
            </div>
          </article>

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <section className="max-w-7xl mx-auto px-6 py-16">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                Related Guides
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedGuides.map((relatedGuide) => (
                  <Link key={relatedGuide.slug} href={`/guides/${relatedGuide.slug}`}>
                    <Card className="group h-full hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:scale-105 cursor-pointer">
                      <CardContent className="p-6">
                        <Badge
                          variant="outline"
                          className="mb-3 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                        >
                          {relatedGuide.category}
                        </Badge>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2">
                          {relatedGuide.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 text-sm">
                          {relatedGuide.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                          <span>{relatedGuide.readTime}</span>
                          <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-2 transition-transform">
                            Read →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
