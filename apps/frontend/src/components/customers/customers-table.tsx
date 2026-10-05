import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, UserX, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCan } from "@/components/auth/session-provider";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { customerCode, type Customer } from "@/lib/api/customers";
import { personTypeLabels } from "@/lib/customer-options";
import { formatDocument, formatPhone } from "@/lib/format-document";

interface CustomersTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CustomersTable({ customers, onEdit, onDeactivate }: CustomersTableProps) {
  // Somente para adaptar a interface: o backend sempre reaplica a autorização.
  const canUpdate = useCan("customers.update");
  const canDeactivate = useCan("customers.delete");

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum cliente encontrado"
        description="Ajuste a pesquisa ou os filtros para encontrar o cliente que você procura."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/40 hover:bg-transparent">
          <TableHead className="px-4 text-xs font-medium text-muted-foreground">Cliente</TableHead>
          <TableHead className="hidden px-4 text-xs font-medium text-muted-foreground md:table-cell">
            Documento
          </TableHead>
          <TableHead className="hidden px-4 text-xs font-medium text-muted-foreground md:table-cell">
            Contato
          </TableHead>
          <TableHead className="px-4 text-xs font-medium text-muted-foreground">Status</TableHead>
          <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow
            key={customer.id}
            className="group border-border/40 transition-colors duration-150 hover:bg-muted/30"
          >
            <TableCell className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar size="sm" className="shrink-0">
                  <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{customer.name}</span>
                  <span className="text-xs text-muted-foreground/70">
                    {customerCode(customer.number)} · {personTypeLabels[customer.personType]}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden px-4 py-3 text-xs text-muted-foreground/80 md:table-cell">
              {formatDocument(customer.document, customer.personType)}
            </TableCell>
            <TableCell className="hidden px-4 py-3 text-xs text-muted-foreground/80 md:table-cell">
              {formatPhone(customer.phone)}
            </TableCell>
            <TableCell className="px-4 py-3">
              <CustomerStatusBadge status={customer.status} />
            </TableCell>
            <TableCell className="px-4 py-3 text-right">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 [@media(hover:none)]:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 hover:text-foreground"
                        aria-label={`Ações para ${customer.name}`}
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="left">Mais ações</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/customers/${customer.id}`}>
                      <Eye />
                      Visualizar
                    </Link>
                  </DropdownMenuItem>
                  {canUpdate ? (
                    <DropdownMenuItem onSelect={() => onEdit(customer)}>
                      <Pencil />
                      Editar
                    </DropdownMenuItem>
                  ) : null}
                  {canDeactivate && customer.status !== "INACTIVE" ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => onDeactivate(customer)}>
                        <UserX />
                        Inativar
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
