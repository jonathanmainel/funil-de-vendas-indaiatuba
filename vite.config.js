import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolveUnitProfile, validateIndaiatubaEnvironment } from "./config/units.js";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode, command }) => {
  const unit = resolveUnitProfile(mode);
  const explicitUnit = ["indaiatuba", "ribeirao-preto"].includes(mode);
  const envDir = unit.id === "indaiatuba"
    ? fileURLToPath(new URL("./config/env/indaiatuba/", import.meta.url))
    : projectRoot;
  if (command === "build" && unit.id === "indaiatuba") {
    validateIndaiatubaEnvironment(loadEnv(mode, envDir, "VITE_"));
  }

  return {
    // O comando legado e seu diretório de saída continuam compatíveis com o workflow atual.
    base: explicitUnit ? unit.basePath : process.env.GITHUB_ACTIONS ? unit.basePath : "/",
    envDir,
    define: { __QUIZ_CONFIG__: JSON.stringify(unit) },
    plugins: [
      react(),
      {
        name: "quiz-unit-metadata",
        transformIndexHtml(html) {
          return html
            .replaceAll("__QUIZ_TITLE__", `Diagnóstico Comercial | Funil de Vendas ${unit.name}`)
            .replaceAll("__QUIZ_DESCRIPTION__", `Diagnóstico comercial InCompany da Funil de Vendas, unidade ${unit.name}.`);
        },
      },
    ],
    build: { outDir: explicitUnit ? `dist-units/${unit.id}` : "dist" },
    server: { port: 4173 },
    preview: { port: 4173 },
  };
});
