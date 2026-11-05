import { ClockIcon } from "./Icons";
import { ProgressBar } from "./ProgressBar";
import { unit } from "../config/unit";

export function IntroScreen({ onStart }) {
  return (
    <section className="screen screen--intro" aria-labelledby="intro-title">
      <ProgressBar current={1} total={7} />
      <div className="intro-content">
        <h1 id="intro-title">Onde sua operação comercial está perdendo força?</h1>
        <p className="lead">
          {unit.introDescription}
        </p>
        {unit.serviceMode ? <p className="service-mode">{unit.serviceMode}</p> : null}
        <button className="primary-button" type="button" onClick={onStart}>
          {unit.startLabel}
        </button>
        <p className="time-note">
          <ClockIcon />
          Leva de 2 a 3 minutos
        </p>
      </div>
    </section>
  );
}
