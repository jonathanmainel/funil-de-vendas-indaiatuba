import { unit } from "../config/unit";
import { getQuestions } from "./questionCatalog";

export const questions = getQuestions(unit);

export const dimensionLabels = {
  method: "Método comercial",
  planning: "Planejamento",
  execution: "Execução e acompanhamento",
  management: "Gestão por indicadores",
};
