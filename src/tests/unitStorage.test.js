import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/unit", () => ({
  unit: {
    id: "indaiatuba", name: "Indaiatuba",
    storage: { demo: "fdv_indaiatuba_demo_leads_v1", queue: "fdv_indaiatuba_pending_leads_v1" },
  },
}));

const key = "fdv_indaiatuba_pending_leads_v1";
const oldKey = "fdv_incompany_pending_leads_v1";
const lead = {
  submissionId: "qa-id", unit: "Indaiatuba",
  contact: { name: "Pessoa QA", phone: "11999990000", email: "qa@example.invalid", jobTitle: "Diretora", company: "QA" },
  consent: { accepted: true, textVersion: "v1" },
  quiz: { answers: { bottleneck: "followup" }, scores: { method: 1, planning: 1, execution: 1, management: 1 }, dominantBottleneck: "execution", dominantBottleneckLabel: "Execução e acompanhamento", priority: "high", fit: true },
  attribution: {},
};

describe("isolamento da fila de Indaiatuba", () => {
  let storage;
  let request;
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_MAKE_WEBHOOK_URL", "https://hooks.example.invalid/indaiatuba");
    storage = new Map();
    vi.stubGlobal("localStorage", { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) });
    vi.stubGlobal("navigator", { onLine: true });
    request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "qa-reference" }) });
    vi.stubGlobal("fetch", request);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("não lê, envia ou modifica a fila histórica de Ribeirão Preto", async () => {
    const historical = JSON.stringify([{ payload: { ...lead, unit: "Ribeirão Preto" } }]);
    storage.set(oldKey, historical);
    const { retryQueuedLeads } = await import("../services/leadService");
    await retryQueuedLeads();
    expect(request).not.toHaveBeenCalled();
    expect(storage.get(oldKey)).toBe(historical);
  });

  it("preserva item de outra unidade e reenvia resposta antiga válida de Indaiatuba", async () => {
    const foreign = { payload: { ...lead, unit: "Ribeirão Preto" } };
    storage.set(key, JSON.stringify([foreign, { payload: lead }]));
    const { retryQueuedLeads } = await import("../services/leadService");
    await retryQueuedLeads();
    expect(request).toHaveBeenCalledTimes(1);
    const body = request.mock.calls[0][1].body;
    expect(body.get("unit")).toBe("Indaiatuba");
    expect(body.get("declared_bottleneck")).toBe("Acompanhamento");
    expect(body.get("submission_id")).toBe("qa-id");
    expect(JSON.parse(storage.get(key))).toEqual([foreign]);
  });

  it("não envia novo lead com unidade incompatível", async () => {
    const { submitLead } = await import("../services/leadService");
    await expect(submitLead({ ...lead, unit: "Ribeirão Preto" })).rejects.toThrow("unidade");
    expect(request).not.toHaveBeenCalled();
  });
});
