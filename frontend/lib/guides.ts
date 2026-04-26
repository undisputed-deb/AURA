import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  author: string;
  date: string;
  readTime: string;
  ogImage?: string;
  content: string;
}

const guidesDirectory = path.join(process.cwd(), 'content/guides');

export async function getAllGuides(): Promise<Guide[]> {
  // Ensure directory exists
  if (!fs.existsSync(guidesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(guidesDirectory);
  const allGuides = await Promise.all(
    fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const guide = await getGuideBySlug(slug);
        return guide;
      })
  );

  // Sort by date (newest first)
  return allGuides.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function getGuideBySlug(slug: string): Promise<Guide> {
  const fullPath = path.join(guidesDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Parse frontmatter
  const { data, content } = matter(fileContents);

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(html, { sanitize: true })
    .process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title,
    description: data.description,
    category: data.category,
    keywords: data.keywords || [],
    author: data.author || 'Reherse Team',
    date: data.date,
    readTime: data.readTime || '5 min read',
    ogImage: data.ogImage,
    content: contentHtml,
  };
}

export async function getRelatedGuides(currentSlug: string, count: number = 3): Promise<Guide[]> {
  const allGuides = await getAllGuides();
  const currentGuide = allGuides.find(guide => guide.slug === currentSlug);

  if (!currentGuide) {
    return allGuides.slice(0, count);
  }

  // Find guides in the same category, excluding current guide
  const relatedGuides = allGuides
    .filter(guide =>
      guide.slug !== currentSlug &&
      guide.category === currentGuide.category
    )
    .slice(0, count);

  // If not enough related guides in same category, fill with other guides
  if (relatedGuides.length < count) {
    const otherGuides = allGuides
      .filter(guide =>
        guide.slug !== currentSlug &&
        !relatedGuides.includes(guide)
      )
      .slice(0, count - relatedGuides.length);
    relatedGuides.push(...otherGuides);
  }

  return relatedGuides;
}

export async function getGuidesByCategory(category: string): Promise<Guide[]> {
  const allGuides = await getAllGuides();
  return allGuides.filter(guide => guide.category === category);
}

export function getAllCategories(): string[] {
  return [
    'Behavioral Interview Prep',
    'Technical Interview Prep',
    'Resume & Application',
    'Interview Strategy',
    'Industry-Specific'
  ];
}
