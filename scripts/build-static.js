import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await mkdir("dist/v2", { recursive: true });

await Promise.all([
  cp("ui/web/index.html", "dist/index.html"),
  cp("ui/web/styles.css", "dist/styles.css"),
  cp("ui/web/app.js", "dist/app.js"),
  cp("ui/web/specialized-skill-ux.js", "dist/specialized-skill-ux.js"),
  cp("ui/coc-builder-v2/index.html", "dist/v2/index.html"),
  cp("ui/coc-builder-v2/styles.css", "dist/v2/styles.css"),
  cp("src", "dist/src", { recursive: true })
]);

const v2Parts = await Promise.all(
  Array.from({ length: 7 }, (_, index) =>
    readFile(`ui/coc-builder-v2/app.part${index + 1}.js`, "utf8")
  )
);
await writeFile("dist/v2/app.js", v2Parts.join(""), "utf8");
