import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'mock-resumes');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BLUE = '#1a5276';
const BLACK = '#000000';
const GRAY = '#555555';

const CANDIDATES = [
  // ── Full Stack ──────────────────────────────────────────────────────────────
  {
    name: 'Alex Chen',
    location: 'Tel Aviv',
    phone: '(050)-111-2233',
    email: 'alex.chen@email.com',
    summary:
      'Full Stack Developer with 4 years of experience building scalable web applications. ' +
      'Passionate about clean architecture and developer experience.',
    experience: [
      {
        title: 'Full Stack Developer',
        company: 'TechNova Ltd.',
        type: 'SaaS company',
        period: '03/2022 - Present',
        bullets: [
          'Built and maintained a multi-tenant SaaS platform serving 50,000+ users using React, Next.js, and Node.js.',
          'Reduced API response times by 40% through query optimization and Redis caching strategies.',
          'Led migration from REST to GraphQL, improving data-fetching efficiency across 15+ client screens.',
          'Mentored two junior developers and conducted weekly code reviews to uphold code quality standards.',
        ],
      },
      {
        title: 'Junior Full Stack Developer',
        company: 'WebForge',
        type: 'Digital agency',
        period: '06/2020 - 02/2022',
        bullets: [
          'Delivered 10+ client websites and internal tools using React, Express.js, and PostgreSQL.',
          'Implemented CI/CD pipelines with GitHub Actions, cutting deployment time from hours to minutes.',
        ],
      },
    ],
    skills: [
      'Advanced proficiency in **React** and **Next.js** (TypeScript), including SSR, SSG, and incremental static regeneration.',
      'Backend development with **Node.js**, **Express.js**, and **GraphQL** following clean architecture principles.',
      'Database experience with **PostgreSQL** and **MongoDB**, including schema design and query tuning.',
      'State management with **Redux Toolkit** and **Zustand**; testing with **Jest** and **React Testing Library**.',
      'Containerization with **Docker** and orchestration basics with **Kubernetes**.',
    ],
    education: [
      { degree: 'B.Sc. Computer Science - Tel Aviv University', bullets: ['GPA: 88'] },
    ],
  },
  {
    name: 'Maya Rodriguez',
    location: 'Herzliya',
    phone: '(052)-334-5566',
    email: 'maya.rodriguez@email.com',
    summary:
      'Full Stack Developer specialising in real-time applications and mobile-first experiences. ' +
      'Experienced in delivering end-to-end features in fast-paced startup environments.',
    experience: [
      {
        title: 'Full Stack Developer',
        company: 'Pulse Analytics',
        type: 'Fintech startup',
        period: '07/2023 - Present',
        bullets: [
          'Designed and shipped a real-time financial dashboard using React, WebSockets, and Node.js serving 8,000 daily active users.',
          'Implemented end-to-end encryption for sensitive financial data in transit and at rest.',
          'Integrated third-party payment providers (Stripe, PayPal) into a unified billing module.',
        ],
      },
      {
        title: 'Frontend Developer',
        company: 'CreativeStack',
        type: 'Product studio',
        period: '01/2021 - 06/2023',
        bullets: [
          'Developed pixel-perfect UIs from Figma designs using React and Tailwind CSS for 6 client products.',
          'Introduced Storybook for component documentation, adopted across the full engineering team.',
        ],
      },
    ],
    skills: [
      'Frontend expertise with **React**, **Next.js**, and **React Native** (TypeScript) for web and mobile.',
      'Backend services with **Node.js** and **Fastify**; REST and **WebSocket** API design.',
      'Relational databases: **PostgreSQL** with **Prisma ORM**; caching with **Redis**.',
      'Payment integrations: **Stripe**, **PayPal**, and subscription lifecycle management.',
      'Design-to-code workflows with **Figma**, **Tailwind CSS**, and **Storybook**.',
    ],
    education: [
      { degree: 'Software Engineering - Reichman University', bullets: ['Average: 91'] },
    ],
  },

  // ── Backend ─────────────────────────────────────────────────────────────────
  {
    name: 'Jordan Smith',
    location: 'Be\'er Sheva',
    phone: '(054)-667-8899',
    email: 'jordan.smith@email.com',
    summary:
      'Backend Engineer with deep expertise in Python and distributed systems. ' +
      'Focused on building high-throughput, fault-tolerant microservices.',
    experience: [
      {
        title: 'Senior Backend Engineer',
        company: 'DataFlow Systems',
        type: 'Data infrastructure company',
        period: '05/2021 - Present',
        bullets: [
          'Architected a microservices platform processing 2M+ events per day using Python, FastAPI, and Apache Kafka.',
          'Reduced p99 latency from 800ms to 120ms by profiling hot paths and introducing async I/O patterns.',
          'Designed a multi-region PostgreSQL replication setup with automated failover, achieving 99.97% uptime.',
          'Built an internal CLI tooling suite that cut repetitive DevOps tasks by ~30% per sprint.',
        ],
      },
      {
        title: 'Backend Developer',
        company: 'CloudBridge',
        type: 'Cloud services provider',
        period: '08/2018 - 04/2021',
        bullets: [
          'Developed RESTful APIs in Python (Django REST Framework) for a B2B SaaS platform with 200+ enterprise clients.',
          'Maintained and extended a legacy PHP monolith while gradually extracting services into Python microservices.',
        ],
      },
    ],
    skills: [
      'Expert-level **Python** development: **FastAPI**, **Django**, **Celery**, async/await patterns.',
      'Message streaming with **Apache Kafka** and **RabbitMQ** for event-driven architectures.',
      'Relational and NoSQL databases: **PostgreSQL**, **Redis**, **Elasticsearch**.',
      'Containerisation with **Docker** and deployment on **AWS** (EC2, RDS, SQS, Lambda).',
      'Strong understanding of system design: CAP theorem, distributed transactions, eventual consistency.',
    ],
    education: [
      { degree: 'B.Sc. Computer Science - Ben-Gurion University', bullets: ['GPA: 92'] },
    ],
  },
  {
    name: 'Liam O\'Brien',
    location: 'Haifa',
    phone: '(053)-221-3344',
    email: 'liam.obrien@email.com',
    summary:
      'Backend Engineer with 6 years specialising in JVM-based services and enterprise integrations. ' +
      'Experienced in designing high-availability systems for regulated industries.',
    experience: [
      {
        title: 'Lead Backend Engineer',
        company: 'Nexus Health',
        type: 'Healthcare technology',
        period: '02/2020 - Present',
        bullets: [
          'Led backend development of an EHR integration platform processing 500K+ HL7 messages daily using Java and Spring Boot.',
          'Designed a HIPAA-compliant audit logging system covering all PHI access events across 12 microservices.',
          'Upgraded the platform from a monolith to microservices, reducing mean deploy time from 45 min to 8 min.',
          'Conducted architecture reviews and defined internal coding standards adopted team-wide.',
        ],
      },
      {
        title: 'Java Developer',
        company: 'Infotech Solutions',
        type: 'IT consultancy',
        period: '01/2017 - 01/2020',
        bullets: [
          'Built and maintained enterprise REST APIs using Java, Spring Boot, and Oracle DB for banking clients.',
          'Integrated SOAP-based legacy systems with modern REST services via Apache Camel.',
        ],
      },
    ],
    skills: [
      'Expert **Java** development with **Spring Boot**, Spring Security, and JPA/Hibernate.',
      'Messaging and integration: **Apache Kafka**, **RabbitMQ**, **Apache Camel**.',
      'Databases: **PostgreSQL**, **Oracle**, **MySQL**, and **Redis** for caching.',
      'Healthcare standards: HL7 FHIR, HIPAA compliance, audit logging.',
      'Build tools: **Maven**, **Gradle**; containerisation with **Docker** and **Kubernetes**.',
    ],
    education: [
      { degree: 'B.Sc. Software Engineering - Technion', bullets: ['GPA: 90'] },
    ],
  },
  {
    name: 'Priya Patel',
    location: 'Tel Aviv',
    phone: '(058)-445-6677',
    email: 'priya.patel@email.com',
    summary:
      'Backend Engineer specialising in Go and high-performance networking. ' +
      'Experienced in building developer-facing APIs and internal platform tooling.',
    experience: [
      {
        title: 'Backend Engineer',
        company: 'Streamline IO',
        type: 'Developer tools company',
        period: '11/2022 - Present',
        bullets: [
          'Built a low-latency gRPC API gateway in Go handling 10K+ RPS with sub-5ms p50 latency.',
          'Implemented an observability stack using OpenTelemetry, Prometheus, and Grafana across 20+ services.',
          'Designed and shipped a rate-limiting service using token buckets backed by Redis, preventing API abuse.',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Binary Labs',
        type: 'Infrastructure startup',
        period: '06/2020 - 10/2022',
        bullets: [
          'Developed internal tooling and CLIs in **Go** to automate cloud resource provisioning across AWS and GCP.',
          'Contributed to an open-source service mesh library, authoring the mTLS handshake module.',
        ],
      },
    ],
    skills: [
      'Expert-level **Go** development: REST and **gRPC** services, concurrency patterns, profiling.',
      'Observability: **OpenTelemetry**, **Prometheus**, **Grafana**, distributed tracing.',
      'Databases: **PostgreSQL**, **Redis**, **CockroachDB**.',
      'Networking fundamentals: TCP/UDP, TLS, HTTP/2, service mesh concepts.',
      'Cloud: **AWS** (EKS, S3, DynamoDB) and **GCP** (GKE, Pub/Sub).',
    ],
    education: [
      { degree: 'B.Sc. Computer Engineering - Bar-Ilan University', bullets: ['GPA: 93'] },
    ],
  },

  // ── Frontend ─────────────────────────────────────────────────────────────────
  {
    name: 'Sofia Andersen',
    location: 'Ramat Gan',
    phone: '(050)-778-9900',
    email: 'sofia.andersen@email.com',
    summary:
      'Frontend Developer with a strong eye for UI/UX and a track record of delivering ' +
      'accessible, performant web applications at scale.',
    experience: [
      {
        title: 'Senior Frontend Developer',
        company: 'Visually',
        type: 'Design platform',
        period: '04/2022 - Present',
        bullets: [
          'Led frontend development of a drag-and-drop design editor used by 80,000+ monthly users in React and TypeScript.',
          'Achieved a Lighthouse performance score of 97 by implementing code splitting, lazy loading, and image optimisation.',
          'Established an internal component library and design system used across 4 product teams.',
          'Drove adoption of WCAG 2.1 AA accessibility standards, reducing reported accessibility issues by 70%.',
        ],
      },
      {
        title: 'Frontend Developer',
        company: 'BrightUI Agency',
        type: 'UI consultancy',
        period: '09/2019 - 03/2022',
        bullets: [
          'Delivered 12+ client-facing web applications in React with high fidelity to Figma designs.',
          'Introduced automated visual regression testing with Chromatic, catching 90% of accidental UI regressions.',
        ],
      },
    ],
    skills: [
      'Expert **React** and **TypeScript** development including hooks, context, and performance patterns.',
      'CSS mastery: **Tailwind CSS**, CSS-in-JS (**styled-components**), CSS Modules, animations.',
      'Accessibility: WCAG 2.1, ARIA, screen-reader testing with VoiceOver and NVDA.',
      'Testing: **Jest**, **React Testing Library**, **Playwright**, visual regression with **Chromatic**.',
      'Design tools: **Figma**, **Storybook**; performance tooling: Lighthouse, WebPageTest.',
    ],
    education: [
      { degree: 'B.Sc. Information Systems - IDC Herzliya', bullets: ['Average: 89'] },
    ],
  },
  {
    name: 'Noah Williams',
    location: 'Petah Tikva',
    phone: '(052)-990-1122',
    email: 'noah.williams@email.com',
    summary:
      'Frontend Developer experienced in Angular and Vue.js for enterprise applications. ' +
      'Skilled at bridging the gap between design teams and engineering.',
    experience: [
      {
        title: 'Frontend Developer',
        company: 'CorpSuite',
        type: 'Enterprise SaaS',
        period: '01/2021 - Present',
        bullets: [
          'Developed and maintained large-scale enterprise dashboards in Angular 14+ serving 5,000 B2B users.',
          'Refactored 60K lines of AngularJS legacy code to Angular, with zero regression in production.',
          'Built a shared UI library using Angular CDK published to the company\'s private npm registry.',
        ],
      },
      {
        title: 'Junior Frontend Developer',
        company: 'AppFactory',
        type: 'Product agency',
        period: '06/2018 - 12/2020',
        bullets: [
          'Delivered client projects in **Vue.js** and **Nuxt.js**, including SSR e-commerce storefronts.',
          'Collaborated with UX designers to convert wireframes into responsive, mobile-first interfaces.',
        ],
      },
    ],
    skills: [
      'Advanced **Angular** (v14+): components, services, RxJS, NgRx state management.',
      'Proficiency in **Vue.js** and **Nuxt.js** for SSR and static site generation.',
      'TypeScript, RxJS, and reactive programming patterns.',
      'Testing: **Jest**, **Jasmine/Karma**, **Cypress** for E2E.',
      'Build tools: **Webpack**, **Vite**, **nx** monorepo tooling.',
    ],
    education: [
      { degree: 'Practical Software Engineering - HackerU College', bullets: ['Average: 92'] },
    ],
  },

  // ── DevOps / Cloud ───────────────────────────────────────────────────────────
  {
    name: 'Carlos Mendez',
    location: 'Tel Aviv',
    phone: '(054)-334-5500',
    email: 'carlos.mendez@email.com',
    summary:
      'DevOps Engineer with 5 years of experience automating infrastructure and delivery pipelines. ' +
      'Expert in AWS and Kubernetes with a focus on reliability and cost efficiency.',
    experience: [
      {
        title: 'Senior DevOps Engineer',
        company: 'Orbis Cloud',
        type: 'Cloud-native company',
        period: '06/2021 - Present',
        bullets: [
          'Managed a Kubernetes cluster of 200+ nodes across 3 AWS regions hosting 60 microservices.',
          'Reduced cloud infrastructure costs by 35% through right-sizing, spot instances, and reserved capacity planning.',
          'Implemented GitOps workflows with **ArgoCD**, enabling zero-downtime continuous deployments.',
          'Designed a disaster recovery strategy achieving an RTO of under 15 minutes for critical services.',
        ],
      },
      {
        title: 'DevOps Engineer',
        company: 'SpeedDeploy',
        type: 'CI/CD tooling startup',
        period: '03/2018 - 05/2021',
        bullets: [
          'Built and maintained CI/CD pipelines with **Jenkins** and **GitHub Actions** for 30+ engineering teams.',
          'Automated infrastructure provisioning using **Terraform** and **Ansible**, reducing setup time by 80%.',
        ],
      },
    ],
    skills: [
      'Container orchestration: **Kubernetes** (EKS, GKE), **Helm**, **ArgoCD**, **Istio**.',
      'Cloud platforms: **AWS** (EC2, EKS, RDS, S3, CloudFront, IAM) at advanced level.',
      'Infrastructure as Code: **Terraform**, **Pulumi**, **CloudFormation**.',
      'CI/CD: **GitHub Actions**, **Jenkins**, **GitLab CI**, release automation.',
      'Monitoring and observability: **Prometheus**, **Grafana**, **Datadog**, **PagerDuty**.',
    ],
    education: [
      { degree: 'B.Sc. Computer Science - Afeka College', bullets: ['GPA: 87'] },
    ],
  },
  {
    name: 'Aisha Johnson',
    location: 'Haifa',
    phone: '(053)-556-7788',
    email: 'aisha.johnson@email.com',
    summary:
      'Cloud Engineer specialising in GCP and platform engineering. Experienced in building ' +
      'internal developer platforms that reduce cognitive load for engineering teams.',
    experience: [
      {
        title: 'Platform Engineer',
        company: 'Horizon Tech',
        type: 'Platform engineering team',
        period: '09/2022 - Present',
        bullets: [
          'Built and operated an internal developer platform on GKE used by 120 engineers, abstracting away infrastructure complexity.',
          'Authored Terraform modules for standardised GCP resource provisioning, adopted across 8 product teams.',
          'Implemented secret management and rotation using **HashiCorp Vault**, eliminating hard-coded credentials in 40+ repos.',
        ],
      },
      {
        title: 'Cloud Engineer',
        company: 'NimbusSoft',
        type: 'IT services company',
        period: '01/2020 - 08/2022',
        bullets: [
          'Migrated 15 on-premise applications to GCP, achieving 99.9% SLA with automated failover.',
          'Set up network peering, VPCs, and Cloud Armor WAF policies for enterprise security compliance.',
        ],
      },
    ],
    skills: [
      'Deep expertise in **Google Cloud Platform**: GKE, Cloud Run, Pub/Sub, BigQuery, Cloud SQL.',
      'Infrastructure as Code: **Terraform**, **Pulumi**; configuration management with **Ansible**.',
      'Security: **HashiCorp Vault**, IAM policies, SIEM integration, compliance frameworks (SOC 2).',
      'Observability: **Cloud Operations Suite**, **Grafana**, **OpenTelemetry**.',
      'Scripting: **Python**, **Bash**, and **Go** for automation and tooling.',
    ],
    education: [
      { degree: 'B.Sc. Information Technology - ORT Braude College', bullets: ['Average: 90'] },
    ],
  },
  {
    name: 'Ethan Kim',
    location: 'Rishon LeZion',
    phone: '(050)-223-4455',
    email: 'ethan.kim@email.com',
    summary:
      'Full Stack Developer with a background in backend-heavy systems and a growing expertise in ' +
      'modern frontend frameworks. Experienced in Python/Django and Vue.js.',
    experience: [
      {
        title: 'Full Stack Developer',
        company: 'ReachHub',
        type: 'Marketing technology',
        period: '08/2022 - Present',
        bullets: [
          'Built end-to-end features for a marketing automation platform with 15,000+ users using Vue.js and Django REST Framework.',
          'Designed a background task system using **Celery** and **Redis** for processing email campaigns of 100K+ recipients.',
          'Integrated with external APIs (Mailchimp, HubSpot, Salesforce) and built a normalisation layer to unify data models.',
        ],
      },
      {
        title: 'Backend Developer',
        company: 'DataSpark',
        type: 'Analytics startup',
        period: '01/2020 - 07/2022',
        bullets: [
          'Developed data ingestion pipelines in Python processing 5GB+ of raw event data daily.',
          'Built an internal admin dashboard in **Vue.js** for monitoring pipeline health and triggering manual runs.',
        ],
      },
    ],
    skills: [
      'Frontend: **Vue.js** (Vue 3 Composition API), **Nuxt.js**, TypeScript, Pinia.',
      'Backend: **Python**, **Django**, **Django REST Framework**, **Celery** for async tasks.',
      'Databases: **PostgreSQL**, **Redis**, **Elasticsearch** for full-text search.',
      'Third-party integrations: CRM/marketing APIs, OAuth2, webhook design.',
      'DevOps basics: **Docker**, **Nginx**, **GitHub Actions** for CI.',
    ],
    education: [
      { degree: 'Software Practical Engineering - Jerusalem College of Technology', bullets: ['Average: 88'] },
    ],
  },
];

// ── PDF helpers ──────────────────────────────────────────────────────────────

function boldText(doc, line, x, y, fontSize, options = {}) {
  // Parse **bold** segments and render them inline
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  let cursor = x;
  const lineY = y;

  parts.forEach((part) => {
    const isBold = /^\*\*/.test(part);
    const text = isBold ? part.replace(/\*\*/g, '') : part;
    if (!text) return;
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
    const w = doc.widthOfString(text);
    doc.text(text, cursor, lineY, { lineBreak: false, ...options });
    cursor += w;
  });
  return cursor;
}

function buildPDF(candidate, outputPath) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const LEFT = doc.page.margins.left;

  // ── Header ──
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(BLACK)
    .text(candidate.name, LEFT, 50, { align: 'center', width: pageWidth });

  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(GRAY)
    .text(
      `${candidate.location}  |  ${candidate.phone}  |  ${candidate.email}  |  LinkedIn  |  GitHub`,
      LEFT,
      doc.y + 2,
      { align: 'center', width: pageWidth }
    );

  doc.moveDown(0.6);

  // ── Summary ──
  doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(candidate.summary, LEFT, doc.y, {
    width: pageWidth,
    align: 'justify',
  });

  doc.moveDown(0.8);

  // ── Section helper ──
  function sectionHeader(title) {
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(BLUE)
      .text(title, LEFT, doc.y);
    doc
      .moveTo(LEFT, doc.y)
      .lineTo(LEFT + pageWidth, doc.y)
      .strokeColor(BLUE)
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.3);
    doc.fillColor(BLACK);
  }

  // ── Experience ──
  sectionHeader('Experience');

  candidate.experience.forEach((job) => {
    const yBefore = doc.y;

    // Title + company (left), period (right)
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(BLACK)
      .text(`${job.title} at ${job.company}.`, LEFT, yBefore, {
        continued: false,
        width: pageWidth * 0.65,
      });

    doc
      .font('Helvetica-Oblique')
      .fontSize(9.5)
      .fillColor(GRAY)
      .text(`(${job.type})`, LEFT + doc.widthOfString(`${job.title} at ${job.company}. `) + 2, yBefore, {
        lineBreak: false,
      });

    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(BLACK)
      .text(job.period, LEFT, yBefore, { align: 'right', width: pageWidth });

    doc.fillColor(BLACK);
    doc.moveDown(0.25);

    job.bullets.forEach((b) => {
      const bulletX = LEFT + 12;
      const textX = LEFT + 22;
      const bulletY = doc.y + 1.5;
      doc.circle(bulletX, bulletY + 3.5, 1.8).fill(BLACK);
      doc.font('Helvetica').fontSize(9.5).fillColor(BLACK);
      doc.text(b, textX, bulletY, { width: pageWidth - 22, align: 'justify' });
      doc.moveDown(0.15);
    });

    doc.moveDown(0.3);
  });

  // ── Technical Knowledge ──
  sectionHeader('Technical Knowledge');

  candidate.skills.forEach((skill) => {
    const bulletX = LEFT + 12;
    const textX = LEFT + 22;
    const bulletY = doc.y + 1.5;
    doc.circle(bulletX, bulletY + 3.5, 1.8).fill(BLACK);

    // Render inline bold segments
    const parts = skill.split(/(\*\*[^*]+\*\*)/g);
    let isFirst = true;
    let currentX = textX;
    const startY = bulletY;

    // We'll do a single wrapped text block by stripping bold markers first,
    // then rendering with a simpler approach that wraps correctly.
    // For simplicity render the full text in normal weight with bold segments inline on first line only.
    const plainText = skill.replace(/\*\*/g, '');
    doc.font('Helvetica').fontSize(9.5).fillColor(BLACK).text(plainText, textX, startY, {
      width: pageWidth - 22,
      align: 'justify',
    });
    doc.moveDown(0.15);
  });

  doc.moveDown(0.3);

  // ── Education ──
  sectionHeader('Education');

  candidate.education.forEach((edu) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text(edu.degree, LEFT, doc.y);
    edu.bullets.forEach((b) => {
      const bulletX = LEFT + 12;
      const textX = LEFT + 22;
      const bulletY = doc.y + 1.5;
      doc.circle(bulletX, bulletY + 3.5, 1.8).fill(BLACK);
      doc.font('Helvetica').fontSize(9.5).fillColor(BLACK).text(b, textX, bulletY, {
        width: pageWidth - 22,
      });
      doc.moveDown(0.1);
    });
  });

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

(async () => {
  console.log(`Generating ${CANDIDATES.length} mock resumes → ${OUTPUT_DIR}\n`);
  for (const candidate of CANDIDATES) {
    const filename = `${slugify(candidate.name)}-resume.pdf`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    await buildPDF(candidate, outputPath);
    console.log(`  ✓  ${filename}`);
  }
  console.log('\nDone.');
})();




