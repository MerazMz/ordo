'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Toggle, Skeleton } from '@/app/components/ui';
import type { Shop } from '@/app/lib/types';

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [pricePerPageBW, setPricePerPageBW] = useState('3');
  const [pricePerPageColor, setPricePerPageColor] = useState('10');
  const [staplePrice, setStaplePrice] = useState('5');
  const [spiralPrice, setSpiralPrice] = useState('30');
  const [laminationPrice, setLaminationPrice] = useState('20');
  const [bindingPrice, setBindingPrice] = useState('25');
  const [bondPaperPrice, setBondPaperPrice] = useState('5');
  const [isOpen, setIsOpen] = useState(false);
  const [disabledServices, setDisabledServices] = useState<string[]>([]);
  const [customServices, setCustomServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  useEffect(() => {
    async function loadShopAndSession() {
      try {
        // 1. Fetch current session to get shopId
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        
        if (sessionData.authenticated && sessionData.user.shopId) {
          // 2. Fetch shop details
          const shopRes = await fetch(`/api/shops/${sessionData.user.shopId}`);
          const shopData = await shopRes.json();
          if (shopData.success) {
            const s = shopData.data;
            setShop(s);
            setName(s.name);
            setAddress(s.address);
            setPhone(s.phone);
            setOpenTime(s.operatingHoursOpen);
            setCloseTime(s.operatingHoursClose);
            setPricePerPageBW(String(s.pricePerPageBW));
            setPricePerPageColor(String(s.pricePerPageColor));
            setStaplePrice(String(s.staplePrice));
            setSpiralPrice(String(s.spiralPrice));
            setLaminationPrice(String(s.laminationPrice));
            setBindingPrice(String(s.bindingPrice));
            setBondPaperPrice(String(s.bondPaperPrice || 5));
            setIsOpen(s.status === 'open');
            setDisabledServices(s.disabledServices || []);
            setCustomServices(s.customServices || []);
          }
        }
      } catch (err) {
        console.error('Failed to load shop settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShopAndSession();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          phone,
          status: isOpen ? 'open' : 'closed',
          pricePerPageBW,
          pricePerPageColor,
          staplePrice,
          spiralPrice,
          laminationPrice,
          bindingPrice,
          bondPaperPrice,
          operatingHoursOpen: openTime,
          operatingHoursClose: closeTime,
          disabledServices,
          customServices,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update shop settings');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomService = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    const newService = {
      id: Math.random().toString(36).substring(2, 9),
      name: newServiceName,
      price: parseFloat(newServicePrice) || 0,
    };
    setCustomServices([...customServices, newService]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveCustomService = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setCustomServices(customServices.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-sm text-[var(--text-muted)]">No print shop associated with this account. Contact the administrator.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage your shop status, info, and pricing rules</p>
        </div>
        <Button size="md" loading={saving} type="submit">Save Changes</Button>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] text-xs text-[var(--success)]">
          Settings updated successfully!
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Shop Status */}
      <Card className="animate-fade-in-up">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Shop Status</h3>
        <Toggle
          checked={isOpen}
          onChange={setIsOpen}
          label={isOpen ? 'Shop is Open (Accepting Orders)' : 'Shop is Closed (No Orders allowed)'}
        />
        <p className="text-xs text-[var(--text-muted)] mt-2">
          When closed, students won&apos;t be able to place new orders at your shop.
        </p>
      </Card>

      {/* Shop Info */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Shop Information</h3>
        <div className="space-y-4">
          <Input label="Shop Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Opens At" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} required />
            <Input label="Closes At" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} required />
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5 pb-2 border-b border-[var(--border-subtle)]">
          Base Printing Rates (₹)
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Input label="B&W per page" type="number" step="0.1" value={pricePerPageBW} onChange={(e) => setPricePerPageBW(e.target.value)} required />
          <Input label="Color per page" type="number" step="0.1" value={pricePerPageColor} onChange={(e) => setPricePerPageColor(e.target.value)} required />
        </div>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5 pb-2 border-b border-[var(--border-subtle)]">
          Standard Extras (₹)
        </h3>
        <div className="space-y-4 mb-8">
          {[
            { key: 'bondPaper', label: 'Bond Paper', state: bondPaperPrice, setState: setBondPaperPrice },
            { key: 'staple', label: 'Staple', state: staplePrice, setState: setStaplePrice },
            { key: 'spiralBinding', label: 'Spiral Binding', state: spiralPrice, setState: setSpiralPrice },
            { key: 'lamination', label: 'Lamination', state: laminationPrice, setState: setLaminationPrice },
            { key: 'binding', label: 'Binding', state: bindingPrice, setState: setBindingPrice },
          ].map((item) => {
            const isEnabled = !disabledServices.includes(item.key);
            return (
              <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)] font-normal">Toggle to add or remove this service from your shop</p>
                </div>
                <div className="flex items-center gap-4">
                  <Toggle
                    checked={isEnabled}
                    onChange={(checked) => {
                      if (checked) {
                        setDisabledServices(disabledServices.filter(s => s !== item.key));
                      } else {
                        setDisabledServices([...disabledServices, item.key]);
                      }
                    }}
                    label={isEnabled ? 'Offered' : 'Not Offered'}
                  />
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={item.state}
                      onChange={(e) => item.setState(e.target.value)}
                      disabled={!isEnabled}
                      required={isEnabled}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5 pb-2 border-b border-[var(--border-subtle)]">
          Custom Service Items (₹)
        </h3>
        <div className="space-y-3 mb-6">
          {customServices.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-2">No custom services added. Use the form below to add custom services like Glossy paper, Hardcover, etc.</p>
          ) : (
            customServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{service.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">Price: ₹{service.price}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => handleRemoveCustomService(service.id, e)}
                  className="text-[var(--error)] hover:bg-[var(--error-bg)]"
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Add custom service inline form */}
        <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] space-y-3 text-left">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Add Custom Service</p>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Service Name"
                placeholder="e.g. Glossy Paper Print"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-32">
              <Input
                label="Price (₹)"
                type="number"
                step="0.1"
                placeholder="15.0"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddCustomService}
              disabled={!newServiceName || !newServicePrice}
            >
              Add Service
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
