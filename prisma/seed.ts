/**
 * Database seed script.
 *
 * Creates:
 *  - The single admin `User` (from ADMIN_* env vars) with a bcrypt-hashed password.
 *  - The singleton `Profile` row.
 *  - Sample skills, experiences, and projects mirroring the frontend's
 *    `src/data/projects.ts` so the API is immediately usable.
 *
 * Run with: `npm run db:seed` (or `npx prisma db seed`).
 */
import bcrypt from 'bcrypt';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SkillCategory, SkillLevel } from '@prisma/client';

import { env } from '../src/config/env';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // -------------------------------------------------------------------------
  // 1. Admin user (upsert so re-running the seed is idempotent)
  // -------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { name: env.ADMIN_NAME, passwordHash },
    create: {
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      passwordHash,
    },
  });

  console.log(`  ✓ Admin user: ${admin.email}`);

  // -------------------------------------------------------------------------
  // 2. Singleton profile
  // -------------------------------------------------------------------------
  await prisma.profile.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'Mahmudul Karim',
      title: 'Web Developer',
      bio: 'Web developer from Bangladesh specializing in building responsive, user-friendly web applications with modern technologies like React, Next.js, and the MERN stack.',
      email: 'mahmudulkarim545@gmail.com',
      phone: '+880 1805111544',
      location: 'Dhaka, Bangladesh',
      github: 'https://github.com/mahmudulkarim420',
      linkedin: 'https://www.linkedin.com/in/mahmudul-karim-dev/',
      twitter: 'https://www.facebook.com/prem.hassan.784077',
      website: '',
      avatar: 'https://res.cloudinary.com/dvpa14whv/image/upload/v1748201849/18495_txxm64.png',
      resumeUrl: 'https://drive.google.com/file/d/your-resume-id/view',
    },
  });

  console.log('  ✓ Singleton profile');

  // -------------------------------------------------------------------------
  // 3. Skills (grouped by category, ordered)
  // -------------------------------------------------------------------------
  const skillsData = [
    // Frontend Development
    { name: 'HTML5', category: SkillCategory.FRONTEND_DEVELOPMENT, proficiency: 90, icon: 'FaHtml5', order: 1 },
    { name: 'CSS3', category: SkillCategory.FRONTEND_DEVELOPMENT, proficiency: 85, icon: 'FaCss3Alt', order: 2 },
    { name: 'Tailwind CSS', category: SkillCategory.FRONTEND_DEVELOPMENT, proficiency: 80, icon: 'SiTailwindcss', order: 3 },
    { name: 'JavaScript', category: SkillCategory.FRONTEND_DEVELOPMENT, proficiency: 75, icon: 'SiJavascript', order: 4 },
    { name: 'ReactJS', category: SkillCategory.FRONTEND_DEVELOPMENT, proficiency: 70, icon: 'FaReact', order: 5 },
    { name: 'NextJS', category: SkillCategory.FRONTEND_DEVELOPMENT, proficiency: 65, icon: 'SiNextdotjs', order: 6 },
    // Backend Development
    { name: 'NodeJS', category: SkillCategory.BACKEND_DEVELOPMENT, proficiency: 60, icon: 'FaNodeJs', order: 1 },
    { name: 'ExpressJS', category: SkillCategory.BACKEND_DEVELOPMENT, proficiency: 55, icon: 'SiExpress', order: 2 },
    { name: 'MongoDB', category: SkillCategory.BACKEND_DEVELOPMENT, proficiency: 50, icon: 'SiMongodb', order: 3 },
    { name: 'PostgreSQL', category: SkillCategory.BACKEND_DEVELOPMENT, proficiency: 45, icon: 'SiPostgresql', order: 4 },
  ];

  for (const skill of skillsData) {
    const level = deriveLevel(skill.proficiency);
    const existing = await prisma.skill.findFirst({
      where: { name: skill.name, category: skill.category },
    });
    if (existing) {
      continue;
    }
    await prisma.skill.create({ data: { ...skill, level } });
  }

  console.log(`  ✓ ${skillsData.length} skills`);

  // -------------------------------------------------------------------------
  // 4. Experiences (timeline, ordered)
  // -------------------------------------------------------------------------
  const experiencesData = [
    {
      role: 'Frontend Developer Intern',
      company: 'SoftStack Agency',
      startDate: 'Dec 2025',
      endDate: 'Mar 2026',
      description: 'Worked on building responsive user interfaces using React and Next.js. Collaborated with the design team to implement pixel-perfect UI components and improved website performance through code splitting and lazy loading.',
      order: 1,
    },
  ];

  for (const exp of experiencesData) {
    const period = `${exp.startDate} - ${exp.endDate}`;
    const existing = await prisma.experience.findFirst({
      where: { role: exp.role, company: exp.company },
    });
    if (existing) {
      continue;
    }
    await prisma.experience.create({ data: { ...exp, period } });
  }

  console.log(`  ✓ ${experiencesData.length} experiences`);

  // -------------------------------------------------------------------------
  // 5. Projects (with nested technologies, links, challenges, future plans)
  // -------------------------------------------------------------------------
  const projectsData = [
    {
      slug: 'skillforce',
      title: 'SkillForce',
      subtitle: 'Learning Website',
      image: 'https://res.cloudinary.com/dvpa14whv/image/upload/v1748201849/Screenshot_2025-05-25_184239_jyqj8p.png',
      briefDescription: 'SkillForce is a full-stack learning platform built with the MERN stack where users can browse, enroll, and learn from curated courses with progress tracking.',
      content: '',
      published: true,
      order: 1,
      technologies: [
        { name: 'NextJS', fullWidth: false },
        { name: 'Node, Express, MongoDB', fullWidth: true },
      ],
      links: {
        live: '#',
        clientRepo: 'https://github.com/mahmudulkarim420/skillforce-client',
        serverRepo: 'https://github.com/mahmudulkarim420/skillforce-server',
      },
      challengesFaced: [
        'Implementing secure Firebase authentication with role-based access control for students and instructors.',
        'Optimizing video streaming performance for course content on slower connections.',
      ],
      futurePlans: [
        'Add adaptive-bitrate video streaming for better playback on varying network conditions.',
        'Introduce a real-time chat system between students and instructors.',
      ],
    },
  ];

  for (const project of projectsData) {
    const existing = await prisma.project.findUnique({ where: { slug: project.slug } });
    if (existing) {
      continue;
    }

    await prisma.project.create({
      data: {
        slug: project.slug,
        title: project.title,
        subtitle: project.subtitle,
        image: project.image,
        briefDescription: project.briefDescription,
        content: project.content,
        published: project.published,
        order: project.order,
        technologies: {
          create: project.technologies,
        },
        links: {
          create: project.links,
        },
        challenges: {
          create: project.challengesFaced.map((text, index) => ({ text, order: index })),
        },
        futurePlans: {
          create: project.futurePlans.map((text, index) => ({ text, order: index })),
        },
      },
    });
  }

  console.log(`  ✓ ${projectsData.length} projects`);
  console.log('🌱 Seeding complete!');
}

/**
 * Derive a SkillLevel from a proficiency score (README §7.3):
 * 0–33 → BEGINNER, 34–66 → INTERMEDIATE, 67–100 → ADVANCED.
 */
function deriveLevel(proficiency: number): SkillLevel {
  if (proficiency <= 33) return SkillLevel.BEGINNER;
  if (proficiency <= 66) return SkillLevel.INTERMEDIATE;
  return SkillLevel.ADVANCED;
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
