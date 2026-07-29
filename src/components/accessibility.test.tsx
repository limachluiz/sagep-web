import { render } from "@testing-library/react"
import { FolderKanban } from "lucide-react"
import { describe, it } from "vitest"

import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { expectNoAccessibilityViolations } from "@/test/accessibility"

describe("fundamentos de acessibilidade", () => {
  it("mantém cabeçalho, filtros e tabela sem violações automáticas", async () => {
    const { container } = render(
      <main>
        <PageHeader
          eyebrow="Portfólio"
          title="Projetos de infraestrutura"
          description="Acompanhe o fluxo operacional."
          icon={FolderKanban}
          actions={<Button>Novo projeto</Button>}
        />

        <FilterToolbar>
          <SearchField aria-label="Buscar projetos" />
        </FilterToolbar>

        <Table containerLabel="Projetos encontrados">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Projeto</TableHead>
              <TableHead scope="col">Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>PRJ-001</TableCell>
              <TableCell>Em execução</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </main>,
    )

    await expectNoAccessibilityViolations(container)
  })
})
