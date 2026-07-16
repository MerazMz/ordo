"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Input } from "@/app/components/ui";

export default function AdminSettingsPage() {
  const [commissionRate, setCommissionRate] = useState("10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) {
          setCommissionRate(String(data.data.commissionRate ?? 10));
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveCommission = async () => {
    setFeedback(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: "Commission rate updated successfully." });
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to update commission rate." });
      }
    } catch (e) {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const shopRate = (100 - parseFloat(commissionRate || "0")).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Platform Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Configure platform-wide settings</p>
      </div>

      {feedback && (
        <div
          className={"px-4 py-3 rounded-xl text-sm font-medium border animate-fade-in " + (
            feedback.type === "success"
              ? "bg-[var(--success-bg)] border-[var(--success)] text-[var(--success)]"
              : "bg-[var(--error-bg)] border-[var(--error-border)] text-[var(--error)]"
          )}
        >
          {feedback.message}
        </div>
      )}

      <Card className="animate-fade-in-up">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Commission Settings</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          This percentage is deducted from every transaction as the platform commission.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Commission Percentage (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            disabled={loading}
          />
          <div className="flex items-end">
            <Button onClick={handleSaveCommission} loading={saving} disabled={loading}>
              Update Commission
            </Button>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3 p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-subtle)]">
          <span className="font-semibold">Current rate:</span> Platform takes{" "}
          <span className="text-[var(--accent)] font-bold">{commissionRate}%</span> of every transaction.
          Shopkeeper receives <span className="font-bold">{shopRate}%</span>.
        </p>
      </Card>

      <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Default Pricing Rules</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Pricing rates are configured per-shop. Go to the{" "}
          <span className="text-[var(--accent)] font-medium">Shops</span> section to manage individual shop pricing.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "B&W per page", value: "3 (default)" },
            { label: "Color per page", value: "10 (default)" },
            { label: "Staple", value: "5 (default)" },
            { label: "Spiral Binding", value: "30 (default)" },
            { label: "Lamination", value: "20 (default)" },
            { label: "Bond Paper", value: "5 (default)" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-0.5">{item.label}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">&#8377;{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
