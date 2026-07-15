'use client';

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Card, Badge, Button, Tabs, Skeleton, EmptyState } from '@/app/components/ui';
import {
  EyeIcon,
  DownloadIcon,
  PrinterIcon,
  CheckCircleIcon,
  FileIcon,
  RefreshIcon,
  QueueIcon,
} from '@/app/components/icons';
import { cn, formatCurrency, formatRelativeTime } from '@/app/lib/utils';
import { getPrintDescription } from '@/app/lib/pricing';
import type { OrderStatus, Order } from '@/app/lib/types';

export default function QueuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        // Only active wait/print/ready states for queue manager
        const queueOrders = data.data
          .filter((o: Order) => ['waiting', 'printing', 'ready'].includes(o.status))
          .sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setOrders(queueOrders);
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    let socket: any;
    let pollInterval: any;

    async function setupRealtime() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        
        if (sessionData.authenticated && sessionData.user.shopId) {
          const shopId = sessionData.user.shopId;
          
          try {
            socket = io({
              reconnectionAttempts: 3,
              timeout: 5000,
            });
            
            socket.on('connect', () => {
              socket.emit('join-shop', shopId);
            });

            socket.on('queue-update', () => {
              // Load latest FCFS orders dynamically in background
              loadQueue(true);
            });

            socket.on('connect_error', () => {
              if (!pollInterval) {
                pollInterval = setInterval(() => loadQueue(true), 5000);
              }
            });
          } catch (e) {
            pollInterval = setInterval(() => loadQueue(true), 5000);
          }
        }
      } catch (err) {
        console.error('Failed to set up realtime queue:', err);
      }
    }

    setupRealtime();

    return () => {
      if (socket) socket.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const tabs = [
    { id: 'all', label: 'All Active', count: orders.length },
    { id: 'waiting', label: 'Waiting', count: orders.filter((i) => i.status === 'waiting').length },
    { id: 'printing', label: 'Printing', count: orders.filter((i) => i.status === 'printing').length },
    { id: 'ready', label: 'Ready', count: orders.filter((i) => i.status === 'ready').length },
  ];

  const filteredItems = orders.filter((item) =>
    activeTab === 'all' ? true : item.status === activeTab
  );

  const viewSingleFile = (fileData: string | null | undefined, fileName: string) => {
    if (!fileData) {
      alert('No file data available.');
      return;
    }
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(
        `<iframe src="${fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      newTab.document.title = fileName;
    }
  };

  const downloadSingleFile = (fileData: string | null | undefined, fileName: string) => {
    if (!fileData) {
      alert('No file data available.');
      return;
    }
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    // 1. Optimistic Update (Immediate UI response)
    let rollbackOrders = orders;
    setOrders((prev) => {
      rollbackOrders = prev;
      if (newStatus === 'collected') {
        return prev.filter((o) => o.id !== orderId);
      } else {
        return prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
      }
    });

    // 2. Network Patch
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      // Rollback to original state on failure
      setOrders(rollbackOrders);
      alert('Network error. Failed to update status on server.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Queue</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage print orders in FCFS order</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshIcon size={14} />} onClick={() => loadQueue(false)} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Queue Items */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<QueueIcon size={32} />}
          title="No active items in queue"
          description={`There are currently no print orders with status "${activeTab === 'all' ? 'active' : activeTab}".`}
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredItems.map((item) => (
            <Card key={item.id} className="animate-fade-in-up">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Queue Number & Student */}
                <div className="flex items-center gap-4 lg:w-64">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-[var(--text-primary)]">#{item.queueNumber}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.studentName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.orderId}</p>
                  </div>
                </div>

                {/* File Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  {item.items.map((file, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon size={14} className="text-[var(--text-secondary)] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{file.fileName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {file.pages} pages · {getPrintDescription(file.printOptions)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center shrink-0">
                        <div className="flex flex-wrap gap-1">
                          {file.printOptions.spiralBinding && <Badge variant="info" className="text-[9px] py-0.5 px-1">Spiral</Badge>}
                          {file.printOptions.lamination && <Badge variant="info" className="text-[9px] py-0.5 px-1">Lamination</Badge>}
                          {file.printOptions.staple && <Badge variant="info" className="text-[9px] py-0.5 px-1">Staple</Badge>}
                          {file.printOptions.bondPaper && <Badge variant="warning" className="text-[9px] py-0.5 px-1">Bond Paper</Badge>}
                        </div>
                        {file.fileData && (
                          <div className="flex gap-1.5 border-l border-[var(--border-subtle)] pl-2">
                            <button
                              onClick={() => viewSingleFile(file.fileData, file.fileName)}
                              className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface)] rounded-md transition-colors cursor-pointer"
                              title="View Document"
                              type="button"
                            >
                              <EyeIcon size={14} />
                            </button>
                            <button
                              onClick={() => downloadSingleFile(file.fileData, file.fileName)}
                              className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface)] rounded-md transition-colors cursor-pointer"
                              title="Download PDF"
                              type="button"
                            >
                              <DownloadIcon size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {item.notes && (
                    <p className="mt-2 text-xs bg-[var(--accent-subtle)] border-l-2 border-[var(--accent)] py-1.5 px-2.5 rounded-r-lg text-[var(--text-secondary)] italic max-w-lg text-left">
                      📝 Note: "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Amount & Status */}
                <div className="flex items-center gap-4 justify-between lg:justify-end">
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatCurrency(item.totalAmount)}
                    </p>
                    <Badge variant="success" className="text-[10px]">Paid</Badge>
                  </div>

                  <Badge
                    variant={
                      item.status === 'ready' ? 'success' :
                      item.status === 'printing' ? 'info' : 'warning'
                    }
                    dot
                    className="flex-shrink-0"
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0 justify-end">
                  {item.status === 'waiting' && (
                    <Button
                      size="sm"
                      icon={<PrinterIcon size={14} />}
                      onClick={() => updateStatus(item.id, 'printing')}
                    >
                      Start Printing
                    </Button>
                  )}
                  {item.status === 'printing' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<CheckCircleIcon size={14} />}
                      onClick={() => updateStatus(item.id, 'ready')}
                      className="text-[var(--success)] border-[var(--success-border)]"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {item.status === 'ready' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<CheckCircleIcon size={14} />}
                      onClick={() => updateStatus(item.id, 'collected')}
                    >
                      Mark Collected
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
