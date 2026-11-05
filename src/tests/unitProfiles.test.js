import { describe, expect, it } from "vitest";
import { resolveUnitProfile, unitProfiles, validateIndaiatubaEnvironment } from "../../config/units";

const settings = {
  VITE_MAKE_WEBHOOK_URL: "https://hooks.example.invalid/indaiatuba",
  VITE_META_PIXEL_ID: "123456789000000",
  VITE_PRIVACY_URL: "https://privacy.example.invalid/indaiatuba",
};

describe("perfis de unidade", () => {
  it.each(["development", "production", "test", "ribeirao-preto"])("mantém Ribeirão Preto no modo %s", mode => {
    expect(resolveUnitProfile(mode)).toBe(unitProfiles["ribeirao-preto"]);
  });

  it.each(["desconhecido", "__proto__", "constructor"])("recusa modo desconhecido %s", mode => {
    expect(() => resolveUnitProfile(mode)).toThrow("Modo de unidade desconhecido");
  });

  it("separa as três chaves sem abandonar as chaves históricas de Ribeirão", () => {
    const old = unitProfiles["ribeirao-preto"].storage;
    expect(old).toEqual({ session: "fdv_incompany_quiz_state_v2", queue: "fdv_incompany_pending_leads_v1", demo: "fdv_incompany_demo_leads_v1" });
    const current = unitProfiles.indaiatuba.storage;
    expect(Object.values(current).some(key => Object.values(old).includes(key))).toBe(false);
  });

  it("mantém valores e ordem das alternativas antigas e novas em perfis distintos", () => {
    expect(unitProfiles["ribeirao-preto"].bottlenecks.map(answer => answer.value)).toEqual(["prospecting", "followup", "conversion", "team", "process_indicators"]);
    expect(unitProfiles.indaiatuba.bottlenecks.map(answer => answer.value)).toEqual(["prospecting", "process_indicators", "predictability", "negotiation", "lost_opportunities"]);
  });
});

describe("configuração pública de Indaiatuba", () => {
  it("aceita configuração sintética completa sem credenciais", () => {
    expect(() => validateIndaiatubaEnvironment(settings)).not.toThrow();
  });

  it.each(Object.keys(settings))("bloqueia ausência de %s", key => {
    expect(() => validateIndaiatubaEnvironment({ ...settings, [key]: "" })).toThrow(key);
  });

  it.each(["http://hooks.example.invalid/quiz", "https://user:password@hooks.example.invalid/quiz", "https://hooks.example.invalid/quiz?token=private", "https://hooks.example.invalid/quiz#token"])("recusa webhook inseguro ou com credenciais (%s)", webhook => {
    expect(() => validateIndaiatubaEnvironment({ ...settings, VITE_MAKE_WEBHOOK_URL: webhook })).toThrow("VITE_MAKE_WEBHOOK_URL");
  });

  it("não revela valores fornecidos em mensagens de erro", () => {
    expect(() => validateIndaiatubaEnvironment({ ...settings, VITE_MAKE_WEBHOOK_URL: "https://user:private-value@example.invalid/" })).toThrow(/^((?!private-value).)*$/);
  });
});
