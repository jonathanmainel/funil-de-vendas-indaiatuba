// Referência local para o recebimento no Make. Não está instalada em serviço externo.
// Retorna somente nomes de campos inválidos, sem registrar dados pessoais.
import { indaiatubaAnswerFields } from "../../src/data/questionCatalog.js";

const requiredAnswers = indaiatubaAnswerFields.filter(({ id }) => id !== "role" && id !== "crm_usage");

export function validateIndaiatubaPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, invalidFields: ["body"] };
  }
  const errors = new Set();
  const text = (key, min, max) => {
    const value = payload[key];
    if (typeof value !== "string" || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.add(key);
  };
  const oneOf = (key, values) => { if (!values.includes(payload[key])) errors.add(key); };
  text("submission_id", 8, 128);
  if (!/^[a-zA-Z0-9._-]+$/.test(payload.submission_id ?? "")) errors.add("submission_id");
  text("submitted_at", 20, 40);
  if (!Number.isFinite(Date.parse(payload.submitted_at))) errors.add("submitted_at");
  text("name", 2, 120);
  text("phone", 10, 11);
  if (!/^\d{10,11}$/.test(payload.phone ?? "")) errors.add("phone");
  text("email", 3, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email ?? "")) errors.add("email");
  text("job_title", 2, 100);
  text("company", 2, 200);
  oneOf("unit", ["Indaiatuba"]);
  oneOf("consent_accepted", ["true"]);
  oneOf("consent_text_version", ["v1"]);
  for (const { field, answers, legacyAnswers } of requiredAnswers) {
    oneOf(field, [...answers, ...legacyAnswers].flatMap(({ value, label }) => [value, label]));
  }
  for (const key of ["score_method", "score_planning", "score_execution", "score_management"]) oneOf(key, ["0", "1", "2", "3"]);
  oneOf("dominant_bottleneck", ["method", "planning", "execution", "management"]);
  oneOf("priority", ["high", "medium", "low"]);
  oneOf("fit", ["true", "false"]);
  oneOf("source", ["Meta Ads"]);
  oneOf("offer", ["Diagnóstico InCompany"]);
  oneOf("initial_stage", ["Novo lead: Diagnóstico InCompany"]);
  text("dominant_bottleneck_label", 1, 100);
  text("page_url", 1, 4096);
  try { if (!["http:", "https:"].includes(new URL(payload.page_url).protocol)) errors.add("page_url"); } catch { errors.add("page_url"); }
  for (const key of ["role", "crm_usage", "score_technology"]) {
    if (key in payload) text(key, 0, 128);
  }
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "campaign_id", "adset_id", "ad_id"]) {
    if (key in payload) text(key, 0, 1024);
  }
  return { valid: errors.size === 0, invalidFields: [...errors] };
}
