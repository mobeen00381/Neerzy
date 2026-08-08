import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface GuideFrontmatter {
  title: string;
  meta_description: string;
  category: string;
  date: string;
  readTime: string;
  featured: boolean;
  guideType: 'pillar' | 'category';
  breadcrumbName: string;
  schemaArticle?: string;
  schemaFaq?: Array<{ q: string; a: string }>;
  sources?: Array<{ id: number; text: string }>;
}

export interface GuideData {
  slug: string;
  frontmatter: GuideFrontmatter;
  content: string;
}

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');

export function getAllGuides(): GuideData[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx'));
  
  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const source = fs.readFileSync(path.join(GUIDES_DIR, file), 'utf-8');
      const { data, content } = matter(source);
      
      return {
        slug,
        frontmatter: data as GuideFrontmatter,
        content,
      };
    })
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
}

export function getGuideBySlug(slug: string): GuideData | null {
  const filePath = path.join(GUIDES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  
  const source = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(source);
  
  return {
    slug,
    frontmatter: data as GuideFrontmatter,
    content,
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
}