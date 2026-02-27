"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { companiesService } from "@/services/companies.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewCompanyPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [userName, setUserName] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await companiesService.create({
        company: { name: companyName, slug: companySlug, description: companyDesc || undefined },
        user: { name: userName, username: userUsername, email: userEmail, password: userPassword, role: "admin" },
      });
      router.push(`/companies/${result.company.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Company</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Company Details</h2>
          <div className="space-y-4">
            <Input id="cname" label="Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            <Input id="cslug" label="Slug" placeholder="my-company" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} required />
            <Input id="cdesc" label="Description" value={companyDesc} onChange={(e) => setCompanyDesc(e.target.value)} />
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4">First Admin User</h2>
          <div className="space-y-4">
            <Input id="uname" label="Name" value={userName} onChange={(e) => setUserName(e.target.value)} required />
            <Input id="uusername" label="Username" value={userUsername} onChange={(e) => setUserUsername(e.target.value)} required />
            <Input id="uemail" label="Email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
            <Input id="upassword" label="Password" type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
          </div>
        </section>

        {error && <p className="rounded-[var(--radius)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Company"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
