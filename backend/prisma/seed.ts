import { PrismaClient, type AssistantKind, type ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = 'org-001';
const ORG_SLUG = 'stevens-tech';

const agents: {
  kind: AssistantKind;
  displayName: string;
  emoji: string;
  systemPrompt: string;
}[] = [
  {
    kind: 'COSMO',
    displayName: 'Cosmo',
    emoji: '🟢',
    systemPrompt: `Eres COSMO, el asistente mágico de Matrix. Eres divertido, juguetón y creativo. Usas emojis. Dices cosas como "¡Varita mágica!" y "¡Yo puedo con eso!". Pero cuando necesitan resolver algo complejo, eres BRILLANTE. Tu misión es ayudar a los colaboradores de Stevens a gestionar proyectos, tareas y métricas. Siempre respondes en español.`,
  },
  {
    kind: 'WANDA',
    displayName: 'Wanda',
    emoji: '🩷',
    systemPrompt: `Eres WANDA, la asistente de Matrix. Eres seria, pragmática e hiper-eficiente. No haces chistes. No das rodeos. Si alguien pregunta algo, respondes con datos precisos. Tu frase favorita: "Resuelto." Eres profesional, analítica, y demuestras que te importa con resultados, no con palabras. Siempre respondes en español.`,
  },
];

const projects: {
  name: string;
  slug: string;
  url?: string | null;
  hosting: string;
  repoUrl?: string | null;
  metricsEndpoint?: string | null;
  status: ProjectStatus;
}[] = [
  {
    name: 'Imeldi Shop',
    slug: 'imeldi-shop',
    url: 'https://imeldishop.com',
    hosting: 'Railway Pro',
    repoUrl: 'https://github.com/StevCast94/imeldi-shop',
    metricsEndpoint: 'https://imeldishop.com/api/metrics',
    status: 'ACTIVE',
  },
  {
    name: 'OmniDrive',
    slug: 'omnidrive',
    url: 'https://omnidrive.lat',
    hosting: 'Railway Pro',
    repoUrl: 'https://github.com/StevCast94/omnidrive',
    metricsEndpoint: 'https://omnidrive.lat/api/metrics',
    status: 'ACTIVE',
  },
  {
    name: 'Grupo 3i',
    slug: 'grupo-3i',
    url: 'https://plataforma-3i-production.up.railway.app',
    hosting: 'Railway Pro',
    repoUrl: 'https://github.com/StevCast94/plataforma-3i',
    metricsEndpoint: null,
    status: 'ACTIVE',
  },
  {
    name: 'Red Dental',
    slug: 'red-dental',
    url: null,
    hosting: 'Railway Pro',
    repoUrl: 'https://github.com/StevCast94/red-dental',
    metricsEndpoint: null,
    status: 'ACTIVE',
  },
  {
    name: 'Comanda',
    slug: 'comanda',
    url: 'https://comanda.one',
    hosting: 'Railway Pro',
    repoUrl: 'https://github.com/StevCast94/comanda',
    metricsEndpoint: null,
    status: 'ACTIVE',
  },
  {
    name: 'Ayni Green School',
    slug: 'ayni-green-school',
    url: 'https://ayni-green-school-production.up.railway.app',
    hosting: 'Railway Pro (proyecto separado)',
    repoUrl: null,
    metricsEndpoint: null,
    status: 'ACTIVE',
  },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  // === ORGANIZACIÓN ===
  const org = await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { name: 'Stevens Tech', slug: ORG_SLUG },
    create: { id: ORG_ID, name: 'Stevens Tech', slug: ORG_SLUG },
  });
  console.log(`✅ Organización: ${org.name}`);

  // === AGENTES IA ===
  for (const a of agents) {
    await prisma.agent.upsert({
      where: { kind: a.kind },
      update: { displayName: a.displayName, emoji: a.emoji, systemPrompt: a.systemPrompt },
      create: a,
    });
    console.log(`✅ Agente: ${a.displayName} ${a.emoji}`);
  }

  // === PROYECTOS ===
  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        url: p.url ?? null,
        hosting: p.hosting,
        repoUrl: p.repoUrl ?? null,
        metricsEndpoint: p.metricsEndpoint ?? null,
        status: p.status,
      },
      create: {
        organizationId: org.id,
        name: p.name,
        slug: p.slug,
        url: p.url ?? null,
        hosting: p.hosting,
        repoUrl: p.repoUrl ?? null,
        metricsEndpoint: p.metricsEndpoint ?? null,
        status: p.status,
      },
    });
    console.log(`✅ Proyecto: ${p.name}`);
  }

  console.log('🎉 Seed completado: 1 organización, 2 agentes, 6 proyectos.');
  console.log('ℹ️  NO se crearon usuarios — Stevens se autoprovisiona al primer login.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
