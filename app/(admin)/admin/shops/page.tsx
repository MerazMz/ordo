'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Skeleton, EmptyState, Toggle } from '@/app/components/ui';
import { CheckIcon, EyeIcon, TrashIcon, PlusIcon, XIcon, QRIcon } from '@/app/components/icons';
import { formatCurrency, formatNumber } from '@/app/lib/utils';
import type { Shop } from '@/app/lib/types';
import ShopQRModal from '@/app/components/ShopQRModal';

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedShopForQR, setSelectedShopForQR] = useState<Shop | null>(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPricePerPageBW, setEditPricePerPageBW] = useState('3');
  const [editPricePerPageColor, setEditPricePerPageColor] = useState('10');
  const [editStaplePrice, setEditStaplePrice] = useState('5');
  const [editSpiralPrice, setEditSpiralPrice] = useState('30');
  const [editLaminationPrice, setEditLaminationPrice] = useState('20');
  const [editBindingPrice, setEditBindingPrice] = useState('25');
  const [editBondPaperPrice, setEditBondPaperPrice] = useState('5');
  const [editDisabledServices, setEditDisabledServices] = useState<string[]>([]);
  const [editCustomServices, setEditCustomServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // Form states
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [pricePerPageBW, setPricePerPageBW] = useState('3');
  const [pricePerPageColor, setPricePerPageColor] = useState('10');
  const [bindingPrice, setBindingPrice] = useState('25');
  const [spiralPrice, setSpiralPrice] = useState('30');
  const [laminationPrice, setLaminationPrice] = useState('20');
  const [staplePrice, setStaplePrice] = useState('5');
  const [bondPaperPrice, setBondPaperPrice] = useState('5');

  const loadShops = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      if (data.success) {
        setShops(data.data);
      }
    } catch (e) {
      console.error('Failed to load shops:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          address,
          shopPhone,
          ownerName,
          ownerEmail,
          ownerPassword,
          ownerPhone,
          pricePerPageBW,
          pricePerPageColor,
          bindingPrice,
          spiralPrice,
          laminationPrice,
          staplePrice,
          bondPaperPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create shop');
      }

      // Success
      setIsModalOpen(false);
      loadShops();

      // Reset form
      setShopName('');
      setAddress('');
      setShopPhone('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('');
      setOwnerPhone('');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (shop: Shop) => {
    setEditingShop(shop);
    setEditName(shop.name);
    setEditAddress(shop.address);
    setEditPhone(shop.phone);
    setEditPricePerPageBW(String(shop.pricePerPageBW));
    setEditPricePerPageColor(String(shop.pricePerPageColor));
    setEditStaplePrice(String(shop.staplePrice));
    setEditSpiralPrice(String(shop.spiralPrice));
    setEditLaminationPrice(String(shop.laminationPrice));
    setEditBindingPrice(String(shop.bindingPrice));
    setEditBondPaperPrice(String(shop.bondPaperPrice || 5));
    setEditDisabledServices(shop.disabledServices || []);
    setEditCustomServices(shop.customServices || []);
    setIsEditModalOpen(true);
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/shops/${editingShop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          address: editAddress,
          phone: editPhone,
          pricePerPageBW: editPricePerPageBW,
          pricePerPageColor: editPricePerPageColor,
          staplePrice: editStaplePrice,
          spiralPrice: editSpiralPrice,
          laminationPrice: editLaminationPrice,
          bindingPrice: editBindingPrice,
          bondPaperPrice: editBondPaperPrice,
          disabledServices: editDisabledServices,
          customServices: editCustomServices,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update shop');
      }

      setIsEditModalOpen(false);
      loadShops();
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
    setEditCustomServices([...editCustomServices, newService]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveCustomService = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setEditCustomServices(editCustomServices.filter((s) => s.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Shops</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage registered print shops and shopkeeper logins</p>
        </div>
        <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={() => setIsModalOpen(true)}>
          Add Print Shop
        </Button>
      </div>

      {/* Table grid */}
      {loading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ) : shops.length === 0 ? (
        <EmptyState
          icon={<PlusIcon size={32} />}
          title="No registered print shops"
          description="Click the button above to register your first print shop and initialize a shopkeeper login."
        />
      ) : (
        <Card padding="none" className="overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Shop</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Owner</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Revenue</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Commission</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Verified</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{shop.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{shop.address}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{shop.ownerName}</td>
                    <td className="px-5 py-3">
                      <Badge variant={shop.status === 'open' ? 'success' : shop.status === 'busy' ? 'warning' : 'error'} dot>
                        {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">{formatCurrency(shop.totalRevenue)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{formatCurrency(shop.commission)}</td>
                    <td className="px-5 py-3">
                      {shop.isVerified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<QRIcon size={14} />}
                          onClick={() => setSelectedShopForQR(shop)}
                        >
                          QR
                        </Button>
                        <Button variant="ghost" size="sm" icon={<EyeIcon size={14} />} onClick={() => handleEditClick(shop)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" icon={<TrashIcon size={14} />} className="text-[var(--error)]">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Shop Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <Card className="w-full max-w-xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] cursor-pointer"
            >
              <XIcon size={18} />
            </button>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add Print Shop</h3>

            <form onSubmit={handleAddShop} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error)]">
                  {error}
                </div>
              )}

              {/* Shop info */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Shop Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Shop Name" placeholder="e.g. Campus Copy Center" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
                  <Input label="Shop Phone" placeholder="e.g. +91 98765 00001" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} required />
                </div>
                <Input label="Address" placeholder="e.g. Ground Floor, Block A" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>

              {/* Owner info */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Shopkeeper Credentials</p>
                <Input label="Shopkeeper Full Name" placeholder="e.g. Rajesh Kumar" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Email address" type="email" placeholder="rajesh@ordo.com" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
                  <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} required />
                </div>
                <Input label="Login Password" type="password" placeholder="••••••••" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} required />
              </div>

              {/* Pricing Defaults */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Default Pricing Rates (₹)</p>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="B&W per page" type="number" step="0.1" value={pricePerPageBW} onChange={(e) => setPricePerPageBW(e.target.value)} required />
                  <Input label="Color per page" type="number" step="0.1" value={pricePerPageColor} onChange={(e) => setPricePerPageColor(e.target.value)} required />
                  <Input label="Staple price" type="number" step="0.1" value={staplePrice} onChange={(e) => setStaplePrice(e.target.value)} required />
                  <Input label="Spiral Binding" type="number" step="0.1" value={spiralPrice} onChange={(e) => setSpiralPrice(e.target.value)} required />
                  <Input label="Lamination" type="number" step="0.1" value={laminationPrice} onChange={(e) => setLaminationPrice(e.target.value)} required />
                  <Input label="Binding price" type="number" step="0.1" value={bindingPrice} onChange={(e) => setBindingPrice(e.target.value)} required />
                  <Input label="Bond Paper price" type="number" step="0.1" value={bondPaperPrice} onChange={(e) => setBondPaperPrice(e.target.value)} required />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
                <Button type="submit" loading={saving}>Save Shop</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Shop Modal */}
      {isEditModalOpen && editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <Card className="w-full max-w-xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              type="button"
            >
              <XIcon size={18} />
            </button>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Edit Shop Details</h2>
            <form onSubmit={handleUpdateShop} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error)]">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Shop Info</p>
                <Input label="Shop Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <Input label="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} required />
                <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
              </div>

              {/* Pricing Section */}
              <div className="space-y-4 pt-3 border-t border-[var(--border-subtle)] text-left">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">Base Printing Rates (₹)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="B&W per page" type="number" step="0.1" value={editPricePerPageBW} onChange={(e) => setEditPricePerPageBW(e.target.value)} required />
                  <Input label="Color per page" type="number" step="0.1" value={editPricePerPageColor} onChange={(e) => setEditPricePerPageColor(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)] text-left">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">Standard Extras (₹)</p>
                <div className="space-y-2">
                  {[
                    { key: 'bondPaper', label: 'Bond Paper', state: editBondPaperPrice, setState: setEditBondPaperPrice },
                    { key: 'staple', label: 'Staple', state: editStaplePrice, setState: setEditStaplePrice },
                    { key: 'spiralBinding', label: 'Spiral Binding', state: editSpiralPrice, setState: setEditSpiralPrice },
                    { key: 'lamination', label: 'Lamination', state: editLaminationPrice, setState: setEditLaminationPrice },
                    { key: 'binding', label: 'Binding', state: editBindingPrice, setState: setEditBindingPrice },
                  ].map((item) => {
                    const isEnabled = !editDisabledServices.includes(item.key);
                    return (
                      <div key={item.key} className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-hover)] gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <Toggle
                            checked={isEnabled}
                            onChange={(checked) => {
                              if (checked) {
                                setEditDisabledServices(editDisabledServices.filter(s => s !== item.key));
                              } else {
                                setEditDisabledServices([...editDisabledServices, item.key]);
                              }
                            }}
                            label={isEnabled ? 'Enabled' : 'Disabled'}
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              step="0.1"
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
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)] text-left">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">Custom Services (₹)</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {editCustomServices.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic">No custom services added.</p>
                  ) : (
                    editCustomServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                        <div className="text-left">
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{service.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Price: ₹{service.price}</p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleRemoveCustomService(service.id, e)}
                          className="text-[var(--error)] hover:bg-[var(--error-bg)]"
                          type="button"
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Inline form to add service */}
                <div className="p-3 rounded-lg border border-dashed border-[var(--border)] space-y-2 bg-[var(--background)]">
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Add New Custom Service</p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="e.g. Glossy Paper Print"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="10.0"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomService}
                      disabled={!newServiceName || !newServicePrice}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">Cancel</Button>
                <Button type="submit" loading={saving}>Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Shop QR Modal */}
      {selectedShopForQR && (
        <ShopQRModal
          isOpen={!!selectedShopForQR}
          onClose={() => setSelectedShopForQR(null)}
          shop={selectedShopForQR}
        />
      )}
    </div>
  );
}
