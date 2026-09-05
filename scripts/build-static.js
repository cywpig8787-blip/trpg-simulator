import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all([
  cp("ui/web/index.html", "dist/index.html"),
  cp("ui/web/styles.css", "dist/styles.css"),
  cp("ui/web/app.js", "dist/app.js"),
  cp("src", "dist/src", { recursive: true })
]);
