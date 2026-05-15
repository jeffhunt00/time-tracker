/**
 * StepIndicator — numbered step navigation for multi-step flows.
 * Maps to the `invoice-steps` / `invoice-step` CSS pattern in InvoiceBuilder.
 *
 * Steps before the current one are clickable (to navigate back).
 * The current step has the `active` modifier class.
 * Steps after the current one are not clickable.
 */

interface StepItem<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  steps: StepItem<T>[];
  activeStep: T;
  onStepClick: (step: T) => void;
}

export function StepIndicator<T extends string>({
  steps,
  activeStep,
  onStepClick,
}: Props<T>) {
  const activeIdx = steps.findIndex((s) => s.value === activeStep);

  return (
    <div className="invoice-steps">
      {steps.map((step, i) => {
        const isActive = step.value === activeStep;
        const isCompleted = i < activeIdx;
        const isClickable = i <= activeIdx;

        return (
          <button
            key={step.value}
            className={[
              'invoice-step',
              isActive ? 'active' : '',
              isCompleted ? 'completed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (isClickable) onStepClick(step.value);
            }}
            disabled={!isClickable}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="invoice-step-num">{i + 1}</span>
            <span className="invoice-step-label">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
