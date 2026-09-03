import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { ProjectDocumentsPanel } from "@/features/projects/components/project-documents-panel"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

const details = {
  workflow: {
    creditFunding: {
      mode: "SINGLE",
      notes: [{
        id: "credit-note-1",
        number: "NC-TESTE",
        receivedAt: "2026-07-20T12:00:00.000Z",
        amount: "1000.00",
        issuingManagementUnit: null,
        documentLink: null,
      }],
      requiredAmount: "1000.00",
      receivedAmount: "1000.00",
      overflowJustification: null,
    },
    milestones: {
      creditNoteNumber: "NC-TESTE",
      creditNoteReceivedAt: "2026-07-20T12:00:00.000Z",
      commitmentNoteNumber: "NE-TESTE",
      commitmentNoteReceivedAt: "2026-07-21T12:00:00.000Z",
      asBuiltLink: "https://example.com/as-built",
    },
    serviceOrderSignature: {
      required: true,
      link: "https://example.com/os-assinada",
      receivedAt: "2026-07-21T12:00:00.000Z",
      notes: null,
      registeredBy: null,
    },
  },
  documents: {
    estimates: [{
      id: "estimate-1",
      estimateCode: 10,
      status: "FINALIZADA",
      destinationCityName: "Cidade Teste",
      destinationStateUf: "AM",
      totalAmount: "1000.00",
      archivedAt: null,
      createdAt: "2026-07-18T12:00:00.000Z",
    }],
    diexRequests: [{
      id: "diex-1",
      diexCode: 20,
      diexNumber: "DIEX-TESTE",
      issuedAt: "2026-07-19T12:00:00.000Z",
      documentStatus: "EMITIDO",
      totalAmount: "1000.00",
      supplierName: "Fornecedor Teste",
      archivedAt: null,
      createdAt: "2026-07-19T12:00:00.000Z",
      estimate: { id: "estimate-1", estimateCode: 10 },
    }],
    serviceOrders: [{
      id: "order-1",
      serviceOrderCode: 30,
      serviceOrderNumber: "OS-TESTE",
      issuedAt: "2026-07-20T12:00:00.000Z",
      documentStatus: "EMITIDO",
      totalAmount: "950.00",
      contractorName: "Contratada Teste",
      archivedAt: null,
      createdAt: "2026-07-20T12:00:00.000Z",
      estimate: { id: "estimate-1", estimateCode: 10 },
      diexRequest: { id: "diex-1", diexCode: 20, diexNumber: "DIEX-TESTE" },
    }],
  },
} as unknown as ProjectDetailsResponse

describe("documentos do projeto", () => {
  it("oferece acesso direto a cada documento e ao As-Built", () => {
    render(
      <MemoryRouter>
        <ProjectDocumentsPanel details={details} />
      </MemoryRouter>,
    )

    expect(
      screen.getAllByRole("link", { name: /Abrir arquivo/ }).map((link) =>
        link.getAttribute("href"),
      ),
    ).toEqual(["https://example.com/as-built", "https://example.com/os-assinada"])

    const links = screen.getAllByRole("link", { name: /Abrir documento/ })
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/estimates/estimate-1",
      "/diex/diex-1",
      "/service-orders/order-1",
    ])
  })
})
