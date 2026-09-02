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
    <Table className="w-full table-fixed text-xs sm:text-sm" containerLabel={containerLabel}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[9%] px-2">Código</TableHead>
          <TableHead className="w-[43%] px-2">Descrição</TableHead>
          <TableHead className="w-[9%] px-2">Unidade</TableHead>
          <TableHead className="w-[11%] px-2 text-right whitespace-normal">Quantidade</TableHead>
          <TableHead className="w-[14%] px-2 text-right whitespace-normal">Valor unitário</TableHead>
          <TableHead className="w-[14%] px-2 text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="px-2 font-medium whitespace-normal break-words">{item.code}</TableCell>
            <TableCell className="px-2 whitespace-normal"><ItemDescription>{item.description}</ItemDescription></TableCell>
            <TableCell className="px-2 whitespace-normal break-words">{item.unit}</TableCell>
            <TableCell className="px-2 text-right whitespace-normal tabular-nums">{item.quantity}</TableCell>
            <TableCell className="px-2 text-right whitespace-normal tabular-nums">{item.unitPrice}</TableCell>
            <TableCell className="px-2 text-right font-semibold whitespace-normal tabular-nums">{item.totalPrice}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
