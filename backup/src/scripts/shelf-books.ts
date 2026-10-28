export const SHELF_LANGS = ["en", "pt", "es"] as const;
export type ShelfLang = (typeof SHELF_LANGS)[number];

export const SHELF_TAGS = [
    "networks",
    "backend",
    "mobile",
    "web",
    "graphics",
    "games",
    "models",
    "systems",
    "security"
] as const;
export type ShelfTag = (typeof SHELF_TAGS)[number];

export type ShelfLayout =
    | "digit"
    | "mlp"
    | "emit"
    | "pace"
    | "shop"
    | "clip"
    | "term"
    | "manual"
    | "ledger"
    | "news"
    | "cube"
    | "neon"
    | "myth"
    | "tank"
    | "poster";

export interface ShelfCopy {
    title: string;
    kicker: string;
    deck: string;
    note: string;
    eyebrow: string;
    spine: string;
}

export interface ShelfRepo {
    label: string;
    href: string;
}

export interface ShelfBook {
    id: string;
    tag: ShelfTag;
    layout: ShelfLayout;
    font: string;
    bg: string;
    ink: string;
    muted: string;
    accent: string;
    /** Later, a demo screenshot path. Null keeps the typographic cover. */
    image: string | null;
    repos: ShelfRepo[];
    copy: Record<ShelfLang, ShelfCopy>;
}

const repo = (label: string): ShelfRepo => ({
    label,
    href: `https://github.com/mativan15/${label}`
});

const FRAUNCES = '"Fraunces", Georgia, serif';
const PLEX = '"IBM Plex Mono", ui-monospace, monospace';
const SHARE = '"Share Tech Mono", ui-monospace, monospace';
const NEWS = '"Newsreader", Georgia, serif';
const NARROW = '"Archivo Narrow", "Arial Narrow", sans-serif';
const BASKER = '"Libre Baskerville", Georgia, serif';
const OUTFIT = '"Outfit", ui-sans-serif, sans-serif';
const SOURCE = '"Source Serif 4", Georgia, serif';
const CORMORANT = '"Cormorant Garamond", Georgia, serif';
const BEBAS = '"Bebas Neue", Impact, sans-serif';
const CINZEL = '"Cinzel", Georgia, serif';
const ORBITRON = '"Orbitron", sans-serif';
const OPS = '"Black Ops One", Impact, sans-serif';

interface Line {
    title: string;
    kicker: string;
    deck: string;
    note: string;
    eyebrow: string;
    spine: string;
}

function book(spec: {
    id: string;
    tag: ShelfTag;
    layout: ShelfLayout;
    font: string;
    bg: string;
    ink: string;
    muted: string;
    accent: string;
    repos: string[];
    en: Line;
    pt: Line;
    es: Line;
}): ShelfBook {
    return {
        id: spec.id,
        tag: spec.tag,
        layout: spec.layout,
        font: spec.font,
        bg: spec.bg,
        ink: spec.ink,
        muted: spec.muted,
        accent: spec.accent,
        image: null,
        repos: spec.repos.map(repo),
        copy: { en: spec.en, pt: spec.pt, es: spec.es }
    };
}

export function shelfLanguage(value: string | undefined): ShelfLang {
    return value === "pt" || value === "es" ? value : "en";
}

/**
 * One book per public repository.
 * Three pairs are grouped because they are the same program on two machines:
 * the MLP on CUDA and Metal, the catalog on Windows and macOS, and the two Clipboard ProMax repos.
 * proyectoDB is absent: the GitHub API returns 404 for it.
 */
export const SHELF_BOOKS: readonly ShelfBook[] = [
    book({
        id: "digits",
        tag: "models",
        layout: "digit",
        font: FRAUNCES,
        bg: "#f3ecdf",
        ink: "#221e18",
        muted: "#6d665c",
        accent: "#8c3a2f",
        repos: ["TransformerMNIST"],
        en: { title: "Digits", kicker: "C++17 · CUDA", deck: "by hand", note: "A small vision transformer in C++17 that trains on MNIST and reads a photo of one digit. One build runs on the CPU. The CUDA build keeps the data and the weights on the GPU.", eyebrow: "Transformer MNIST", spine: "Digits" },
        pt: { title: "Dígitos", kicker: "C++17 · CUDA", deck: "à mão", note: "Vision transformer pequeno em C++17 que treina no MNIST e lê a foto de um dígito. Uma compilação roda na CPU. A compilação CUDA mantém os dados e os pesos na GPU.", eyebrow: "Transformer MNIST", spine: "Dígitos" },
        es: { title: "Dígitos", kicker: "C++17 · CUDA", deck: "a mano", note: "Un vision transformer pequeño en C++17 que entrena con MNIST y lee la foto de un dígito. Una compilación corre en la CPU. La compilación CUDA mantiene los datos y los pesos en la GPU.", eyebrow: "Transformer MNIST", spine: "Dígitos" }
    }),
    book({
        id: "mlp",
        tag: "models",
        layout: "mlp",
        font: PLEX,
        bg: "#17191c",
        ink: "#e7d3c4",
        muted: "#8d8278",
        accent: "#d4845a",
        repos: ["MLP-MNIST-CUDA", "MLP-MNIST-Metal"],
        en: { title: "MLP", kicker: "CUDA · Metal", deck: "digit network", note: "A multilayer network for MNIST digits: 784 inputs, then 512, 256, 128, 64, and 10 scores. MLP-MNIST-CUDA is the NVIDIA build. MLP-MNIST-Metal is the same kind of network for Apple GPUs.", eyebrow: "Multilayer network", spine: "MLP" },
        pt: { title: "MLP", kicker: "CUDA · Metal", deck: "rede de dígitos", note: "Rede para dígitos do MNIST: 784 entradas, depois 512, 256, 128, 64 e 10 pontuações. MLP-MNIST-CUDA é a versão NVIDIA. MLP-MNIST-Metal é a versão para GPUs da Apple.", eyebrow: "Rede multicamada", spine: "MLP" },
        es: { title: "MLP", kicker: "CUDA · Metal", deck: "red de dígitos", note: "Red para dígitos de MNIST: 784 entradas, luego 512, 256, 128, 64 y 10 puntajes. MLP-MNIST-CUDA es la versión NVIDIA. MLP-MNIST-Metal es la versión para GPUs de Apple.", eyebrow: "Red multicapa", spine: "MLP" }
    }),
    book({
        id: "perceptron",
        tag: "models",
        layout: "poster",
        font: PLEX,
        bg: "#241816",
        ink: "#f0d7cc",
        muted: "#b89286",
        accent: "#e07a5f",
        repos: ["Perceptron-MNIST-Metal"],
        en: { title: "Perceptron", kicker: "Metal", deck: "one layer", note: "A perceptron for MNIST digits, in Objective-C++, aimed at Apple GPUs. It is a smaller model than the multilayer network.", eyebrow: "MNIST", spine: "Perceptron" },
        pt: { title: "Perceptron", kicker: "Metal", deck: "uma camada", note: "Um perceptron para dígitos do MNIST, em Objective-C++, para GPUs da Apple. É um modelo menor que a rede multicamada.", eyebrow: "MNIST", spine: "Perceptron" },
        es: { title: "Perceptrón", kicker: "Metal", deck: "una capa", note: "Un perceptrón para dígitos de MNIST, en Objective-C++, para GPUs de Apple. Es un modelo más chico que la red multicapa.", eyebrow: "MNIST", spine: "Perceptrón" }
    }),
    book({
        id: "python-digits",
        tag: "models",
        layout: "manual",
        font: SOURCE,
        bg: "#f7f1e4",
        ink: "#1c2430",
        muted: "#3d4a5c",
        accent: "#1c2430",
        repos: ["MLP-Digit_Identifier-Python"],
        en: { title: "Python", kicker: "MNIST", deck: "digit identifier", note: "A Python program that identifies handwritten digits. It is a separate repository from the C++ and GPU builds.", eyebrow: "Python", spine: "Python" },
        pt: { title: "Python", kicker: "MNIST", deck: "identifica o dígito", note: "Um programa em Python que identifica dígitos manuscritos. É um repositório à parte das versões em C++ e nas GPUs.", eyebrow: "Python", spine: "Python" },
        es: { title: "Python", kicker: "MNIST", deck: "identifica el dígito", note: "Un programa en Python que identifica dígitos manuscritos. Es un repositorio aparte de las versiones en C++ y en GPU.", eyebrow: "Python", spine: "Python" }
    }),
    book({
        id: "emit",
        tag: "mobile",
        layout: "emit",
        font: NARROW,
        bg: "#1c463c",
        ink: "#f0e6d2",
        muted: "#d7c7a4",
        accent: "#d7b56a",
        repos: ["app_emit-SpaceApps2023"],
        en: { title: "EMIT", kicker: "Space Apps 2023", deck: "five cities", note: "An app about minerals and methane in the air over Arequipa, Lima, Trujillo, Piura, and Tacna. Built with AyniTech at NASA Space Apps 2023. Honorary mention and global top 100. It was not a global winner. Several screens in the prototype are still unfinished.", eyebrow: "AyniTech · NASA", spine: "EMIT" },
        pt: { title: "EMIT", kicker: "Space Apps 2023", deck: "cinco cidades", note: "App sobre minerais e metano no ar de Arequipa, Lima, Trujillo, Piura e Tacna. Feito com a AyniTech no NASA Space Apps 2023. Menção honrosa e top 100 global. Não foi vencedor global. Várias telas do protótipo ainda estão incompletas.", eyebrow: "AyniTech · NASA", spine: "EMIT" },
        es: { title: "EMIT", kicker: "Space Apps 2023", deck: "cinco ciudades", note: "App sobre minerales y metano en el aire de Arequipa, Lima, Trujillo, Piura y Tacna. Hecho con AyniTech en NASA Space Apps 2023. Mención honorífica y top 100 global. No fue ganador global. Varias pantallas del prototipo siguen incompletas.", eyebrow: "AyniTech · NASA", spine: "EMIT" }
    }),
    book({
        id: "pace",
        tag: "mobile",
        layout: "pace",
        font: NEWS,
        bg: "#0b2740",
        ink: "#e7f1f4",
        muted: "#b7d0d4",
        accent: "#9fd0d6",
        repos: ["PACE-ocean_NASA-space-apps"],
        en: { title: "PACE", kicker: "NASA", deck: "the ocean mission", note: "A Flutter prototype for learning about the PACE mission, from the same challenge. Several screens are still unfinished.", eyebrow: "Flutter prototype", spine: "PACE" },
        pt: { title: "PACE", kicker: "NASA", deck: "a missão no oceano", note: "Protótipo em Flutter para aprender a missão PACE, do mesmo desafio. Várias telas ainda estão incompletas.", eyebrow: "Protótipo Flutter", spine: "PACE" },
        es: { title: "PACE", kicker: "NASA", deck: "la misión en el océano", note: "Prototipo en Flutter para aprender la misión PACE, del mismo desafío. Varias pantallas siguen incompletas.", eyebrow: "Prototipo Flutter", spine: "PACE" }
    }),
    book({
        id: "original",
        tag: "mobile",
        layout: "shop",
        font: BASKER,
        bg: "#f7f1e6",
        ink: "#6e2e24",
        muted: "#8a5348",
        accent: "#6e2e24",
        repos: ["app_LaOriginalDistribuidora"],
        en: { title: "Original", kicker: "La", deck: "Distribuidora", note: "A Flutter app for La Original Distribuidora: inventory, statistics, and order notes.", eyebrow: "Flutter", spine: "Original" },
        pt: { title: "Original", kicker: "La", deck: "Distribuidora", note: "App em Flutter da La Original Distribuidora: estoque, estatísticas e notas de pedido.", eyebrow: "Flutter", spine: "Original" },
        es: { title: "Original", kicker: "La", deck: "Distribuidora", note: "App en Flutter de La Original Distribuidora: inventario, estadísticas y notas de pedido.", eyebrow: "Flutter", spine: "Original" }
    }),
    book({
        id: "clipboard",
        tag: "mobile",
        layout: "clip",
        font: OUTFIT,
        bg: "#f3f3f5",
        ink: "#1c1c1e",
        muted: "#6e6e73",
        accent: "#1c1c1e",
        repos: ["Clipboard-ProMax", "ios-clipboard-promax"],
        en: { title: "Clipboard", kicker: "Swift", deck: "ProMax", note: "An iOS clipboard app in Swift. Clipboard-ProMax is the larger repository. ios-clipboard-promax is a second repository of the same app.", eyebrow: "iOS", spine: "Clipboard" },
        pt: { title: "Clipboard", kicker: "Swift", deck: "ProMax", note: "App de área de transferência para iOS, em Swift. Clipboard-ProMax é o repositório maior. ios-clipboard-promax é um segundo repositório do mesmo app.", eyebrow: "iOS", spine: "Clipboard" },
        es: { title: "Clipboard", kicker: "Swift", deck: "ProMax", note: "App de portapapeles para iOS, en Swift. Clipboard-ProMax es el repositorio más grande. ios-clipboard-promax es un segundo repositorio de la misma app.", eyebrow: "iOS", spine: "Clipboard" }
    }),
    book({
        id: "ports",
        tag: "networks",
        layout: "term",
        font: SHARE,
        bg: "#0c120e",
        ink: "#c8f5b4",
        muted: "#7d9a72",
        accent: "#7dff57",
        repos: ["TCP-scanner"],
        en: { title: "PORTS", kicker: "TCP", deck: "open\nclosed\nfiltered", note: "A C program. It takes a host and a range of ports and marks each one open, closed, or filtered.", eyebrow: "C", spine: "Ports" },
        pt: { title: "PORTAS", kicker: "TCP", deck: "aberta\nfechada\nfiltrada", note: "Programa em C. Recebe um host e um intervalo de portas e marca cada uma como aberta, fechada ou filtrada.", eyebrow: "C", spine: "Portas" },
        es: { title: "PUERTOS", kicker: "TCP", deck: "abierto\ncerrado\nfiltrado", note: "Programa en C. Recibe un host y un rango de puertos y marca cada uno como abierto, cerrado o filtrado.", eyebrow: "C", spine: "Puertos" }
    }),
    book({
        id: "udp",
        tag: "networks",
        layout: "term",
        font: PLEX,
        bg: "#10141c",
        ink: "#d5e2ff",
        muted: "#8ea0c4",
        accent: "#8eb6ff",
        repos: ["routerUDP"],
        en: { title: "UDP", kicker: "C++", deck: "client and server", note: "A UDP client and server in C++, with a protocol header.", eyebrow: "C++", spine: "UDP" },
        pt: { title: "UDP", kicker: "C++", deck: "cliente e servidor", note: "Um cliente e um servidor UDP em C++, com um cabeçalho de protocolo.", eyebrow: "C++", spine: "UDP" },
        es: { title: "UDP", kicker: "C++", deck: "cliente y servidor", note: "Un cliente y un servidor UDP en C++, con un encabezado de protocolo.", eyebrow: "C++", spine: "UDP" }
    }),
    book({
        id: "tcp-pair",
        tag: "networks",
        layout: "poster",
        font: NARROW,
        bg: "#14202a",
        ink: "#e7eef2",
        muted: "#9db4c2",
        accent: "#d7e6ee",
        repos: ["cpp-tcp-client-server-router"],
        en: { title: "TCP", kicker: "C++", deck: "client and server", note: "A C++ client and server. The repository name also says router. The folders in the root are client and server.", eyebrow: "Sockets", spine: "TCP" },
        pt: { title: "TCP", kicker: "C++", deck: "cliente e servidor", note: "Um cliente e um servidor em C++. O nome do repositório também fala em roteador. As pastas na raiz são client e server.", eyebrow: "Sockets", spine: "TCP" },
        es: { title: "TCP", kicker: "C++", deck: "cliente y servidor", note: "Un cliente y un servidor en C++. El nombre del repositorio también habla de un router. Las carpetas en la raíz son client y server.", eyebrow: "Sockets", spine: "TCP" }
    }),
    book({
        id: "balancer",
        tag: "networks",
        layout: "poster",
        font: OUTFIT,
        bg: "#1c2428",
        ink: "#e4eef0",
        muted: "#93a8ad",
        accent: "#9fd0c8",
        repos: ["adaptative-http-load-balancer"],
        en: { title: "Balance", kicker: "Go", deck: "HTTP load", note: "An HTTP load balancer in Go. The repository includes tests and a course rubric.", eyebrow: "Go", spine: "Balance" },
        pt: { title: "Carga", kicker: "Go", deck: "HTTP", note: "Um balanceador de carga HTTP em Go. O repositório inclui testes e uma rubrica de curso.", eyebrow: "Go", spine: "Carga" },
        es: { title: "Carga", kicker: "Go", deck: "HTTP", note: "Un balanceador de carga HTTP en Go. El repositorio incluye tests y una rúbrica de curso.", eyebrow: "Go", spine: "Carga" }
    }),
    book({
        id: "logs",
        tag: "systems",
        layout: "manual",
        font: SOURCE,
        bg: "#f3e7c4",
        ink: "#1a1a1a",
        muted: "#3f3a32",
        accent: "#1a1a1a",
        repos: ["log-parser-UNIX"],
        en: { title: "Logs", kicker: "Unix", deck: "the lines that repeat", note: "A C program. It opens a Unix install log, separates the process name from the message, counts the phrases, and prints the most common ones.", eyebrow: "C", spine: "Logs" },
        pt: { title: "Logs", kicker: "Unix", deck: "as frases que se repetem", note: "Programa em C. Abre um log de instalação do Unix, separa o nome do processo da mensagem, conta as frases e imprime as mais comuns.", eyebrow: "C", spine: "Logs" },
        es: { title: "Logs", kicker: "Unix", deck: "las frases que se repiten", note: "Programa en C. Abre un log de instalación de Unix, separa el nombre del proceso del mensaje, cuenta las frases e imprime las más comunes.", eyebrow: "C", spine: "Logs" }
    }),
    book({
        id: "catalog",
        tag: "systems",
        layout: "ledger",
        font: CORMORANT,
        bg: "#fbf6ea",
        ink: "#1e2a44",
        muted: "#5c6578",
        accent: "#1e2a44",
        repos: ["database_windows", "database_macOS"],
        en: { title: "Catalog", kicker: "C++", deck: "receipts and orders", note: "A C++ program with a catalog, products, orders, receipts, and invoices. The Windows repository is the larger one. The macOS repository has the same kinds of files.", eyebrow: "Windows and macOS", spine: "Catalog" },
        pt: { title: "Catálogo", kicker: "C++", deck: "boletas e pedidos", note: "Programa em C++ com catálogo, produtos, pedidos, boletas e faturas. A versão Windows é a maior. A de macOS tem os mesmos tipos de arquivo.", eyebrow: "Windows e macOS", spine: "Catálogo" },
        es: { title: "Catálogo", kicker: "C++", deck: "boletas y pedidos", note: "Programa en C++ con catálogo, productos, pedidos, boletas y facturas. La versión Windows es la más grande. La de macOS tiene los mismos tipos de archivo.", eyebrow: "Windows y macOS", spine: "Catálogo" }
    }),
    book({
        id: "cc2",
        tag: "systems",
        layout: "poster",
        font: NARROW,
        bg: "#20262b",
        ink: "#e6ece8",
        muted: "#9aa8a4",
        accent: "#c8a96b",
        repos: ["TareasCC_II"],
        en: { title: "CC II", kicker: "C++", deck: "seven exercises", note: "Course homework for Computer Science II. The repository is seven folders, Ej1 through Ej7.", eyebrow: "Coursework", spine: "CC II" },
        pt: { title: "CC II", kicker: "C++", deck: "sete exercícios", note: "Tarefas de Ciência da Computação II. O repositório tem sete pastas, Ej1 até Ej7.", eyebrow: "Curso", spine: "CC II" },
        es: { title: "CC II", kicker: "C++", deck: "siete ejercicios", note: "Tareas de Ciencia de la Computación II. El repositorio tiene siete carpetas, Ej1 a Ej7.", eyebrow: "Curso", spine: "CC II" }
    }),
    book({
        id: "ada",
        tag: "systems",
        layout: "news",
        font: BEBAS,
        bg: "#f4f0e6",
        ink: "#1a1a1a",
        muted: "#1a1a1a",
        accent: "#9a3412",
        repos: ["tareasADA"],
        en: { title: "ADA", kicker: "C++", deck: "greedy algorithms and Prim", note: "Algorithm exercises in C++. The file names cover planning, Prim, and greedy algorithms.", eyebrow: "Algorithms", spine: "ADA" },
        pt: { title: "ADA", kicker: "C++", deck: "gulosos e Prim", note: "Exercícios de algoritmos em C++. Os nomes dos arquivos cobrem planejamento, Prim e algoritmos gulosos.", eyebrow: "Algoritmos", spine: "ADA" },
        es: { title: "ADA", kicker: "C++", deck: "voraces y Prim", note: "Ejercicios de algoritmos en C++. Los nombres de los archivos cubren planificación, Prim y algoritmos voraces.", eyebrow: "Algoritmos", spine: "ADA" }
    }),
    book({
        id: "binary",
        tag: "systems",
        layout: "term",
        font: SHARE,
        bg: "#12110f",
        ink: "#f0e2c4",
        muted: "#b5a484",
        accent: "#e2c27a",
        repos: ["BinMulti"],
        en: { title: "BINARY", kicker: "C++", deck: "main.cpp · multi.h", note: "A C++ program. The central files are main.cpp and multi.h. The repository name is BinMulti.", eyebrow: "C++", spine: "Binary" },
        pt: { title: "BINÁRIO", kicker: "C++", deck: "main.cpp · multi.h", note: "Um programa em C++. Os arquivos centrais são main.cpp e multi.h. O repositório se chama BinMulti.", eyebrow: "C++", spine: "Binário" },
        es: { title: "BINARIO", kicker: "C++", deck: "main.cpp · multi.h", note: "Un programa en C++. Los archivos centrales son main.cpp y multi.h. El repositorio se llama BinMulti.", eyebrow: "C++", spine: "Binario" }
    }),
    book({
        id: "various",
        tag: "systems",
        layout: "ledger",
        font: CORMORANT,
        bg: "#e7efe6",
        ink: "#1c2a22",
        muted: "#4d6156",
        accent: "#1c2a22",
        repos: ["Proyectos-varios-CCOMP"],
        en: { title: "Various", kicker: "CCOMP", deck: "twelve course projects", note: "Twelve course projects, in folders Project_0001 through Project_0012.", eyebrow: "Coursework", spine: "Various" },
        pt: { title: "Vários", kicker: "CCOMP", deck: "doze projetos de curso", note: "Doze projetos de curso, nas pastas Project_0001 até Project_0012.", eyebrow: "Curso", spine: "Vários" },
        es: { title: "Varios", kicker: "CCOMP", deck: "doce proyectos de curso", note: "Doce proyectos de curso, en las carpetas Project_0001 a Project_0012.", eyebrow: "Curso", spine: "Varios" }
    }),
    book({
        id: "format",
        tag: "systems",
        layout: "poster",
        font: OUTFIT,
        bg: "#f6f3ee",
        ink: "#241c16",
        muted: "#6d6258",
        accent: "#241c16",
        repos: ["formatpipe"],
        en: { title: "Format", kicker: "Python", deck: "a course pipeline", note: "A Python program. The repository includes tests and a course rubric.", eyebrow: "Python", spine: "Format" },
        pt: { title: "Formato", kicker: "Python", deck: "um pipeline de curso", note: "Um programa em Python. O repositório inclui testes e uma rubrica de curso.", eyebrow: "Python", spine: "Formato" },
        es: { title: "Formato", kicker: "Python", deck: "un pipeline de curso", note: "Un programa en Python. El repositorio incluye tests y una rúbrica de curso.", eyebrow: "Python", spine: "Formato" }
    }),
    book({
        id: "scan-cli",
        tag: "systems",
        layout: "term",
        font: PLEX,
        bg: "#0e1412",
        ink: "#d7f5df",
        muted: "#86a892",
        accent: "#b6f0c4",
        repos: ["fcgscan-cli"],
        en: { title: "SCAN", kicker: "JavaScript", deck: "command line", note: "A command-line program in JavaScript. The repository includes tests and a course rubric. I am not calling it a network scanner: the files do not say that.", eyebrow: "CLI", spine: "Scan" },
        pt: { title: "SCAN", kicker: "JavaScript", deck: "linha de comando", note: "Um programa de linha de comando em JavaScript. O repositório inclui testes e uma rubrica de curso. Não chamo de scanner de rede: os arquivos não dizem isso.", eyebrow: "CLI", spine: "Scan" },
        es: { title: "SCAN", kicker: "JavaScript", deck: "línea de comando", note: "Un programa de línea de comando en JavaScript. El repositorio incluye tests y una rúbrica de curso. No lo llamo escáner de red: los archivos no dicen eso.", eyebrow: "CLI", spine: "Scan" }
    }),
    book({
        id: "mixed",
        tag: "systems",
        layout: "poster",
        font: NARROW,
        bg: "#2a2420",
        ink: "#f3ebe3",
        muted: "#c4b4a6",
        accent: "#e7d3c0",
        repos: ["mixed-stack-rc2"],
        en: { title: "Stack", kicker: "Course", deck: "an app folder", note: "A course delivery. The main folder is an app, and the repository includes a validation script.", eyebrow: "Coursework", spine: "Stack" },
        pt: { title: "Pilha", kicker: "Curso", deck: "uma pasta de app", note: "Uma entrega de curso. A pasta principal é um app, e o repositório inclui um script de validação.", eyebrow: "Curso", spine: "Pilha" },
        es: { title: "Pila", kicker: "Curso", deck: "una carpeta de app", note: "Una entrega de curso. La carpeta principal es una app, y el repositorio incluye un script de validación.", eyebrow: "Curso", spine: "Pila" }
    }),
    book({
        id: "rust-rc",
        tag: "systems",
        layout: "myth",
        font: CINZEL,
        bg: "#1a1614",
        ink: "#f0e6d4",
        muted: "#cbbba4",
        accent: "#d4b483",
        repos: ["rc5-course-rubric-deliverable"],
        en: { title: "Rust", kicker: "Course", deck: "tests and a rubric", note: "A Rust course delivery. The repository has a Docker setup, tests, and a rubric.", eyebrow: "Rust", spine: "Rust" },
        pt: { title: "Rust", kicker: "Curso", deck: "testes e rubrica", note: "Uma entrega de curso em Rust. O repositório tem Docker, testes e uma rubrica.", eyebrow: "Rust", spine: "Rust" },
        es: { title: "Rust", kicker: "Curso", deck: "tests y rúbrica", note: "Una entrega de curso en Rust. El repositorio tiene Docker, tests y una rúbrica.", eyebrow: "Rust", spine: "Rust" }
    }),
    book({
        id: "topics",
        tag: "backend",
        layout: "news",
        font: BEBAS,
        bg: "#f6f3ec",
        ink: "#141414",
        muted: "#141414",
        accent: "#c1121f",
        repos: ["TrendingTopicsAnalyzer"],
        en: { title: "Topics", kicker: "EDA", deck: "Space-Saving, on a stream of documents.", note: "A final project for a data-structures course. The C++ backend summarizes a stream of documents with the Space-Saving algorithm. The frontend is Flask.", eyebrow: "C++ and Flask", spine: "Topics" },
        pt: { title: "Tópicos", kicker: "EDA", deck: "Space-Saving, num fluxo de documentos.", note: "Projeto final de EDA. O backend em C++ resume um fluxo de documentos com o algoritmo Space-Saving. O frontend é Flask.", eyebrow: "C++ e Flask", spine: "Tópicos" },
        es: { title: "Tópicos", kicker: "EDA", deck: "Space-Saving, en un flujo de documentos.", note: "Proyecto final de EDA. El backend en C++ resume un flujo de documentos con el algoritmo Space-Saving. El frontend es Flask.", eyebrow: "C++ y Flask", spine: "Tópicos" }
    }),
    book({
        id: "learning",
        tag: "backend",
        layout: "poster",
        font: NEWS,
        bg: "#f4efe4",
        ink: "#243044",
        muted: "#5c6b80",
        accent: "#243044",
        repos: ["learning-app"],
        en: { title: "Learn", kicker: "TypeScript", deck: "a course app", note: "A TypeScript app. The repository includes a course rubric.", eyebrow: "TypeScript", spine: "Learn" },
        pt: { title: "Aprender", kicker: "TypeScript", deck: "um app de curso", note: "Um app em TypeScript. O repositório inclui uma rubrica de curso.", eyebrow: "TypeScript", spine: "Aprender" },
        es: { title: "Aprender", kicker: "TypeScript", deck: "una app de curso", note: "Una app en TypeScript. El repositorio incluye una rúbrica de curso.", eyebrow: "TypeScript", spine: "Aprender" }
    }),
    book({
        id: "playlists",
        tag: "backend",
        layout: "myth",
        font: FRAUNCES,
        bg: "#1a1020",
        ink: "#f6e9f2",
        muted: "#c9aec4",
        accent: "#e7b3d4",
        repos: ["music-playlist-platform"],
        en: { title: "Playlists", kicker: "Python", deck: "a course platform", note: "A playlist platform in Python. The repository includes a course rubric.", eyebrow: "Python", spine: "Playlists" },
        pt: { title: "Playlists", kicker: "Python", deck: "uma plataforma de curso", note: "Uma plataforma de playlists em Python. O repositório inclui uma rubrica de curso.", eyebrow: "Python", spine: "Playlists" },
        es: { title: "Playlists", kicker: "Python", deck: "una plataforma de curso", note: "Una plataforma de playlists en Python. El repositorio incluye una rúbrica de curso.", eyebrow: "Python", spine: "Playlists" }
    }),
    book({
        id: "fitness",
        tag: "backend",
        layout: "poster",
        font: OUTFIT,
        bg: "#123028",
        ink: "#e7f6ee",
        muted: "#9ec8b4",
        accent: "#b7ebc8",
        repos: ["fitness-member-portal"],
        en: { title: "Gym", kicker: "Portal", deck: "frontend and backend", note: "A gym member portal. The repository has a frontend and a backend, plus a course rubric.", eyebrow: "Full stack", spine: "Gym" },
        pt: { title: "Academia", kicker: "Portal", deck: "frontend e backend", note: "Um portal de academia. O repositório tem frontend e backend, e uma rubrica de curso.", eyebrow: "Full stack", spine: "Academia" },
        es: { title: "Gimnasio", kicker: "Portal", deck: "frontend y backend", note: "Un portal de gimnasio. El repositorio tiene frontend y backend, y una rúbrica de curso.", eyebrow: "Full stack", spine: "Gimnasio" }
    }),
    book({
        id: "fundraising",
        tag: "backend",
        layout: "shop",
        font: BASKER,
        bg: "#f8f1e4",
        ink: "#6a2e2a",
        muted: "#8d5a52",
        accent: "#6a2e2a",
        repos: ["fundraising-platform"],
        en: { title: "Funds", kicker: "Python", deck: "a course platform", note: "A fundraising platform in Python. The repository includes a course rubric.", eyebrow: "Python", spine: "Funds" },
        pt: { title: "Doações", kicker: "Python", deck: "uma plataforma de curso", note: "Uma plataforma de arrecadação em Python. O repositório inclui uma rubrica de curso.", eyebrow: "Python", spine: "Doações" },
        es: { title: "Donaciones", kicker: "Python", deck: "una plataforma de curso", note: "Una plataforma de recaudación en Python. El repositorio incluye una rúbrica de curso.", eyebrow: "Python", spine: "Donaciones" }
    }),
    book({
        id: "cowork",
        tag: "backend",
        layout: "poster",
        font: NARROW,
        bg: "#1e2a33",
        ink: "#e7eef3",
        muted: "#a9bdc8",
        accent: "#f0d7a4",
        repos: ["rc1-coworking-app"],
        en: { title: "Cowork", kicker: "TypeScript", deck: "space management", note: "A coworking-space management app. The repository includes a course prompt and a rubric.", eyebrow: "TypeScript", spine: "Cowork" },
        pt: { title: "Cowork", kicker: "TypeScript", deck: "gestão do espaço", note: "Um app de gestão de coworking. O repositório inclui um enunciado de curso e uma rubrica.", eyebrow: "TypeScript", spine: "Cowork" },
        es: { title: "Cowork", kicker: "TypeScript", deck: "gestión del espacio", note: "Una app de gestión de coworking. El repositorio incluye un enunciado de curso y una rúbrica.", eyebrow: "TypeScript", spine: "Cowork" }
    }),
    book({
        id: "portfolio",
        tag: "web",
        layout: "poster",
        font: FRAUNCES,
        bg: "#141816",
        ink: "#f3ecdf",
        muted: "#b7c2b8",
        accent: "#e8a04a",
        repos: ["mativan15"],
        en: { title: "Portfolio", kicker: "This site", deck: "WebGL, then the shelf", note: "This website. The opening scene is WebGL. The shelf lists the repositories.", eyebrow: "TypeScript", spine: "Portfolio" },
        pt: { title: "Portfólio", kicker: "Este site", deck: "WebGL, depois a estante", note: "Este site. A cena de abertura é WebGL. A estante lista os repositórios.", eyebrow: "TypeScript", spine: "Portfólio" },
        es: { title: "Portafolio", kicker: "Este sitio", deck: "WebGL, luego la estantería", note: "Este sitio. La escena de apertura es WebGL. La estantería lista los repositorios.", eyebrow: "TypeScript", spine: "Portafolio" }
    }),
    book({
        id: "world",
        tag: "web",
        layout: "pace",
        font: NEWS,
        bg: "#12343a",
        ink: "#e7f4f2",
        muted: "#b7d5d0",
        accent: "#d8c07a",
        repos: ["AroundTheWorld_Website"],
        en: { title: "World", kicker: "Flask", deck: "pages and templates", note: "A Flask website, with static files and templates.", eyebrow: "Python", spine: "World" },
        pt: { title: "Mundo", kicker: "Flask", deck: "páginas e templates", note: "Um site em Flask, com arquivos estáticos e templates.", eyebrow: "Python", spine: "Mundo" },
        es: { title: "Mundo", kicker: "Flask", deck: "páginas y templates", note: "Un sitio en Flask, con archivos estáticos y templates.", eyebrow: "Python", spine: "Mundo" }
    }),
    book({
        id: "schedule",
        tag: "web",
        layout: "clip",
        font: OUTFIT,
        bg: "#f7f4ee",
        ink: "#1d2430",
        muted: "#5e6a7c",
        accent: "#1d2430",
        repos: ["horarioInteractivo"],
        en: { title: "Schedule", kicker: "HTML", deck: "installable page", note: "A schedule page. It includes a web app manifest and a service worker, so it can be installed on a phone.", eyebrow: "HTML", spine: "Schedule" },
        pt: { title: "Horário", kicker: "HTML", deck: "página instalável", note: "Uma página de horário. Tem um manifesto e um service worker, então dá para instalar no celular.", eyebrow: "HTML", spine: "Horário" },
        es: { title: "Horario", kicker: "HTML", deck: "página instalable", note: "Una página de horario. Tiene un manifiesto y un service worker, así que se puede instalar en el teléfono.", eyebrow: "HTML", spine: "Horario" }
    }),
    book({
        id: "cv",
        tag: "web",
        layout: "manual",
        font: SOURCE,
        bg: "#fbf7ef",
        ink: "#1a1a1a",
        muted: "#3c3c3c",
        accent: "#1a1a1a",
        repos: ["CV1_ejemplo"],
        en: { title: "Résumé", kicker: "HTML", deck: "one page", note: "A résumé page in HTML and CSS.", eyebrow: "HTML", spine: "Résumé" },
        pt: { title: "Currículo", kicker: "HTML", deck: "uma página", note: "Uma página de currículo em HTML e CSS.", eyebrow: "HTML", spine: "Currículo" },
        es: { title: "Currículum", kicker: "HTML", deck: "una página", note: "Una página de currículum en HTML y CSS.", eyebrow: "HTML", spine: "Currículum" }
    }),
    book({
        id: "form",
        tag: "web",
        layout: "ledger",
        font: CORMORANT,
        bg: "#f8f4ea",
        ink: "#243044",
        muted: "#5c6a7c",
        accent: "#243044",
        repos: ["DBP_projects"],
        en: { title: "Form", kicker: "PHP", deck: "a résumé form", note: "A résumé form in PHP, with a page that processes the submission.", eyebrow: "PHP", spine: "Form" },
        pt: { title: "Formulário", kicker: "PHP", deck: "um formulário de currículo", note: "Um formulário de currículo em PHP, com uma página que processa o envio.", eyebrow: "PHP", spine: "Formulário" },
        es: { title: "Formulario", kicker: "PHP", deck: "un formulario de currículum", note: "Un formulario de currículum en PHP, con una página que procesa el envío.", eyebrow: "PHP", spine: "Formulario" }
    }),
    book({
        id: "todos",
        tag: "web",
        layout: "clip",
        font: OUTFIT,
        bg: "#efeae2",
        ink: "#241e18",
        muted: "#6e6258",
        accent: "#241e18",
        repos: ["DBP_tareas"],
        en: { title: "Tasks", kicker: "HTML", deck: "a to-do list", note: "A to-do list page. The folder is named To-do list DBP.", eyebrow: "HTML", spine: "Tasks" },
        pt: { title: "Tarefas", kicker: "HTML", deck: "uma lista de afazeres", note: "Uma página de lista de afazeres. A pasta se chama To-do list DBP.", eyebrow: "HTML", spine: "Tarefas" },
        es: { title: "Tareas", kicker: "HTML", deck: "una lista de pendientes", note: "Una página de lista de pendientes. La carpeta se llama To-do list DBP.", eyebrow: "HTML", spine: "Tareas" }
    }),
    book({
        id: "flights",
        tag: "web",
        layout: "pace",
        font: NEWS,
        bg: "#10243a",
        ink: "#e7f1f8",
        muted: "#b7c9d8",
        accent: "#f0d7a4",
        repos: ["DB-PF"],
        en: { title: "Flights", kicker: "PHP", deck: "login and trips", note: "The final project for a databases course. The pages cover login, registration, and flights.", eyebrow: "Databases I", spine: "Flights" },
        pt: { title: "Voos", kicker: "PHP", deck: "login e viagens", note: "Projeto final de Bases de Dados. As páginas cobrem login, registro e voos.", eyebrow: "Bases de Dados I", spine: "Voos" },
        es: { title: "Vuelos", kicker: "PHP", deck: "login y viajes", note: "Proyecto final de Bases de Datos. Las páginas cubren login, registro y vuelos.", eyebrow: "Bases de Datos I", spine: "Vuelos" }
    }),
    book({
        id: "studio",
        tag: "web",
        layout: "poster",
        font: OUTFIT,
        bg: "#f4f1ea",
        ink: "#1c1c1e",
        muted: "#6a6a70",
        accent: "#c45c26",
        repos: ["product-customization-studio"],
        en: { title: "Studio", kicker: "TypeScript", deck: "product customization", note: "A product-customization studio in TypeScript. The repository includes a course rubric.", eyebrow: "TypeScript", spine: "Studio" },
        pt: { title: "Estúdio", kicker: "TypeScript", deck: "personalizar o produto", note: "Um estúdio de personalização de produto em TypeScript. O repositório inclui uma rubrica de curso.", eyebrow: "TypeScript", spine: "Estúdio" },
        es: { title: "Estudio", kicker: "TypeScript", deck: "personalizar el producto", note: "Un estudio de personalización de producto en TypeScript. El repositorio incluye una rúbrica de curso.", eyebrow: "TypeScript", spine: "Estudio" }
    }),
    book({
        id: "cube",
        tag: "graphics",
        layout: "cube",
        font: OUTFIT,
        bg: "#111111",
        ink: "#f7f4ee",
        muted: "#f7f4ee",
        accent: "#ffd500",
        repos: ["RubickCube-OpenGL"],
        en: { title: "CUBE", kicker: "", deck: "", note: "A Rubik's cube drawn with OpenGL, in C++. The repository name spells Rubick.", eyebrow: "OpenGL", spine: "Cube" },
        pt: { title: "CUBO", kicker: "", deck: "", note: "Um cubo de Rubik desenhado com OpenGL, em C++. O nome do repositório está escrito Rubick.", eyebrow: "OpenGL", spine: "Cubo" },
        es: { title: "CUBO", kicker: "", deck: "", note: "Un cubo de Rubik dibujado con OpenGL, en C++. El nombre del repositorio está escrito Rubick.", eyebrow: "OpenGL", spine: "Cubo" }
    }),
    book({
        id: "cyber",
        tag: "graphics",
        layout: "neon",
        font: ORBITRON,
        bg: "#0c0c12",
        ink: "#f2f2f6",
        muted: "#9a97a8",
        accent: "#5ce1e6",
        repos: ["CyberpunkScene-OpenGL"],
        en: { title: "Cyberpunk", kicker: "", deck: "camera, sky, light, a car", note: "A 3D scene in C++ and OpenGL. The repository has a camera, a sky, lighting, and a car model.", eyebrow: "OpenGL", spine: "Cyber" },
        pt: { title: "Cyberpunk", kicker: "", deck: "câmera, céu, luz, um carro", note: "Cena 3D em C++ e OpenGL. No repositório há câmera, céu, luz e o modelo de um carro.", eyebrow: "OpenGL", spine: "Cyber" },
        es: { title: "Cyberpunk", kicker: "", deck: "cámara, cielo, luz, un auto", note: "Escena 3D en C++ y OpenGL. En el repositorio hay cámara, cielo, luz y el modelo de un auto.", eyebrow: "OpenGL", spine: "Cyber" }
    }),
    book({
        id: "graphics",
        tag: "graphics",
        layout: "poster",
        font: NARROW,
        bg: "#16141c",
        ink: "#f4efe8",
        muted: "#b7b0c4",
        accent: "#e7c56b",
        repos: ["cpp-computer-graphics-assignments"],
        en: { title: "Graphics", kicker: "C", deck: "ten course projects", note: "Ten computer-graphics projects, in folders Project_00 through Project_09.", eyebrow: "Coursework", spine: "Graphics" },
        pt: { title: "Gráficos", kicker: "C", deck: "dez projetos de curso", note: "Dez projetos de computação gráfica, nas pastas Project_00 até Project_09.", eyebrow: "Curso", spine: "Gráficos" },
        es: { title: "Gráficos", kicker: "C", deck: "diez proyectos de curso", note: "Diez proyectos de computación gráfica, en las carpetas Project_00 a Project_09.", eyebrow: "Curso", spine: "Gráficos" }
    }),
    book({
        id: "basilisk",
        tag: "games",
        layout: "myth",
        font: CINZEL,
        bg: "#2a1216",
        ink: "#eadcc8",
        muted: "#cbbba6",
        accent: "#c6a15a",
        repos: ["lord_basilisk"],
        en: { title: "Basilisk", kicker: "Lord", deck: "", note: "A game in Python. The code has a player, enemies, life, and a menu.", eyebrow: "Python", spine: "Basilisk" },
        pt: { title: "Basilisk", kicker: "Lord", deck: "", note: "Um jogo em Python. O código tem jogador, inimigos, vida e um menu.", eyebrow: "Python", spine: "Basilisk" },
        es: { title: "Basilisk", kicker: "Lord", deck: "", note: "Un juego en Python. El código tiene jugador, enemigos, vida y un menú.", eyebrow: "Python", spine: "Basilisk" }
    }),
    book({
        id: "tanks",
        tag: "games",
        layout: "tank",
        font: OPS,
        bg: "#34392d",
        ink: "#e6d3a3",
        muted: "#cbb992",
        accent: "#e6d3a3",
        repos: ["TankWars"],
        en: { title: "TANK\nWARS", kicker: "Elixir", deck: "real-time arcade", note: "A real-time game with Elixir, GenServer, and Phoenix Channels. The README says it started as a turn-based prototype and became an arcade game.", eyebrow: "Phoenix", spine: "Tanks" },
        pt: { title: "TANK\nWARS", kicker: "Elixir", deck: "arcade em tempo real", note: "Jogo em tempo real com Elixir, GenServer e Phoenix Channels. O README diz que começou como protótipo por turnos e passou a ser arcade.", eyebrow: "Phoenix", spine: "Tanques" },
        es: { title: "TANK\nWARS", kicker: "Elixir", deck: "arcade en tiempo real", note: "Juego en tiempo real con Elixir, GenServer y Phoenix Channels. El README dice que empezó como prototipo por turnos y pasó a ser arcade.", eyebrow: "Phoenix", spine: "Tanques" }
    }),
    book({
        id: "lab",
        tag: "security",
        layout: "term",
        font: SHARE,
        bg: "#1a1214",
        ink: "#f3d7d4",
        muted: "#c49896",
        accent: "#e07a72",
        repos: ["site-vulneravel-para-intrusoes"],
        en: { title: "LAB", kicker: "Docker", deck: "Apache · MySQL", note: "A lab: a site, Apache, MySQL, and a report. The site is vulnerable on purpose. This note does not describe the holes.", eyebrow: "Security lab", spine: "Lab" },
        pt: { title: "LAB", kicker: "Docker", deck: "Apache · MySQL", note: "Um laboratório: um site, Apache, MySQL e um relatório. O site é vulnerável de propósito. Esta nota não descreve as falhas.", eyebrow: "Laboratório", spine: "Lab" },
        es: { title: "LAB", kicker: "Docker", deck: "Apache · MySQL", note: "Un laboratorio: un sitio, Apache, MySQL y un informe. El sitio es vulnerable a propósito. Esta nota no describe las fallas.", eyebrow: "Laboratorio", spine: "Lab" }
    })
];
