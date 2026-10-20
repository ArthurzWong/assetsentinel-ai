"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, MapPin, Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";

const TYPE_LABEL: Record<string, string> = {
  factory: "Factory",
  warehouse: "Warehouse",
  depot: "Depot",
  workshop: "Workshop",
};

export default function PropertiesPage() {
  const { state, hydrated } = useStore();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.properties.filter((p) => {
      const matchQ =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.town.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || p.type === typeFilter;
      return matchQ && matchType;
    });
  }, [state.properties, query, typeFilter]);

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle="Demo portfolio of industrial sites in Selangor — fictional premises."
        actions={
          <Link href="/properties/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden /> Add property
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Search by name, town or address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search properties"
          />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by property type" className="sm:w-44">
          <option value="all">All types</option>
          <option value="factory">Factories</option>
          <option value="warehouse">Warehouses</option>
          <option value="depot">Depots</option>
          <option value="workshop">Workshops</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No properties match"
          hint="Try a different search term or clear the type filter. Demo properties: Shah Alam, Klang, Puchong, Rawang."
          action={
            <Link href="/properties/new">
              <Button variant="outline" size="sm">Add a demo property</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <TableWrap>
            <thead>
              <tr className="border-b border-navy-100">
                <Th>Property</Th>
                <Th>Location</Th>
                <Th className="hidden md:table-cell">Type</Th>
                <Th className="hidden lg:table-cell">Roof area</Th>
                <Th className="hidden lg:table-cell">Inspections</Th>
                <Th className="text-right">Detail</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const inspections = state.inspections.filter((i) => i.propertyId === p.id);
                return (
                  <tr key={p.id} className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-600">
                          <Building2 className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                          <Link href={`/properties/detail?id=${p.id}`} className="font-medium text-navy-900 hover:text-teal-700 hover:underline">
                            {p.name}
                          </Link>
                          <p className="text-xs text-navy-400">Built {p.yearBuilt} · {p.roofAreaSqm.toLocaleString()} m² roof</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-navy-300" aria-hidden />
                        {p.town}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <Badge className="border-navy-200 bg-navy-50 text-navy-700">{TYPE_LABEL[p.type] ?? p.type}</Badge>
                    </Td>
                    <Td className="hidden lg:table-cell">{p.roofAreaSqm.toLocaleString()} m²</Td>
                    <Td className="hidden lg:table-cell">{inspections.length}</Td>
                    <Td className="text-right">
                      <Link href={`/properties/detail?id=${p.id}`} className="text-sm font-medium text-teal-700 hover:underline">
                        View
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Card>
      )}
    </div>
  );
}
