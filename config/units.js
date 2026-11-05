const ribeiraoBottlenecks = [
  { value: "prospecting", label: "Prospecção" },
  { value: "followup", label: "Acompanhamento" },
  { value: "conversion", label: "Conversão" },
  { value: "team", label: "Gestão da equipe" },
  { value: "process_indicators", label: "Processo e indicadores" },
];

export const unitProfiles = {
  "ribeirao-preto": {
    id: "ribeirao-preto",
    name: "Ribeirão Preto",
    basePath: "/funil-de-vendas-quiz/",
    introDescription: "Responda a algumas perguntas para que nossa equipe analise sua operação",
    serviceMode: "Atendimento online ou presencial.",
    startLabel: "Iniciar diagnóstico",
    submitLabel: "Solicitar diagnóstico sem custo",
    routineLabel: "Existe uma rotina definida",
    bottlenecks: ribeiraoBottlenecks,
    storage: {
      session: "fdv_incompany_quiz_state_v2",
      queue: "fdv_incompany_pending_leads_v1",
      demo: "fdv_incompany_demo_leads_v1",
    },
  },
  indaiatuba: {
    id: "indaiatuba",
    name: "Indaiatuba",
    basePath: "/funil-de-vendas-indaiatuba/",
    introDescription: "Responda às perguntas e dê o primeiro passo para identificar o que está travando suas vendas e o que pode ser melhorado.",
    serviceMode: null,
    startLabel: "Vamos começar",
    submitLabel: "Quero receber meu diagnóstico gratuito",
    routineLabel: "Existe uma rotina definida e realmente é executada",
    bottlenecks: [
      { value: "prospecting", label: "Prospecção" },
      { value: "process_indicators", label: "Processo e indicadores" },
      { value: "predictability", label: "Previsibilidade" },
      { value: "negotiation", label: "Negociação" },
      { value: "lost_opportunities", label: "Onde e por que está perdendo oportunidades" },
    ],
    storage: {
      session: "fdv_indaiatuba_quiz_state_v2",
      queue: "fdv_indaiatuba_pending_leads_v1",
      demo: "fdv_indaiatuba_demo_leads_v1",
    },
  },
};

export function resolveUnitProfile(mode) {
  if (Object.hasOwn(unitProfiles, mode)) return unitProfiles[mode];
  if (["development", "production", "test"].includes(mode)) {
    return unitProfiles["ribeirao-preto"];
  }
  throw new Error("Modo de unidade desconhecido. Use indaiatuba ou ribeirao-preto.");
}

export function validateIndaiatubaEnvironment(env) {
  const errors = [];
  for (const key of ["VITE_MAKE_WEBHOOK_URL", "VITE_PRIVACY_URL"]) {
    try {
      const url = new URL(env[key]?.trim());
      if (url.protocol !== "https:" || url.username || url.password) throw new Error();
      if (key === "VITE_MAKE_WEBHOOK_URL" && (url.search || url.hash)) throw new Error();
    } catch {
      errors.push(`${key} deve ser uma URL HTTPS sem credenciais${key === "VITE_MAKE_WEBHOOK_URL" ? ", query ou fragmento" : ""}.`);
    }
  }
  if (!/^\d{5,30}$/.test(env.VITE_META_PIXEL_ID?.trim() ?? "")) {
    errors.push("VITE_META_PIXEL_ID deve conter o identificador numérico aprovado.");
  }
  if (errors.length) {
    throw new Error(`Build de Indaiatuba bloqueado: ${errors.join(" ")} Nenhum valor de Ribeirão Preto é usado como padrão.`);
  }
}
