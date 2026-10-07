const SITE_LANGS = ["en", "pt", "es"];
const SITE_LANG_KEY = "site-lang";

const copy = {
    en: {
        "meta.title": "Ivan Matthias Sardon Medina | Software Developer",
        "meta.description": "Portfolio of Ivan Matthias Sardon Medina, a Computer Science student and software developer focused on systems, networking, web, mobile, databases, and applied software.",
        "meta.keywords": "Ivan Sardon, Ivan Matthias Sardon Medina, software developer, computer science, UCSP, C++, Flutter, React, networking, database systems",
        "meta.ogTitle": "Ivan Matthias Sardon Medina - Software Developer",
        "meta.ogDescription": "Systems, networking, web, mobile, and product-oriented software portfolio.",
        "meta.locale": "en_US",
        "meta.jobTitle": "Software Developer and Computer Science Student",
        "meta.birthPlace": "Arequipa, Peru",
        "skip": "Skip to content",
        "nav.primary": "Primary navigation",
        "brand.home": "Ivan Sardon home",
        "nav.open": "Open navigation",
        "nav.close": "Close navigation",
        "nav.expertise": "Expertise",
        "nav.projects": "Projects",
        "nav.about": "About",
        "nav.contact": "Contact",
        "lang.label": "Language",
        "lang.changed": "Language changed to English",
        "hint": "Move the pointer",
        "profile.label": "Profile highlights",
        "metric.born": "Born in Arequipa, Peru",
        "metric.student": "Computer Science student since March 2023",
        "metric.finalist": "NASA Space Apps global finalist with AyniTech",
        "expertise.eyebrow": "Expertise spectrum",
        "expertise.title": "One engineering mindset across very different application layers.",
        "expertise.body": "My work connects low-level implementation details with user-facing products: storage logic, indexing, sockets, command-line tools, backend architecture, web interfaces, mobile apps, and AI integration.",
        "spectrum.label": "Low-level to high-level expertise",
        "spectrum.systems.title": "Systems",
        "spectrum.systems.body": "C, C++, memory, data structures, files, indexing, and performance-oriented programming.",
        "spectrum.network.title": "Networking & UNIX",
        "spectrum.network.body": "TCP/IP, sockets, Linux workflows, CLI tools, parsing, and automation-friendly utilities.",
        "spectrum.data.title": "Backend & Data",
        "spectrum.data.body": "Database concepts, scalable architecture, Firebase, MongoDB, MySQL, and API connectivity.",
        "spectrum.product.title": "Web & Mobile",
        "spectrum.product.body": "TypeScript, React, Next.js, Flutter, Swift, responsive UI, and production-oriented app design.",
        "tech.label": "Technologies",
        "projects.eyebrow": "Featured projects",
        "projects.title": "Selected work that shows range, not just one stack.",
        "projects.body": "These projects are organized by the engineering capability they demonstrate, from database internals to mobile products and challenge-driven applications.",
        "project.db.type": "Database internals",
        "project.db.title": "Custom Database Engine in C++",
        "project.db.body": "Designed and implemented a storage simulation system focused on sparse and dense indexing, AVL-tree based indexing, bulk insertion from text files, and physical storage calculations.",
        "tag.structures": "Data Structures",
        "tag.indexing": "Indexing",
        "tag.files": "File Systems",
        "project.tcp.type": "Networking",
        "project.tcp.title": "TCP Scanner",
        "project.tcp.body": "Socket-based network tooling project covering TCP communication, port scanning workflows, concurrent operations, and low-level analysis concepts.",
        "project.unix.type": "UNIX tooling",
        "project.unix.title": "UNIX Log Parser",
        "project.unix.body": "CLI-oriented utility for structured log parsing, pattern extraction, UNIX workflow integration, and efficient text processing.",
        "tag.parsing": "Parsing",
        "project.mobile.type": "Mobile product",
        "project.mobile.title": "Flutter Inventory & Work Order System",
        "project.mobile.body": "Business-oriented mobile app with real-time product search, Firestore multi-filter querying, dynamic PDF generation, inventory workflows, and responsive Flutter UI.",
        "project.nasa.body": "Educational Flutter app built for the EMIT for the Future challenge, using NASA mission data to explain health, community, and environmental impact in five Peruvian cities.",
        "tag.nasa": "NASA Data",
        "project.clock.type": "iOS + web",
        "project.clock.title": "Digital Clock & Web Projects",
        "project.clock.body": "Swift-based landscape iOS clock application distributed through TestFlight, plus responsive web applications using component-based architecture and API integration.",
        "foundations.eyebrow": "Foundations",
        "foundations.title": "Early projects that shaped the base.",
        "foundation.basilisk": "Action RPG final group project that achieved the highest grade possible in the course history.",
        "foundation.sales.title": "Santillana Sales Dashboard",
        "foundation.sales.body": "C++ OOP dashboard using dynamic memory allocation, inheritance, and polymorphism.",
        "foundation.games.title": "Classic C++ Games",
        "foundation.games.body": "Snake and Tic Tac Toe console programs built as an introduction to C++ syntax and logic.",
        "about.eyebrow": "About",
        "about.title": "Curiosity, technical discipline, and creative range.",
        "about.alt": "Portrait of Ivan Matthias Sardon Medina",
        "about.p1": "I am Ivan Matthias Sardon Medina, a developer from Arequipa, Peru, focused on the path from data structures and networking to web and mobile products.",
        "about.p2": "I was born in Arequipa, Peru in 2005. In school, Mathematics, Computer Science, and English became early strengths, and after exploring engineering I found Computer Science at Universidad Católica San Pablo.",
        "about.p3": "I began studying Computer Science in March 2023. Since then, I have focused on strong academic performance while learning beyond coursework through talks, congresses, hackathons, and projects that force me to understand software at different levels.",
        "about.p4": "Outside software, I play piano, draw and paint across several media, train consistently, and enjoy volleyball and taekwondo. That creative side matters to my engineering work: I care about building products that are technically solid, usable, and thoughtfully designed.",
        "contact.eyebrow": "Contact",
        "contact.title": "Let's build something technically solid and genuinely useful.",
        "contact.body": "I am open to software projects, engineering collaboration, and conversations around systems, web, mobile, databases, networking, and applied product work.",
        "footer.built": "Built for GitHub Pages.",
        "footer.top": "Back to top",
        "redirect.title": "Redirecting to Ivan Sardon's Portfolio",
        "redirect.projects": "This page has moved to <a href=\"index.html#projects\">the Projects section of the portfolio</a>.",
        "redirect.contact": "This page has moved to <a href=\"index.html#contact\">the Contact section of the portfolio</a>.",
        "redirect.about": "This page has moved to <a href=\"index.html#about\">the About section of the portfolio</a>.",
        "redirect.home": "This page has moved to <a href=\"index.html\">the portfolio homepage</a>.",
        "redirect.expertise": "This page has moved to <a href=\"index.html#expertise\">the Expertise section of the portfolio</a>."
    },
    pt: {
        "meta.title": "Ivan Matthias Sardon Medina | Desenvolvedor de software",
        "meta.description": "Portfólio de Ivan Matthias Sardon Medina, estudante de Ciência da Computação e desenvolvedor de software, focado em sistemas, redes, web, mobile, bancos de dados e software aplicado.",
        "meta.keywords": "Ivan Sardon, Ivan Matthias Sardon Medina, desenvolvedor de software, ciência da computação, UCSP, C++, Flutter, React, redes, bancos de dados",
        "meta.ogTitle": "Ivan Matthias Sardon Medina - Desenvolvedor de software",
        "meta.ogDescription": "Portfólio de software orientado a sistemas, redes, web, mobile e produto.",
        "meta.locale": "pt_BR",
        "meta.jobTitle": "Desenvolvedor de software e estudante de Ciência da Computação",
        "meta.birthPlace": "Arequipa, Peru",
        "skip": "Pular para o conteúdo",
        "nav.primary": "Navegação principal",
        "brand.home": "Início de Ivan Sardon",
        "nav.open": "Abrir navegação",
        "nav.close": "Fechar navegação",
        "nav.expertise": "Experiência",
        "nav.projects": "Projetos",
        "nav.about": "Sobre",
        "nav.contact": "Contato",
        "lang.label": "Idioma",
        "lang.changed": "Idioma alterado para português",
        "hint": "Mova o ponteiro",
        "profile.label": "Destaques do perfil",
        "metric.born": "Nascido em Arequipa, Peru",
        "metric.student": "Estudante de Ciência da Computação desde março de 2023",
        "metric.finalist": "Finalista global do NASA Space Apps com a AyniTech",
        "expertise.eyebrow": "Espectro de experiência",
        "expertise.title": "A mesma maneira de pensar engenharia, em camadas de aplicação bem diferentes.",
        "expertise.body": "Meu trabalho liga os detalhes de implementação de baixo nível a produtos que as pessoas usam: lógica de armazenamento, indexação, sockets, ferramentas de linha de comando, arquitetura de backend, interfaces web, apps mobile e integração de IA.",
        "spectrum.label": "Experiência do baixo ao alto nível",
        "spectrum.systems.title": "Sistemas",
        "spectrum.systems.body": "C, C++, memória, estruturas de dados, arquivos, indexação e programação orientada a desempenho.",
        "spectrum.network.title": "Redes e UNIX",
        "spectrum.network.body": "TCP/IP, sockets, fluxos de trabalho no Linux, ferramentas de linha de comando, análise de texto e utilitários feitos para automatizar.",
        "spectrum.data.title": "Backend e dados",
        "spectrum.data.body": "Conceitos de banco de dados, arquitetura escalável, Firebase, MongoDB, MySQL e conexão com APIs.",
        "spectrum.product.title": "Web e mobile",
        "spectrum.product.body": "TypeScript, React, Next.js, Flutter, Swift, interfaces responsivas e design de apps orientado à produção.",
        "tech.label": "Tecnologias",
        "projects.eyebrow": "Projetos em destaque",
        "projects.title": "Trabalhos escolhidos para mostrar amplitude, não só uma tecnologia.",
        "projects.body": "Estes projetos estão organizados pela capacidade de engenharia que demonstram, do interior de um banco de dados a produtos mobile e aplicativos feitos para um desafio.",
        "project.db.type": "Interior de bancos de dados",
        "project.db.title": "Motor de banco de dados próprio em C++",
        "project.db.body": "Projetei e implementei um sistema que simula o armazenamento, focado em indexação esparsa e densa, indexação com árvores AVL, inserção em massa a partir de arquivos de texto e cálculos de armazenamento físico.",
        "tag.structures": "Estruturas de dados",
        "tag.indexing": "Indexação",
        "tag.files": "Sistemas de arquivos",
        "project.tcp.type": "Redes",
        "project.tcp.title": "Scanner TCP",
        "project.tcp.body": "Projeto de ferramentas de rede com sockets: comunicação TCP, varredura de portas, operações em paralelo e conceitos de análise de baixo nível.",
        "project.unix.type": "Ferramentas UNIX",
        "project.unix.title": "Analisador de logs UNIX",
        "project.unix.body": "Utilitário de linha de comando para analisar logs estruturados, extrair padrões, integrar-se ao fluxo de trabalho UNIX e processar texto com eficiência.",
        "tag.parsing": "Análise",
        "project.mobile.type": "Produto mobile",
        "project.mobile.title": "Sistema de inventário e ordens de serviço em Flutter",
        "project.mobile.body": "App mobile voltado a negócios, com busca de produtos em tempo real, consultas com vários filtros no Firestore, geração dinâmica de PDF, fluxos de inventário e interface Flutter responsiva.",
        "project.nasa.body": "App educativo em Flutter feito para o desafio EMIT for the Future. Usa dados de missões da NASA para explicar o impacto na saúde, na comunidade e no ambiente em cinco cidades do Peru.",
        "tag.nasa": "Dados da NASA",
        "project.clock.type": "iOS e web",
        "project.clock.title": "Relógio digital e projetos web",
        "project.clock.body": "Aplicativo de relógio para iOS na horizontal, feito em Swift e distribuído pelo TestFlight, além de aplicações web responsivas com arquitetura de componentes e integração de APIs.",
        "foundations.eyebrow": "Bases",
        "foundations.title": "Projetos iniciais que formaram a base.",
        "foundation.basilisk": "RPG de ação, projeto final em grupo, que tirou a nota mais alta já registrada na história da disciplina.",
        "foundation.sales.title": "Painel de vendas Santillana",
        "foundation.sales.body": "Painel em C++ com programação orientada a objetos, memória dinâmica, herança e polimorfismo.",
        "foundation.games.title": "Jogos clássicos em C++",
        "foundation.games.body": "Snake e Tic Tac Toe no console, feitos como introdução à sintaxe e à lógica de C++.",
        "about.eyebrow": "Sobre",
        "about.title": "Curiosidade, disciplina técnica e amplitude criativa.",
        "about.alt": "Retrato de Ivan Matthias Sardon Medina",
        "about.p1": "Sou Ivan Matthias Sardon Medina, desenvolvedor de Arequipa, Peru, focado no caminho que vai das estruturas de dados e das redes aos produtos web e mobile.",
        "about.p2": "Nasci em Arequipa, Peru, em 2005. Na escola, Matemática, Ciência da Computação e Inglês foram pontos fortes desde cedo, e depois de explorar engenharia encontrei Ciência da Computação na Universidad Católica San Pablo.",
        "about.p3": "Comecei a estudar Ciência da Computação em março de 2023. Desde então me concentrei em um bom desempenho acadêmico e, ao mesmo tempo, em aprender fora das disciplinas: palestras, congressos, hackathons e projetos que me obrigam a entender software em níveis diferentes.",
        "about.p4": "Fora do software toco piano, desenho e pinto em vários meios, treino com constância e gosto de vôlei e taekwondo. Esse lado criativo importa no meu trabalho de engenharia: me importa construir produtos tecnicamente sólidos, fáceis de usar e desenhados com cuidado.",
        "contact.eyebrow": "Contato",
        "contact.title": "Vamos construir algo tecnicamente sólido e realmente útil.",
        "contact.body": "Estou aberto a projetos de software, colaboração em engenharia e conversas sobre sistemas, web, mobile, bancos de dados, redes e trabalho de produto aplicado.",
        "footer.built": "Feito para o GitHub Pages.",
        "footer.top": "Voltar ao topo",
        "redirect.title": "Redirecionando para o portfólio de Ivan Sardon",
        "redirect.projects": "Esta página agora está na <a href=\"index.html#projects\">seção de projetos do portfólio</a>.",
        "redirect.contact": "Esta página agora está na <a href=\"index.html#contact\">seção de contato do portfólio</a>.",
        "redirect.about": "Esta página agora está na <a href=\"index.html#about\">seção sobre mim do portfólio</a>.",
        "redirect.home": "Esta página agora está na <a href=\"index.html\">página inicial do portfólio</a>.",
        "redirect.expertise": "Esta página agora está na <a href=\"index.html#expertise\">seção de experiência do portfólio</a>."
    },
    es: {
        "meta.title": "Ivan Matthias Sardon Medina | Desarrollador de software",
        "meta.description": "Portafolio de Ivan Matthias Sardon Medina, estudiante de Ciencia de la Computación y desarrollador de software, enfocado en sistemas, redes, web, móvil, bases de datos y software aplicado.",
        "meta.keywords": "Ivan Sardon, Ivan Matthias Sardon Medina, desarrollador de software, ciencia de la computación, UCSP, C++, Flutter, React, redes, bases de datos",
        "meta.ogTitle": "Ivan Matthias Sardon Medina - Desarrollador de software",
        "meta.ogDescription": "Portafolio de software orientado a sistemas, redes, web, móvil y producto.",
        "meta.locale": "es_PE",
        "meta.jobTitle": "Desarrollador de software y estudiante de Ciencia de la Computación",
        "meta.birthPlace": "Arequipa, Perú",
        "skip": "Saltar al contenido",
        "nav.primary": "Navegación principal",
        "brand.home": "Inicio de Ivan Sardon",
        "nav.open": "Abrir navegación",
        "nav.close": "Cerrar navegación",
        "nav.expertise": "Experiencia",
        "nav.projects": "Proyectos",
        "nav.about": "Sobre mí",
        "nav.contact": "Contacto",
        "lang.label": "Idioma",
        "lang.changed": "Idioma cambiado a español",
        "hint": "Mueve el puntero",
        "profile.label": "Datos destacados del perfil",
        "metric.born": "Nacido en Arequipa, Perú",
        "metric.student": "Estudiante de Ciencia de la Computación desde marzo de 2023",
        "metric.finalist": "Finalista global de NASA Space Apps con AyniTech",
        "expertise.eyebrow": "Espectro de experiencia",
        "expertise.title": "Una misma manera de pensar la ingeniería, en capas de aplicación muy distintas.",
        "expertise.body": "Mi trabajo une los detalles de implementación de bajo nivel con productos que usa la gente: lógica de almacenamiento, indexación, sockets, herramientas de línea de comandos, arquitectura de backend, interfaces web, apps móviles e integración de IA.",
        "spectrum.label": "Experiencia de bajo a alto nivel",
        "spectrum.systems.title": "Sistemas",
        "spectrum.systems.body": "C, C++, memoria, estructuras de datos, archivos, indexación y programación orientada al rendimiento.",
        "spectrum.network.title": "Redes y UNIX",
        "spectrum.network.body": "TCP/IP, sockets, flujos de trabajo en Linux, herramientas de línea de comandos, análisis de texto y utilidades pensadas para automatizar.",
        "spectrum.data.title": "Backend y datos",
        "spectrum.data.body": "Conceptos de bases de datos, arquitectura escalable, Firebase, MongoDB, MySQL y conexión con APIs.",
        "spectrum.product.title": "Web y móvil",
        "spectrum.product.body": "TypeScript, React, Next.js, Flutter, Swift, interfaces responsivas y diseño de apps orientado a producción.",
        "tech.label": "Tecnologías",
        "projects.eyebrow": "Proyectos destacados",
        "projects.title": "Trabajos elegidos para mostrar amplitud, no una sola tecnología.",
        "projects.body": "Estos proyectos están organizados por la capacidad de ingeniería que demuestran, desde el interior de una base de datos hasta productos móviles y aplicaciones hechas para un reto.",
        "project.db.type": "Interior de bases de datos",
        "project.db.title": "Motor de base de datos propio en C++",
        "project.db.body": "Diseñé e implementé un sistema que simula el almacenamiento, centrado en indexación dispersa y densa, indexación con árboles AVL, inserción masiva desde archivos de texto y cálculos de almacenamiento físico.",
        "tag.structures": "Estructuras de datos",
        "tag.indexing": "Indexación",
        "tag.files": "Sistemas de archivos",
        "project.tcp.type": "Redes",
        "project.tcp.title": "Escáner TCP",
        "project.tcp.body": "Proyecto de herramientas de red con sockets: comunicación TCP, escaneo de puertos, operaciones en paralelo y conceptos de análisis de bajo nivel.",
        "project.unix.type": "Herramientas UNIX",
        "project.unix.title": "Analizador de logs UNIX",
        "project.unix.body": "Utilidad de línea de comandos para analizar logs estructurados, extraer patrones, integrarse al flujo de trabajo UNIX y procesar texto con eficiencia.",
        "tag.parsing": "Análisis",
        "project.mobile.type": "Producto móvil",
        "project.mobile.title": "Sistema de inventario y órdenes de trabajo en Flutter",
        "project.mobile.body": "App móvil orientada a negocios, con búsqueda de productos en tiempo real, consultas con varios filtros en Firestore, generación dinámica de PDF, flujos de inventario e interfaz Flutter responsiva.",
        "project.nasa.body": "App educativa en Flutter hecha para el reto EMIT for the Future. Usa datos de misiones de la NASA para explicar el impacto en la salud, la comunidad y el ambiente en cinco ciudades del Perú.",
        "tag.nasa": "Datos de la NASA",
        "project.clock.type": "iOS y web",
        "project.clock.title": "Reloj digital y proyectos web",
        "project.clock.body": "Aplicación de reloj para iOS en horizontal, hecha en Swift y distribuida por TestFlight, más aplicaciones web responsivas con arquitectura de componentes e integración de APIs.",
        "foundations.eyebrow": "Bases",
        "foundations.title": "Proyectos tempranos que formaron la base.",
        "foundation.basilisk": "RPG de acción, proyecto final en grupo, que obtuvo la nota más alta registrada en la historia del curso.",
        "foundation.sales.title": "Panel de ventas Santillana",
        "foundation.sales.body": "Panel en C++ con programación orientada a objetos, memoria dinámica, herencia y polimorfismo.",
        "foundation.games.title": "Juegos clásicos en C++",
        "foundation.games.body": "Snake y Tic Tac Toe en consola, hechos como introducción a la sintaxis y la lógica de C++.",
        "about.eyebrow": "Sobre mí",
        "about.title": "Curiosidad, disciplina técnica y amplitud creativa.",
        "about.alt": "Retrato de Ivan Matthias Sardon Medina",
        "about.p1": "Soy Ivan Matthias Sardon Medina, desarrollador de Arequipa, Perú, enfocado en el camino que va de las estructuras de datos y las redes a los productos web y móviles.",
        "about.p2": "Nací en Arequipa, Perú, en 2005. En el colegio, Matemática, Ciencia de la Computación e Inglés fueron fortalezas tempranas, y después de explorar ingeniería encontré Ciencia de la Computación en la Universidad Católica San Pablo.",
        "about.p3": "Empecé a estudiar Ciencia de la Computación en marzo de 2023. Desde entonces me he concentrado en un buen rendimiento académico y, al mismo tiempo, en aprender fuera de los cursos: charlas, congresos, hackatones y proyectos que me obligan a entender el software en distintos niveles.",
        "about.p4": "Fuera del software toco piano, dibujo y pinto en varios medios, entreno con constancia y disfruto el voleibol y el taekwondo. Ese lado creativo importa en mi trabajo de ingeniería: me importa construir productos técnicamente sólidos, usables y diseñados con cuidado.",
        "contact.eyebrow": "Contacto",
        "contact.title": "Construyamos algo técnicamente sólido y de verdad útil.",
        "contact.body": "Estoy abierto a proyectos de software, colaboración en ingeniería y conversaciones sobre sistemas, web, móvil, bases de datos, redes y trabajo de producto aplicado.",
        "footer.built": "Hecho para GitHub Pages.",
        "footer.top": "Volver arriba",
        "redirect.title": "Redirigiendo al portafolio de Ivan Sardon",
        "redirect.projects": "Esta página ahora está en <a href=\"index.html#projects\">la sección de proyectos del portafolio</a>.",
        "redirect.contact": "Esta página ahora está en <a href=\"index.html#contact\">la sección de contacto del portafolio</a>.",
        "redirect.about": "Esta página ahora está en <a href=\"index.html#about\">la sección sobre mí del portafolio</a>.",
        "redirect.home": "Esta página ahora está en <a href=\"index.html\">la página principal del portafolio</a>.",
        "redirect.expertise": "Esta página ahora está en <a href=\"index.html#expertise\">la sección de experiencia del portafolio</a>."
    }
};

const knows = {
    en: [
        "Software Engineering",
        "Database Systems",
        "Networking",
        "UNIX Tools",
        "Web Development",
        "Mobile Development",
        "Low-level Data Structures"
    ],
    pt: [
        "Engenharia de software",
        "Sistemas de banco de dados",
        "Redes",
        "Ferramentas UNIX",
        "Desenvolvimento web",
        "Desenvolvimento mobile",
        "Estruturas de dados de baixo nível"
    ],
    es: [
        "Ingeniería de software",
        "Sistemas de bases de datos",
        "Redes",
        "Herramientas UNIX",
        "Desarrollo web",
        "Desarrollo móvil",
        "Estructuras de datos de bajo nivel"
    ]
};

function languageBase(tag) {
    const base = String(tag || "").toLowerCase().split("-")[0];
    return SITE_LANGS.includes(base) ? base : "";
}

function languageFromList(list) {
    const values = Array.isArray(list) ? list : [list];
    for (const tag of values) {
        const base = languageBase(tag);
        if (base) {
            return base;
        }
    }
    return "en";
}

function readSavedLanguage() {
    try {
        const saved = localStorage.getItem(SITE_LANG_KEY) || "";
        return SITE_LANGS.includes(saved) ? saved : "";
    } catch (error) {
        return "";
    }
}

function languageFromUrl() {
    const value = new URLSearchParams(window.location.search).get("lang") || "";
    return SITE_LANGS.includes(value) ? value : "";
}

function startingLanguage() {
    return readSavedLanguage() || languageFromUrl() || languageFromList(navigator.languages || [navigator.language]);
}

let current = "en";

function text(key) {
    const translated = copy[current] && copy[current][key];
    if (typeof translated === "string") {
        return translated;
    }
    const fallback = copy.en[key];
    return typeof fallback === "string" ? fallback : key;
}

function applyLanguage() {
    document.documentElement.lang = current;

    document.querySelectorAll("[data-i18n]").forEach((node) => {
        const owner = node.closest("[aria-expanded]");
        const expanded = node.dataset.i18nExpanded && owner && owner.getAttribute("aria-expanded") === "true";
        node.textContent = text(expanded ? node.dataset.i18nExpanded : node.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
        node.innerHTML = text(node.dataset.i18nHtml);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
        node.setAttribute("aria-label", text(node.dataset.i18nAria));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
        node.alt = text(node.dataset.i18nAlt);
    });

    document.querySelectorAll("[data-i18n-content]").forEach((node) => {
        node.setAttribute("content", text(node.dataset.i18nContent));
    });

    document.querySelectorAll("[data-set-lang]").forEach((button) => {
        const selected = button.dataset.setLang === current;
        button.setAttribute("aria-checked", selected ? "true" : "false");
        button.tabIndex = selected ? 0 : -1;
    });

    const personData = document.getElementById("person-data");
    if (personData) {
        try {
            const data = JSON.parse(personData.textContent);
            data.jobTitle = text("meta.jobTitle");
            data.birthPlace = text("meta.birthPlace");
            data.knowsAbout = knows[current] || knows.en;
            personData.textContent = JSON.stringify(data, null, 4);
        } catch (error) {
            personData.dataset.langError = "invalid-json";
        }
    }
}

function setLanguage(next, persist) {
    if (!SITE_LANGS.includes(next)) {
        return;
    }

    const changed = next !== current;
    current = next;

    if (persist) {
        try {
            localStorage.setItem(SITE_LANG_KEY, next);
        } catch (error) {
            /* The page still switches for this visit when storage is blocked. */
        }
    }

    applyLanguage();

    if (persist && changed) {
        const status = document.querySelector("[data-lang-status]");
        if (status) {
            status.textContent = text("lang.changed");
        }
    }

    if (window.ScrollTrigger) {
        window.requestAnimationFrame(() => {
            window.ScrollTrigger.refresh();
        });
    }
}

function bindLanguageSwitch() {
    const group = document.querySelector(".lang-switch");
    if (!group) {
        return;
    }

    group.addEventListener("click", (event) => {
        const button = event.target.closest("[data-set-lang]");
        if (!button || !group.contains(button)) {
            return;
        }
        setLanguage(button.dataset.setLang, true);
    });

    group.addEventListener("keydown", (event) => {
        const order = SITE_LANGS;
        const index = order.indexOf(current);
        let nextIndex = index;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            nextIndex = (index + 1) % order.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            nextIndex = (index - 1 + order.length) % order.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = order.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        setLanguage(order[nextIndex], true);
        const nextButton = group.querySelector(`[data-set-lang="${order[nextIndex]}"]`);
        if (nextButton) {
            nextButton.focus();
        }
    });
}

function reportMissingCopy() {
    const gaps = [];
    const englishKeys = Object.keys(copy.en);

    SITE_LANGS.forEach((lang) => {
        englishKeys.forEach((key) => {
            if (typeof copy[lang][key] !== "string" || !copy[lang][key].trim()) {
                gaps.push(`${lang}:${key}`);
            }
        });
        Object.keys(copy[lang]).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(copy.en, key)) {
                gaps.push(`extra ${lang}:${key}`);
            }
        });
        if (!Array.isArray(knows[lang]) || knows[lang].length !== knows.en.length) {
            gaps.push(`${lang}:knows`);
        }
    });

    if (gaps.length) {
        console.warn("Missing translations", gaps);
    }
}

reportMissingCopy();
setLanguage(startingLanguage(), false);
bindLanguageSwitch();

window.siteI18n = {
    get lang() {
        return current;
    },
    t: text,
    set: (lang) => setLanguage(lang, true),
    apply: applyLanguage
};
