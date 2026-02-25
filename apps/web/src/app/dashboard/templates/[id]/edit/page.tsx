"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { roleService } from "@/services/role.service";
import { RoleForm } from "../../_components/RoleForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { companyService } from "@/services/company.service";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();

  const { data: role, isLoading } = useQuery({
    queryKey: ["role", id],
    queryFn: () => roleService.getById(Number(id)),
  });

  const { data: company } = useQuery({
    queryKey: ["company"],
    queryFn: companyService.get,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">
          Template not found.
        </p>
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="sm" className="mt-3">
            Back to Templates
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Edit Template
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Update the template details below
            </p>
          </div>
        </div>
        <a href={`/${company?.slug}/${role.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>

      <RoleForm role={role} />
    </div>
  );
}
