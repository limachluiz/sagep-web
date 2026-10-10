import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { MentionPicker } from "./mention-picker"

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }))

function Harness() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [inserted, setInserted] = useState("")
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MentionPicker search={search} onSearchChange={setSearch} selected={selected} onSelectedChange={setSelected} onInsert={setInserted} />
    <output>{inserted}</output>
  </QueryClientProvider>
}

describe("MentionPicker", () => {
  beforeEach(() => vi.resetAllMocks())

  it("searches dynamically and inserts the structured user token", async () => {
    vi.mocked(api.get).mockResolvedValue([{ id: "user-2", userCode: 2, name: "Maria Lima", warName: "Lima", email: "maria@example.test", role: "PROJETISTA" }])
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByPlaceholderText(/Pesquisar por nome/), "Lima")
    const candidate = await screen.findByRole("button", { name: "Lima · USR-2" })
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining("search=Lima"))
    await user.click(candidate)
    expect(screen.getByText("@USR-2")).toBeInTheDocument()
  })
})
