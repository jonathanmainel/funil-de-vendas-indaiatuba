import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { unitProfiles } from "../../config/units";
import { indaiatubaAnswerFields } from "../data/questionCatalog";

const selectedAnswers = {
  bottleneck: "prospecting",
  team_size: "three_five",
  process: "partial",
  goals: "sometimes",
  followup: "routine",
  insight_timing: "meetings",
  timeline: "thirty_days",
};

const cases = indaiatubaAnswerFields.flatMap(({ id, field, answers, legacyAnswers }) =>
  [...answers, ...legacyAnswers].map(({ value, label }) => ({ id, field, value, label })),
);

const contact = {
  name: "Pessoa QA",
  phone: "11999990000",
  email: "qa@example.invalid",
  jobTitle: "Diretora comercial",
  company: "Empresa QA",
};

let request;
beforeEach(() => {
  vi.resetModules();
  vi.doMock("../config/unit", () => ({ unit: unitProfiles.indaiatuba }));
  vi.stubEnv("VITE_MAKE_WEBHOOK_URL", "https://hooks.example.invalid/indaiatuba");
  request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "qa" }) });
  vi.stubGlobal("fetch", request);
});

afterEach(() => {
  vi.doUnmock("../config/unit");
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function send(answers, { unit = "Indaiatuba", technology } = {}) {
  const { submitLead } = await import("../services/leadService");
  const { calculateQualification } = await import("../utils/qualification");
  const qualification = calculateQualification({ ...answers, jobTitle: contact.jobTitle });
  const result = await submitLead({
    submissionId: "qa-payload",
    unit,
    contact,
    consent: { accepted: true, textVersion: "v1" },
    quiz: {
      ...qualification,
      answers,
      scores: { ...qualification.scores, technology },
    },
    attribution: { utm_campaign: "homologação + QA" },
  });
  expect(result.status).toBe("recorded");
  expect(request).toHaveBeenCalledTimes(1);
  return new URLSearchParams(request.mock.calls[0][1].body.toString());
}

describe("respostas no payload de Indaiatuba", () => {
  it.each(cases)("serializa $field $value como $label", async ({ id, field, value, label }) => {
    const answers = { ...selectedAnswers, [id]: value };
    const body = await send(answers);
    expect(body.get(field)).toBe(label);
    expect(answers[id]).toBe(value);
  });

  it("omite opcionais ausentes e mantém a qualificação e a atribuição", async () => {
    const body = await send({ ...selectedAnswers, role: "undefined", crm_usage: null });
    for (const field of ["role", "crm_usage", "score_technology"]) {
      expect(body.has(field)).toBe(false);
    }
    expect(body.get("score_method")).toBe("1");
    expect(body.get("score_planning")).toBe("1");
    expect(body.get("score_execution")).toBe("0");
    expect(body.get("score_management")).toBe("1");
    expect(body.get("dominant_bottleneck")).toBe("method");
    expect(body.get("priority")).toBe("high");
    expect(body.get("fit")).toBe("true");
    expect(body.get("utm_campaign")).toBe("homologação + QA");
  });

  it("preserva uma pontuação de tecnologia histórica igual a zero", async () => {
    const body = await send(selectedAnswers, { technology: 0 });
    expect(body.get("score_technology")).toBe("0");
  });

  it("preserva uma resposta histórica fora do catálogo conhecido", async () => {
    const body = await send({ ...selectedAnswers, role: "Cargo histórico" });
    expect(body.get("role")).toBe("Cargo histórico");
  });
});

it("mantém os valores do contrato anterior para Ribeirão Preto", async () => {
  vi.doMock("../config/unit", () => ({ unit: unitProfiles["ribeirao-preto"] }));
  const body = await send(selectedAnswers, { unit: "Ribeirão Preto" });
  expect(body.get("team_size")).toBe("three_five");
  expect(body.get("declared_bottleneck")).toBe("prospecting");
  expect(body.get("role")).toBe("undefined");
  expect(body.get("score_technology")).toBe("undefined");
});
