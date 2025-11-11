'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Stepper } from "./stepper"

export interface WizardProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    id: string
    label: string
    description?: string
    optional?: boolean
    content: React.ReactNode
    isDisabled?: boolean
  }[]
  activeStep: number
  orientation?: "horizontal" | "vertical"
  onStepChange?: (step: number) => void
  allowSkip?: boolean
  className?: string
}

export function Wizard({
  steps,
  activeStep,
  orientation = "horizontal",
  onStepChange,
  allowSkip = false,
  className,
  ...props
}: WizardProps) {
  const handleStepClick = (index: number) => {
    // Only allow clicking steps that are enabled and
    // either we allow skipping or the step is adjacent to current step
    if (
      !steps[index].isDisabled &&
      (allowSkip || index === activeStep + 1 || index === activeStep - 1)
    ) {
      onStepChange?.(index)
    }
  }

  return (
    <div className={cn("space-y-8", className)} {...props}>
      <Stepper
        steps={steps}
        activeStep={activeStep}
        orientation={orientation}
        className="mb-8"
      />
      <div className="mt-8">
        {steps[activeStep]?.content}
      </div>
    </div>
  )
}

export function WizardNav({
  activeStep,
  steps,
  onNext,
  onBack,
  onFinish,
  className
}: {
  activeStep: number
  steps: { id: string; label: string; isDisabled?: boolean }[]
  onNext?: () => void
  onBack?: () => void
  onFinish?: () => void
  className?: string
}) {
  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === steps.length - 1
  const isStepDisabled = steps[activeStep]?.isDisabled

  return (
    <div className={cn("flex justify-between mt-8", className)}>
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep || isStepDisabled}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md",
          isFirstStep || isStepDisabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        Back
      </button>
      <div className="flex space-x-2">
        {isLastStep ? (
          <button
            type="button"
            onClick={onFinish}
            disabled={isStepDisabled}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              isStepDisabled
                ? "bg-indigo-300 text-white cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isStepDisabled}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              isStepDisabled
                ? "bg-indigo-300 text-white cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
} 