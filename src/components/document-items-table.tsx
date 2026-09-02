import { ItemDescription } from "@/components/item-description"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type DocumentItem = {
  id: string
  code: string
  description: string
  unit: string
  quantity: string
  unitPrice: string
  totalPrice: string
}

export function DocumentItemsTable({ items, containerLabel }: { items: DocumentItem[]; containerLabel: string }) {
  return (
    <Table className="min-w-[58rem] table-fixed" containerLabel={containerLabel}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Código</TableHead>
          <TableHead className="w-[26rem]">Descrição</TableHead>
          <TableHead className="w-24">Unidade</TableHead>
          <TableHead className="w-28 text-right">Quantidade</TableHead>
          <TableHead className="w-36 text-right">Valor unitário</TableHead>
          <TableHead className="w-36 text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.code}</TableCell>
            <TableCell className="whitespace-normal"><ItemDescription>{item.description}</ItemDescription></TableCell>
            <TableCell>{item.unit}</TableCell>
            <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
            <TableCell className="text-right tabular-nums">{item.unitPrice}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{item.totalPrice}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
