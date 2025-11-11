import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    id: string
    label: string
    description?: string
    optional?: boolean
  }[]
  activeStep: number
  orientation?: "horizontal" | "vertical"
  isCompleted?: boolean
}

export function Stepper({
  steps,
  activeStep,
  orientation = "horizontal",
  isCompleted = false,
  className,
  ...props
}: StepperProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-col space-y-4" : "space-x-4",
        className
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const isActive = activeStep === index
        const isCompleted = activeStep > index
        const isLastStep = index === steps.length - 1
        const isOptional = !!step.optional

        return (
          <div
            key={step.id}
            className={cn(
              "flex",
              orientation === "vertical" ? "flex-col" : "flex-1"
            )}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  isCompleted && "step-number-amber",
                  isActive && !isCompleted && "step-number-amber-inactive",
                  !isActive && !isCompleted && "step-number-amber-pending"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4 text-black" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {!isLastStep && (
                <div
                  className={cn(
                    orientation === "vertical"
                      ? "ms-4 h-10 w-px bg-border"
                      : "h-px flex-1 bg-border",
                    orientation === "horizontal" && "mx-2"
                  )}
                />
              )}
            </div>
            <div className={cn("mt-2", orientation === "horizontal" && "text-center")}>
              <div className="text-sm font-medium">
                {step.label}
                {isOptional && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (Optional)
                  </span>
                )}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function useStepper(totalSteps: number) {
  const [activeStep, setActiveStep] = React.useState(0)
  const [completed, setCompleted] = React.useState<Record<number, boolean>>({})

  const isLastStep = activeStep === totalSteps - 1
  const allStepsCompleted = Object.keys(completed).length === totalSteps

  const handleNext = React.useCallback(() => {
    const newActiveStep = isLastStep && !allStepsCompleted
      ? steps.findIndex((step, i) => !(i in completed))
      : activeStep + 1
    setActiveStep(newActiveStep)
  }, [activeStep, isLastStep, allStepsCompleted])

  const handleBack = React.useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }, [])

  const handleStep = React.useCallback((step: number) => {
    setActiveStep(step)
  }, [])

  const handleComplete = React.useCallback(() => {
    const newCompleted = { ...completed }
    newCompleted[activeStep] = true
    setCompleted(newCompleted)
    handleNext()
  }, [activeStep, completed, handleNext])

  const handleReset = React.useCallback(() => {
    setActiveStep(0)
    setCompleted({})
  }, [])

  const steps = Array.from({ length: totalSteps }, (_, i) => i)

  return {
    activeStep,
    steps,
    isLastStep,
    completed,
    allStepsCompleted,
    handleNext,
    handleBack,
    handleStep,
    handleComplete,
    handleReset,
  }
} 