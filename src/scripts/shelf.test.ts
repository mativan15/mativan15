import { describe, expect, it } from "vitest";
import en from "../i18n/en";
import es from "../i18n/es";
import pt from "../i18n/pt";
import { SHELF_BOOKS, SHELF_LANGS, SHELF_TAGS, type ShelfTag } from "./shelf-books";
import {
    circularOffset,
    nearestTurn,
    SHELF_CRUISE_RATE,
    SHELF_IDLE_RATE,
    SHELF_MIN_LOOP,
    SHELF_SHADE_OPEN,
    loopRepeats,
    shelfCruise,
    shelfShade,
    shelfMetrics,
    shelfPose,
    visibleBooks,
    wrapIndex
} from "./shelf-motion";

const PUBLIC_REPOS = [
    "routerUDP",
    "RubickCube-OpenGL",
    "TankWars",
    "CyberpunkScene-OpenGL",
    "mativan15",
    "site-vulneravel-para-intrusoes",
    "Clipboard-ProMax",
    "TransformerMNIST",
    "MLP-MNIST-CUDA",
    "Perceptron-MNIST-Metal",
    "MLP-MNIST-Metal",
    "MLP-Digit_Identifier-Python",
    "app_emit-SpaceApps2023",
    "PACE-ocean_NASA-space-apps",
    "app_LaOriginalDistribuidora",
    "TCP-scanner",
    "log-parser-UNIX",
    "adaptative-http-load-balancer",
    "learning-app",
    "music-playlist-platform",
    "fcgscan-cli",
    "formatpipe",
    "fitness-member-portal",
    "mixed-stack-rc2",
    "cpp-tcp-client-server-router",
    "cpp-computer-graphics-assignments",
    "fundraising-platform",
    "product-customization-studio",
    "rc5-course-rubric-deliverable",
    "rc1-coworking-app",
    "ios-clipboard-promax",
    "horarioInteractivo",
    "TrendingTopicsAnalyzer",
    "database_windows",
    "TareasCC_II",
    "tareasADA",
    "DB-PF",
    "DBP_tareas",
    "AroundTheWorld_Website",
    "DBP_projects",
    "CV1_ejemplo",
    "BinMulti",
    "database_macOS",
    "lord_basilisk",
    "Proyectos-varios-CCOMP"
];

describe("shelf catalog", () => {
    it("lists every public repo once, grouping only the three twin programs", () => {
        const labels = SHELF_BOOKS.flatMap((book) => book.repos.map((item) => item.label));
        expect([...labels].sort()).toEqual([...PUBLIC_REPOS].sort());
        expect(new Set(labels).size).toBe(labels.length);

        const grouped = SHELF_BOOKS.filter((book) => book.repos.length > 1).map((book) => book.repos.map((item) => item.label));
        expect(grouped).toEqual([
            ["MLP-MNIST-CUDA", "MLP-MNIST-Metal"],
            ["Clipboard-ProMax", "ios-clipboard-promax"],
            ["database_windows", "database_macOS"]
        ]);
    });

    it("gives every book one known tag and copy in each language", () => {
        const tags = new Set<string>(SHELF_TAGS);
        SHELF_BOOKS.forEach((book) => {
            expect(tags.has(book.tag)).toBe(true);
            SHELF_LANGS.forEach((lang) => {
                const copy = book.copy[lang];
                expect(copy.title.trim().length).toBeGreaterThan(0);
                expect(copy.note.trim().length).toBeGreaterThan(20);
                expect(copy.spine.trim().length).toBeGreaterThan(0);
            });
        });
    });

    it("partitions the shelf by tag and keeps all of them under All", () => {
        expect(visibleBooks(SHELF_BOOKS, "all")).toHaveLength(SHELF_BOOKS.length);
        const seen = new Set<string>();
        SHELF_TAGS.forEach((tag) => {
            const matches = visibleBooks(SHELF_BOOKS, tag);
            expect(matches.length).toBeGreaterThan(0);
            matches.forEach((book) => {
                expect(book.tag).toBe(tag);
                expect(seen.has(book.id)).toBe(false);
                seen.add(book.id);
            });
        });
        expect(seen.size).toBe(SHELF_BOOKS.length);
        const networks = visibleBooks(SHELF_BOOKS, "networks" satisfies ShelfTag);
        expect(networks.map((book) => book.id)).toEqual(["ports", "udp", "tcp-pair", "balancer"]);
    });
});

describe("shelf copy", () => {
    it("keeps the shelf strings in English, Portuguese, and Spanish", () => {
        const keys = Object.keys(en).filter((key) => key.startsWith("shelf.") || key === "work.intro");
        expect(keys.length).toBeGreaterThan(8);
        keys.forEach((key) => {
            expect(pt[key as keyof typeof pt].trim().length).toBeGreaterThan(0);
            expect(es[key as keyof typeof es].trim().length).toBeGreaterThan(0);
        });
        expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
        expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    });
});

describe("shelf motion", () => {
    it("wraps the row so the last book sits just left of the first", () => {
        expect(wrapIndex(-1, 14)).toBe(13);
        expect(wrapIndex(14, 14)).toBe(0);
        expect(circularOffset(13, 0, 14)).toBe(-1);
        expect(circularOffset(0, 0, 14)).toBe(0);
        expect(nearestTurn(0, 13.2, 14)).toBe(14);
    });

    it("faces the active book and opens a gap for its neighbors", () => {
        const size = shelfMetrics(1200);
        const active = shelfPose(0, size);
        const next = shelfPose(1, size);
        expect(active.rot).toBe(0);
        expect(active.z).toBeGreaterThan(next.z);
        expect(active.scale).toBeGreaterThan(next.scale);
        expect(next.x).toBeGreaterThan(size.step);
        expect(next.rot).toBeLessThan(0);
    });

    it("keeps a constant speed on each side and a slow spin with no pointer", () => {
        expect(shelfCruise(null)).toBe(SHELF_IDLE_RATE);
        expect(shelfCruise(0)).toBe(SHELF_IDLE_RATE);
        expect(shelfCruise(0.1)).toBe(SHELF_IDLE_RATE);
        expect(shelfCruise(0.4)).toBe(SHELF_CRUISE_RATE);
        expect(shelfCruise(0.95)).toBe(SHELF_CRUISE_RATE);
        expect(shelfCruise(-0.4)).toBe(-SHELF_CRUISE_RATE);
        expect(shelfCruise(-0.95)).toBe(-SHELF_CRUISE_RATE);
        expect(SHELF_CRUISE_RATE).toBeGreaterThan(SHELF_IDLE_RATE * 4);
        expect(shelfCruise(0.8, true)).toBe(0);

        const step = (focus: number, rate: number, dt: number) => focus + rate * dt;
        const first = step(3, SHELF_CRUISE_RATE, 0.2) - 3;
        const second = step(8, SHELF_CRUISE_RATE, 0.2) - 8;
        expect(first).toBeCloseTo(second);
        expect(first).toBeGreaterThan(0);
    });

    it("repeats a short filter until the seam is far from the center", () => {
        expect(loopRepeats(1)).toBe(1);
        expect(loopRepeats(42)).toBe(1);
        [2, 3, 4, 6].forEach((count) => {
            expect(loopRepeats(count) * count).toBeGreaterThanOrEqual(SHELF_MIN_LOOP);
        });
        const size = shelfMetrics(1440);
        const edge = shelfPose(SHELF_MIN_LOOP / 2, size);
        expect(Math.abs(edge.x)).toBeGreaterThan(size.w * 4);
    });

    it("dims a full row lightly and keeps the tight spotlight when copies would show", () => {
        const wide = shelfMetrics(1800);
        expect(shelfShade(42, 1800, wide)).toEqual(SHELF_SHADE_OPEN);
        expect(shelfShade(4, 390, shelfMetrics(390))).toEqual(SHELF_SHADE_OPEN);

        const four = shelfShade(4, 1800, wide);
        const two = shelfShade(2, 1800, wide);
        expect(four.edge).toBe(1);
        expect(four.d).toBe(46);
        expect(four.a).toBeGreaterThan(26);
        expect(two.edge).toBe(1);
        expect(two.a).toBeGreaterThan(four.a);
        expect(two.a).toBeLessThan(two.d);
        expect(SHELF_SHADE_OPEN.edge).toBeLessThan(0.5);
    });

    it("opens the shadow as books are added and closes it as they are removed", () => {
        [390, 800, 1200, 1680].forEach((width) => {
            const size = shelfMetrics(width);
            let previous = shelfShade(2, width, size).edge;
            for (let count = 3; count <= 24; count += 1) {
                const next = shelfShade(count, width, size).edge;
                expect(next).toBeLessThanOrEqual(previous + 0.001);
                previous = next;
            }
            const full = shelfShade(42, width, size);
            const pair = shelfShade(2, width, size);
            expect(full).toEqual(SHELF_SHADE_OPEN);
            expect(pair.edge).toBeGreaterThanOrEqual(full.edge);
            expect(shelfShade(1, width, size)).toEqual(SHELF_SHADE_OPEN);
        });
    });

    it("keeps a phone book narrow enough that neighbors can peek", () => {
        const phone = shelfMetrics(390);
        expect(phone.w).toBeLessThan(180);
        expect(phone.w * 2).toBeLessThan(390);
        const wide = shelfMetrics(1600);
        expect(wide.w).toBe(176);
    });
});
