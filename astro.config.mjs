import { defineConfig } from "astro/config";
import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const buildBoot = () => {
    const production = process.env.NODE_ENV === "production";
    return esbuild.build({
        absWorkingDir: root,
        entryPoints: [path.join(root, "src/scripts/boot.ts")],
        bundle: true,
        format: "iife",
        globalName: "portfolioBoot",
        footer: { js: "portfolioBoot.boot();" },
        outfile: path.join(root, "public/boot.js"),
        platform: "browser",
        target: "es2022",
        minify: production,
        sourcemap: !production,
        legalComments: "none",
        plugins: [
            {
                name: "glsl-raw",
                setup(build) {
                    build.onResolve({ filter: /\.glsl\?raw$/ }, (args) => ({
                        path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, ""))
                    }));
                    build.onLoad({ filter: /\.glsl$/ }, async (args) => ({
                        contents: await fs.promises.readFile(args.path, "utf8"),
                        loader: "text"
                    }));
                }
            }
        ]
    });
};

const bootBundle = () => ({
    name: "boot-bundle",
    async buildStart() {
        await buildBoot();
    },
    async handleHotUpdate(context) {
        const file = context.file;
        if (file.includes(`${path.sep}src${path.sep}scripts${path.sep}`)
            || file.includes(`${path.sep}src${path.sep}i18n${path.sep}`)
            || file.includes(`${path.sep}src${path.sep}shaders${path.sep}`)) {
            await buildBoot();
            context.server.ws.send({ type: "full-reload" });
            return [];
        }
        return undefined;
    }
});

export default defineConfig({
    site: "https://mativan15.github.io",
    base: "/mativan15",
    vite: {
        plugins: [bootBundle()]
    }
});
