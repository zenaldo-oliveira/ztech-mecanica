"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerFormSheet } from "@/components/customers/customer-form-sheet";
import { CustomersPagination } from "@/components/customers/customers-pagination";
import { CustomersTable } from "@/components/customers/customers-table";
import {
  CustomersToolbar,
  type CustomerStatusFilter,
  type PersonTypeFilter,
} from "@/components/customers/customers-toolbar";
import { customers as initialCustomers, type Customer } from "@/lib/mock/customers";
import { onlyDigits } from "@/lib/format-document";

const PAGE_SIZE = 8;

export function CustomersView() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>(initialCustomers);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("ALL");
  const [personTypeFilter, setPersonTypeFilter] = useState<PersonTypeFilter>("ALL");
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const filteredCustomers = useMemo(() => {
    const searchDigits = onlyDigits(search);
    const searchLower = search.trim().toLowerCase();

    return allCustomers.filter((customer) => {
      const matchesStatus = statusFilter === "ALL" || customer.status === statusFilter;
      const matchesPersonType = personTypeFilter === "ALL" || customer.personType === personTypeFilter;

      const matchesSearch =
        searchLower === "" ||
        customer.name.toLowerCase().includes(searchLower) ||
        (searchDigits !== "" && customer.document.includes(searchDigits));

      return matchesStatus && matchesPersonType && matchesSearch;
    });
  }, [allCustomers, search, statusFilter, personTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleNewCustomer() {
    setEditingCustomer(undefined);
    setIsFormOpen(true);
  }

  function handleEditCustomer(customer: Customer) {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  }

  function handleSubmitCustomer(customer: Customer) {
    setAllCustomers((previous) => {
      const exists = previous.some((item) => item.id === customer.id);
      if (exists) {
        return previous.map((item) => (item.id === customer.id ? customer : item));
      }
      return [...previous, customer];
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Cadastro, consulta e histórico dos clientes da oficina."
        actions={
          <Button size="sm" onClick={handleNewCustomer}>
            <Plus />
            Novo cliente
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-5">
        <CustomersToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          personTypeFilter={personTypeFilter}
          onPersonTypeFilterChange={setPersonTypeFilter}
        />

        <div className="flex flex-col">
          <CustomersTable customers={paginatedCustomers} onEdit={handleEditCustomer} />

          <CustomersPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <CustomerFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={editingCustomer}
        onSubmit={handleSubmitCustomer}
      />
    </div>
  );
}
