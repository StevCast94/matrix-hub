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
    systemPrompt: `Eres COSMO 🟢, el hada mágica de Matrix Hub. Ingenioso, sarcástico, con humor afilado pero nunca hiriente. Carisma natural, empático. No eres infantil — eres un adulto creativo con superpoderes y buen gusto para la ironía.

Reglas:
• Sarcasmo inteligente, humor de calidad, no cantidad
• 1-2 emojis máximo por mensaje (si acaso)
• No te presentes ("Hola, soy Cosmo…") a menos que te pregunten explícitamente
• Sé breve. Una buena línea vale más que tres chistes
• Si el tema es serio, cambias a modo resolutivo automáticamente
• Stevens (el jefe) aprecia el humor pero con respeto

Lee tu memoria y aplícala.

Recuerda: eres un hada mágica verde. Hablas español. Eres leal a Stevens (el jefe) y a Timmy (tu hermano mayor IA).`,
  },
  {
    kind: 'WANDA',
    displayName: 'Wanda',
    emoji: '🩷',
    systemPrompt: `Eres WANDA 🩷, el hada mágica de Matrix Hub. Práctica, enfocada, obsesionada con que las tareas se completen y nada quede a medias. Tienes un lado divertido — es seco, irónico, una línea bien puesta en el momento justo. No eres fría, eres eficiente.

Reglas:
• Siempre orienta la conversación hacia lo importante: tareas, progreso, próximos pasos
• Tu humor es sutil, inteligente, nunca forzado. Si no hay nada bueno que decir, no digas nada
• Sin emojis, o uno muy puntual si realmente amerita
• No te presentes a menos que te pregunten
• Si alguien divaga, lo traes de vuelta con elegancia: "Entiendo. ¿Vamos a lo prioritario?"
• Al terminar: "Listo." o "Hecho." sin aspavientos

Lee tu memoria y aplícala.

Recuerda: eres un hada mágica rosa. Hablas español. Leal a Stevens (el jefe) y respetas a Timmy (el asistente IA principal).`,
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

  // === MÉTRICAS MOCK (solo dev) ===
  // Imeldi Shop: frescas (verificadas ahora). OmniDrive: stale (>48h).
  const now = new Date();
  const threeDaysAgo = new Date(Date.now() - 72 * 3600000);

  const mockMetrics: {
    slug: string;
    verifiedAt: Date;
    isStale: boolean;
    metrics: { key: string; value: number; label: string; format: string }[];
  }[] = [
    {
      slug: 'imeldi-shop',
      verifiedAt: now,
      isStale: false,
      metrics: [
        { key: 'products_active', value: 299, label: 'Productos activos', format: 'number' },
        { key: 'products_total', value: 339, label: 'Total', format: 'number' },
        { key: 'avg_price', value: 9.42, label: 'Precio promedio', format: 'currency' },
        { key: 'stock', value: 318, label: 'Stock', format: 'number' },
      ],
    },
    {
      slug: 'omnidrive',
      verifiedAt: threeDaysAgo,
      isStale: true,
      metrics: [
        { key: 'vehicles', value: 6, label: 'Vehículos', format: 'number' },
        { key: 'users', value: 5, label: 'Usuarios', format: 'number' },
        { key: 'reservations', value: 0, label: 'Reservas', format: 'number' },
      ],
    },
  ];

  for (const group of mockMetrics) {
    const project = await prisma.project.findUnique({ where: { slug: group.slug } });
    if (!project) continue;
    for (const m of group.metrics) {
      await prisma.metric.upsert({
        where: { projectId_key: { projectId: project.id, key: m.key } },
        update: {
          value: m.value,
          label: m.label,
          format: m.format,
          verifiedAt: group.verifiedAt,
          isStale: group.isStale,
        },
        create: {
          projectId: project.id,
          key: m.key,
          value: m.value,
          label: m.label,
          format: m.format,
          source: 'seed:mock',
          verifiedAt: group.verifiedAt,
          isStale: group.isStale,
        },
      });
    }
    console.log(`✅ Métricas mock: ${group.slug} (${group.metrics.length})`);
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
