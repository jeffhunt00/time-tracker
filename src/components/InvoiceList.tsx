import { useState } from 'react';
import type { Invoice, TimeEntry, WaveConfig } from '../types';
import { formatDuration, formatDecimalHours } from '../utils/time';
import { createInvoice as createWaveInvoice } from '../utils/waveApi';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';
import { CountPill } from './CountPill';
import { EntryRow } from './EntryRow';
import { DeleteConfirm } from './DeleteConfirm';

interface Props {
  invoices: Invoice[];
  entries: TimeEntry[];
  waveConfig: WaveConfig;
  onUpdateInvoice: (invoiceId: string, fields: { dateInvoiced?: string; status?: 'draft' | 'sent' | 'synced'; waveInvoiceId?: string; waveViewUrl?: string }) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onNewInvoice: () => void;
  onOpenWaveSetup: () => void;
}

export function InvoiceList({
  invoices,
  entries,
  waveConfig,
  onUpdateInvoice,
  onDeleteInvoice,
  onNewInvoice,
  onOpenWaveSetup,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getEntriesForInvoice(invoice: Invoice): TimeEntry[] {
    return invoice.entryIds
      .map((eid) => entries.find((e) => e.id === eid))
      .filter((e): e is TimeEntry => e != null);
  }

  async function handleSyncToWave(invoice: Invoice) {
    if (!waveConfig.connected || !waveConfig.businessId || !waveConfig.defaultProductId || !waveConfig.defaultCustomerId) {
      setError('Wave is not fully configured. Set up your business, customer, and product first.');
      return;
    }

    setSyncingId(invoice.id);
    setError('');

    try {
      const result = await createWaveInvoice(
        waveConfig.businessId,
        waveConfig.defaultCustomerId,
        invoice.dateInvoiced,
        invoice.lineItems.map((li) => ({
          productId: waveConfig.defaultProductId!,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          description: li.description,
        }))
      );

      onUpdateInvoice(invoice.id, {
        status: 'synced',
        waveInvoiceId: result.id,
        waveViewUrl: result.viewUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync to Wave');
    } finally {
      setSyncingId(null);
    }
  }

  const sorted = [...invoices].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="invoice-list">
      <div className="invoice-list-header">
        <h3 className="invoice-list-title">Invoices</h3>
        <Button variant="primary" size="small" onClick={onNewInvoice}>
          New Invoice
        </Button>
      </div>

      {error && <div className="wave-error">{error}</div>}

      {sorted.length === 0 ? (
        <EmptyState className="invoice-empty" message="No invoices yet. Create one from your time entries." />
      ) : (
        <div className="invoice-list-items">
          {sorted.map((invoice) => {
            const expanded = expandedIds.has(invoice.id);
            const invoiceEntries = getEntriesForInvoice(invoice);
            const isSyncing = syncingId === invoice.id;

            return (
              <div key={invoice.id} className="invoice-card">
                <button
                  className="invoice-card-header"
                  onClick={() => toggleExpand(invoice.id)}
                >
                  <span className="summary-group-expand">
                    {expanded ? '\u25BE' : '\u25B8'}
                  </span>
                  <div className="invoice-card-info">
                    {editingDateId === invoice.id ? (
                      <input
                        type="date"
                        className="form-input small"
                        value={invoice.dateInvoiced}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          onUpdateInvoice(invoice.id, { dateInvoiced: e.target.value });
                        }}
                        onBlur={() => setEditingDateId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') setEditingDateId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="invoice-card-date"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDateId(invoice.id);
                        }}
                        title="Click to edit date"
                      >
                        {invoice.dateInvoiced}
                      </span>
                    )}
                    <span className="invoice-card-meta">
                      {formatDuration(invoice.totalMinutes)}
                      <span className="muted"> · {formatDecimalHours(invoice.totalMinutes)}h</span>
                      {invoice.totalAmount > 0 && (
                        <span className="muted"> · ${invoice.totalAmount.toFixed(2)}</span>
                      )}
                    </span>
                  </div>
                  <div className="invoice-card-badges">
                    <StatusBadge status={invoice.status} />
                    <CountPill count={invoice.entryIds.length} />
                  </div>
                </button>

                {expanded && (
                  <div className="invoice-card-body">
                    {/* Line items */}
                    <div className="invoice-card-lines">
                      {invoice.lineItems.map((li, idx) => (
                        <div key={idx} className="invoice-card-line">
                          <span className="invoice-card-line-desc">{li.description}</span>
                          <span className="invoice-card-line-hours">
                            {formatDecimalHours(li.quantity * 60)}h
                          </span>
                          {li.unitPrice > 0 && (
                            <span className="invoice-card-line-amount">
                              ${(li.quantity * li.unitPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Individual entries */}
                    <details className="invoice-card-entries-details">
                      <summary className="muted">
                        {invoiceEntries.length} time entries
                      </summary>
                      <div className="invoice-card-entries">
                        {invoiceEntries
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((e) => (
                            <EntryRow
                              key={e.id}
                              date={e.date}
                              duration={formatDuration(e.duration)}
                              task={e.task}
                              reference={e.reference}
                              description={e.description}
                            />
                          ))}
                      </div>
                    </details>

                    {/* Actions */}
                    <div className="invoice-card-actions">
                      {invoice.status === 'draft' && (
                        <>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => onUpdateInvoice(invoice.id, { status: 'sent' })}
                          >
                            Mark as Sent
                          </Button>
                          {waveConfig.connected && (
                            <Button
                              size="small"
                              disabled={isSyncing}
                              onClick={() => handleSyncToWave(invoice)}
                            >
                              {isSyncing ? 'Sending...' : 'Send to Wave'}
                            </Button>
                          )}
                        </>
                      )}
                      {invoice.status === 'sent' && (
                        <>
                          <Button
                            size="small"
                            onClick={() => onUpdateInvoice(invoice.id, { status: 'draft' })}
                          >
                            Mark as Unsent
                          </Button>
                          {waveConfig.connected && (
                            <Button
                              size="small"
                              disabled={isSyncing}
                              onClick={() => handleSyncToWave(invoice)}
                            >
                              {isSyncing ? 'Sending...' : 'Send to Wave'}
                            </Button>
                          )}
                        </>
                      )}
                      {invoice.status === 'synced' && (
                        <>
                          {invoice.waveViewUrl && (
                            <a
                              href={invoice.waveViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-small"
                            >
                              View in Wave
                            </a>
                          )}
                          <Button
                            size="small"
                            onClick={() => onUpdateInvoice(invoice.id, { status: 'draft' })}
                          >
                            Mark as Unsent
                          </Button>
                        </>
                      )}
                      {!waveConfig.connected && invoice.status !== 'synced' && (
                        <Button size="small" onClick={onOpenWaveSetup}>
                          Send to Wave
                        </Button>
                      )}
                      <DeleteConfirm
                        pending={deleteConfirmId === invoice.id}
                        onRequest={() => setDeleteConfirmId(invoice.id)}
                        onConfirm={() => { onDeleteInvoice(invoice.id); setDeleteConfirmId(null); }}
                        onCancel={() => setDeleteConfirmId(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
