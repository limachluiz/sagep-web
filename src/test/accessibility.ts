import axe from "axe-core"
import { expect } from "vitest"

function formatViolations(violations: axe.Result[]) {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .flatMap((node) => node.target)
        .join(", ")

      return `${violation.id}: ${violation.help} (${targets})`
    })
    .join("\n")
}

export async function expectNoAccessibilityViolations(container: Element) {
  const result = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  })

  expect(result.violations, formatViolations(result.violations)).toEqual([])
}
