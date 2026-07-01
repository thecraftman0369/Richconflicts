import type { Metadata } from 'next'
import BlogPostClient from '@/components/blog/BlogPostClient'

/* ─── Types ─── */
export type BlogPost = {
  title: string
  category: string
  date: string
  readTime: string
  author: string
  excerpt: string
  keywords: string[]
  tags: string[]
  body: string[]
}

/* ─── Data ─── */
const POSTS: Record<string, BlogPost> = {
  'death-of-clean-aesthetic': {
    title: 'The Death of the Clean Aesthetic',
    category: 'CULTURE',
    date: 'June 12, 2026',
    readTime: '6 MIN READ',
    author: 'RICH CONFLICTS EDITORIAL',
    excerpt:
      'Why raw, imperfect design is the only honest language left in streetwear.',
    keywords: [
      'streetwear aesthetic',
      'underground fashion 2026',
      'anti-polish design',
      'graphic subculture apparel',
      'Y2K streetwear revival',
      'raw streetwear aesthetic',
      'independent clothing brands',
      'subculture fashion',
    ],
    tags: ['CULTURE', 'DESIGN', 'OPINION'],
    body: [
      'There is something dishonest about clean.',
      'In an era where every brand runs through the same Figma template, the same neutral beige palette, the same sans-serif confidence — the underground has always found its language in the opposite direction. Noise. Grain. Misregistered screen prints and xeroxed zine aesthetics.',
      'Streetwear, at its roots, was never supposed to look professional. It looked like someone was angry. It looked like a flyer stapled to a telephone pole at 2am. It looked like a Kinko\'s fever dream pressed onto a Hanes Beefy-T.',
      'The shift to "clean" streetwear happened sometime around 2015. You know the move: minimal branding, neutral colorways, high GSM basics. It made sense commercially. It still makes sense commercially. But something got lost.',
      'What got lost was the feeling that the clothes were made by someone who gave a damn beyond the margin.',
      'Rich Conflicts exists in the overlap. We\'re not anti-craft — every piece we release is built on serious construction and fabric selection. But the graphic language refuses to be polished. Because polished is a lie dressed in a premium tag.',
      'The raw aesthetic isn\'t about being rough for the sake of rough. It\'s about being honest about where the clothes come from, what they\'re reacting to, and why they exist at all.',
      'Clean is easy. Conflict is the work.',
    ],
  },
  'how-we-build-a-drop': {
    title: 'How We Build a Drop',
    category: 'PROCESS',
    date: 'May 28, 2026',
    readTime: '4 MIN READ',
    author: 'RICH CONFLICTS EDITORIAL',
    excerpt:
      'From concept sketch to cut and sew — a look inside the RC production cycle.',
    keywords: [
      'streetwear production process',
      'limited drop clothing brand',
      'cut and sew apparel',
      'independent streetwear manufacturing',
      'made in Portugal clothing',
      'small batch production fashion',
      'screen printing specialist UK',
      'garment construction process',
    ],
    tags: ['PROCESS', 'PRODUCTION', 'BEHIND THE SCENES'],
    body: [
      'Every RC drop starts with a problem.',
      'Not a market gap, not a trend report — a problem. Something we can\'t find that should exist. A graphic that hasn\'t been made yet. A silhouette that\'s been overlooked.',
      'From there, the process is slower than you\'d think.',
      'Stage one is sketches. Not digital — actual pen on paper. We\'ve tried the tablet route. It doesn\'t work for us. Something about the friction of paper makes the decisions harder to fake.',
      'Stage two is fabric selection. We work with a small mill in Porto that we\'ve had a relationship with for three years. They know what we want before we know how to say it. 300+ GSM minimum for tees. 400+ for the heavier cuts.',
      'Stage three is sample production. Three rounds minimum. We\'ve rejected samples on round seven before. It\'s not efficient, but efficiency isn\'t the point.',
      'Stage four is the print work. We use a specialist facility in North London who\'ve been doing discharge and specialty screen work since the 90s. They understand the misregistration we want is intentional.',
      'Stage five: photography. Stage six: drop announcement. Stage seven: the 48-hour window where every unit either sells or doesn\'t. No restocks. No exceptions.',
      'The whole cycle from concept to drop takes between three and seven months depending on complexity. We could do it faster. We won\'t.',
    ],
  },
  'the-100-percent-cotton-argument': {
    title: 'The 100% Cotton Argument',
    category: 'MATERIAL',
    date: 'May 10, 2026',
    readTime: '5 MIN READ',
    author: 'RICH CONFLICTS EDITORIAL',
    excerpt:
      'Why we refuse to cut corners on fabric, and what that actually means for your wardrobe long-term.',
    keywords: [
      '100% cotton streetwear',
      'heavyweight cotton tees',
      'fabric quality clothing',
      'cotton vs polyester blend',
      'premium GSM garments',
      'sustainable streetwear materials',
      'long-lasting clothing investment',
      'streetwear fabric guide',
    ],
    tags: ['MATERIAL', 'QUALITY', 'GUIDE'],
    body: [
      'The blend conversation ends here.',
      'We have been asked, more than once, why we don\'t use poly-cotton blends in our core pieces. The answer is straightforward: blends compromise the feel, compromise the print quality, and compromise the longevity.',
      'A 330gsm 100% cotton tee feels different from the first wash. It hangs differently. The screen print sits differently on the surface. The garment ages differently — meaning it gets better, not worse.',
      'Polyester holds shape better out of the box. That\'s the whole argument for it. But "shape out of the box" is a retail metric, not a wear metric. The real test is 50 washes. The real test is whether the graphic still looks intentional or whether it\'s cracked and pilled into irrelevance.',
      'The mills we work with in Portugal have been producing 100% cotton blanks for the better part of three decades. They\'re not cutting corners because we won\'t let them, and because they don\'t want to.',
      'The extra cost per unit is real. It comes out of our margin, not yours. We think that\'s the right way to do it.',
    ],
  },
}

const FALLBACK: BlogPost = {
  title: 'Article Not Found',
  category: '',
  date: '',
  readTime: '',
  author: 'RICH CONFLICTS EDITORIAL',
  excerpt: 'This article could not be found.',
  keywords: ['Rich Conflicts', 'streetwear', 'underground fashion'],
  tags: [],
  body: ['This article could not be found. Return to the blog to explore other dispatches.'],
}

/* ─── SEO Metadata — server-side ─── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = POSTS[slug] ?? FALLBACK

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: `${post.title} | Rich Conflicts`,
      description: post.excerpt,
      type: 'article',
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

/* ─── Page (server component — passes data to client) ─── */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = POSTS[slug] ?? FALLBACK
  return <BlogPostClient post={post} />
}
