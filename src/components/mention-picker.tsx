import { useQuery } from "@tanstack/react-query";
import { AtSign, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Candidate = {
  id: string;
  userCode: number;
  name: string;
  warName: string | null;
  email: string;
  role: string;
};

export function MentionPicker({
  projectId,
  search,
  onSearchChange,
  selected,
  onSelectedChange,
  onInsert,
}: {
  projectId?: string;
  search: string;
  onSearchChange: (value: string) => void;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  onInsert: (token: string) => void;
}) {
  const query = useQuery({
    queryKey: ["mention-candidates", projectId ?? "new", search],
    queryFn: () => {
      const params = new URLSearchParams({ search });
      if (projectId) params.set("projectId", projectId);
      return api.get<Candidate[]>(
        `/notifications/mention-candidates?${params}`,
      );
    },
    enabled: search.trim().length > 0,
  });
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AtSign className="size-4 text-primary" />
        Mencionar pessoas
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Pesquisar por nome, nome de guerra, e-mail ou código"
        />
      </div>
      {query.isError && (
        <p className="text-xs text-destructive">
          Não foi possível consultar as pessoas disponíveis.
        </p>
      )}
      <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
        {query.data?.map((person) => {
          const active = selected.includes(person.id);
          return (
            <Button
              key={person.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => {
                onSelectedChange(
                  active
                    ? selected.filter((id) => id !== person.id)
                    : [...selected, person.id],
                );
                if (!active) onInsert(`@USR-${person.userCode}`);
              }}
            >
              {person.warName || person.name} · USR-{person.userCode}
            </Button>
          );
        })}
        {search && query.isSuccess && !query.data.length && (
          <p className="text-xs text-muted-foreground">
            Nenhuma pessoa autorizada encontrada.
          </p>
        )}
      </div>
    </div>
  );
}
