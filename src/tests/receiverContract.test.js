import { describe, expect, it } from "vitest";
import { validateIndaiatubaPayload } from "../../deployment/make/validate-indaiatuba-payload";

const payload = {
  submission_id: "qa-synthetic-id", submitted_at: "2026-11-04T20:00:00.000Z",
  name: "Pessoa QA", phone: "11999990000", email: "qa@example.invalid", job_title: "Diretora", company: "Empresa QA",
  unit: "Indaiatuba", consent_accepted: "true", consent_text_version: "v1",
  declared_bottleneck: "predictability", team_size: "three_five", process: "partial", goals: "sometimes", followup: "routine", insight_timing: "meetings", timeline: "now",
  score_method: "1", score_planning: "1", score_execution: "0", score_management: "1",
  dominant_bottleneck: "planning", dominant_bottleneck_label: "Planejamento", priority: "high", fit: "true",
  source: "Meta Ads", offer: "Diagnóstico InCompany", initial_stage: "Novo lead: Diagnóstico InCompany", page_url: "https://example.invalid/quiz/?utm_source=test",
  role: "undefined", crm_usage: "undefined", score_technology: "undefined",
};

describe("contrato de recebimento a configurar no Make", () => {
  it.each([null, undefined, [], "invalid"])("rejeita corpo que não é um objeto (%s)", value => {
    expect(validateIndaiatubaPayload(value)).toEqual({ valid: false, invalidFields: ["body"] });
  });
  it.each(["prospecting", "process_indicators", "predictability", "negotiation", "lost_opportunities", "followup", "conversion", "team"])("aceita identificador atual ou histórico %s", value => {
    expect(validateIndaiatubaPayload({ ...payload, declared_bottleneck: value }).valid).toBe(true);
  });

  it.each([
    ["unit", "Ribeirão Preto"], ["consent_accepted", "false"], ["declared_bottleneck", "unknown"],
    ["phone", "123"], ["email", "invalid"], ["submission_id", ""], ["submitted_at", "invalid"],
    ["score_execution", "99"], ["priority", "urgent"], ["company", "x"],
  ])("rejeita %s inválido sem produzir efeitos externos", (key, value) => {
    expect(validateIndaiatubaPayload({ ...payload, [key]: value }).invalidFields).toContain(key);
  });
});
