import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

async function analytics(pixelId = "1899524664540486", idle = true) {
  vi.resetModules();
  vi.stubEnv("VITE_META_PIXEL_ID", pixelId);
  const callbacks = [];
  const browser = idle
    ? { requestIdleCallback: vi.fn(callback => callbacks.push(callback)) }
    : { setTimeout: vi.fn(callback => callbacks.push(callback)) };
  const append = vi.fn();
  vi.stubGlobal("window", browser);
  vi.stubGlobal("document", { createElement: vi.fn(() => ({})), head: { appendChild: append } });
  const module = await import("../services/analytics");
  return { ...module, browser, callbacks, append };
}

describe("inicialização do Pixel", () => {
  it.each([true, false])("agenda uma vez e emite um PageView, com idle=%s", async idle => {
    const a = await analytics("1899524664540486", idle);
    a.initializeAnalytics();
    const firstQueue = a.browser.fbq;
    a.initializeAnalytics();
    a.initializeAnalytics();
    expect(a.callbacks).toHaveLength(1);
    expect(a.browser.fbq).toBe(firstQueue);
    expect(a.browser.fbq.queue).toEqual([["init", "1899524664540486"], ["track", "PageView"]]);
    a.callbacks[0]();
    a.initializeAnalytics();
    expect(a.append).toHaveBeenCalledTimes(1);
    expect(a.append.mock.calls[0][0].src).toBe("https://connect.facebook.net/pt_BR/fbevents.js");
    expect(a.browser.fbq.queue.filter(args => args[1] === "PageView")).toHaveLength(1);
  });

  it("mantém eventos anteriores ao carregamento da biblioteca na fila do Pixel ativo", async () => {
    const a = await analytics();
    a.initializeAnalytics();
    for (const event of ["QuizStarted", "QuizHalfway", "ContactFormViewed"]) a.trackEvent(event, { utm_source: "qa_local" });
    a.trackEvent("Lead", { priority: "high", bottleneck: "planning" }, "qa-reference");
    expect(a.browser.fbq.queue[0]).toEqual(["init", "1899524664540486"]);
    expect(a.browser.fbq.queue.filter(args => args[0] === "init")).toHaveLength(1);
    expect(a.browser.fbq.queue.at(-1)).toEqual(["track", "Lead", { priority: "high", bottleneck: "planning" }, { eventID: "qa-reference" }]);
    expect(a.browser.dataLayer.map(item => item.event)).toEqual(["QuizStarted", "QuizHalfway", "ContactFormViewed", "Lead"]);
  });

  it("usa o identificador do ambiente, sem fixar o ID de Indaiatuba no serviço", async () => {
    const a = await analytics("111111111111111");
    a.initializeAnalytics();
    expect(a.browser.fbq.queue[0]).toEqual(["init", "111111111111111"]);
  });

  it("sem Pixel mantém dataLayer e não inicializa nem agenda a biblioteca", async () => {
    const a = await analytics("");
    a.initializeAnalytics();
    a.trackEvent("QuizStarted");
    expect(a.browser.fbq).toBeUndefined();
    expect(a.callbacks).toHaveLength(0);
    expect(a.browser.dataLayer).toEqual([{ event: "QuizStarted" }]);
  });

  it("não reinicializa uma fila já existente", async () => {
    const a = await analytics();
    const existing = vi.fn();
    a.browser.fbq = existing;
    a.initializeAnalytics();
    expect(a.browser.fbq).toBe(existing);
    expect(a.callbacks).toHaveLength(0);
    expect(existing).not.toHaveBeenCalled();
  });
});
