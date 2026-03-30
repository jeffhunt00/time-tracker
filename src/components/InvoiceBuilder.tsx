import { useState, useMemo } from 'react';
import type { TimeEntry, WaveConfig, InvoiceLineItem } from '../types';
import { formatDuration, formatDecimalHours } from '../utils/time';
import { createInvoice, fetchCustomers } from '../utils/waveApi';
import type { WaveCustomer } from '../utils/waveApi';

type GroupMode = 'task' | 'reference' | 'single';
type Step = 'select' | 'group' | 'confirm';

interface Props {
  entries: TimeEntry[]; // already filtered by project + date
  waveConfig: WaveConfig;
  hourlyRate: number;
  onMarkEntriesBilled: (entryIds: string[], invoiceId: string) => void;
  onOpenWaveSetup: () => void;
}

export function InvoiceBuilder({
  entries,
  waveConfig,
  hourlyRate,
  onMarkEntriesBilled,
  onOpenWaveSetup,
}: Props) {
  const unbilledEntries = entries.filter((e) => e.billedStatus === 'unbilled');

  const [step, setStep] = useState<Step>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(unbilledEntries.map((e) => e.id))
  );
  const [groupMode, setGroupMode] = useState<GroupMode>('task');
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});
  const [customerId, setCustomerId] = useState(waveConfig.defaultCustomerId ?? '');
  const [customerName, setCustomerName] = useState(waveConfig.defaultCustomerName ?? '');
  const [customers, setCustomers] = useState<WaveCustomer[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ id: string; viewUrl: string } | null>(null);

  const selectedEntries = unbilledEntries.filter((e) => selectedIds.has(e.id));
  const totalMinutes = selectedEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalHours = totalMinutes / 60;
  const totalAmount = totalHours * hourlyRate;

  const lineItems: InvoiceLineItem[] = useMemo(() => {
    const groups = new Map<string, TimeEntry[]>();

    for (const entry of selectedEntries) {
      let key: string;
      if (groupMode === 'task') {
        key = entry.task;
      } else if (groupMode === 'reference') {
        key = entry.reference || entry.task;
      } else {
        key = 'All hours';
      }
      const arr = groups.get(key) || [];
      arr.push(entry);
      groups.set(key, arr);
    }

    return Array.from(groups.entries()).map(([groupKey, items]) => {
      const minutes = items.reduce((sum, e) => sum + e.duration, 0);
      const description = editedDescriptions[groupKey] ?? groupKey;
      return {
        description,
        quantity: parseFloat((minutes / 60).toFixed(2)),
        unitPrice: hourlyRate,
        entryIds: items.map((e) => e.id),
      };
    });
  }, [selectedEntries, groupMode, hourlyRate, editedDescriptions]);

  function toggleEntry(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === unbilledEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unbilledEntries.map((e) => e.id)));
    }
  }

  async function loadCustomers() {
    if (!waveConfig.businessId) return;
    try {
      const custs = await fetchCustomers(waveConfig.businessId);
      setCustomers(custs);
    } catch {
      // Silently fail — user can still type
    }
  }

  async function handleSend() {
    if (!waveConfig.businessId || !waveConfig.defaultProductId || !customerId) {
      setError('Missing Wave configuration. Please configure your business, customer, and product in Settings.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const result = await createInvoice(
        waveConfig.businessId,
        customerId,
        invoiceDate,
        lineItems.map((li) => ({
          productId: waveConfig.defaultProductId!,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          description: li.description,
        }))
      );

      const allEntryIds = lineItems.flatMap((li) => li.entryIds);
      onMarkEntriesBilled(allEntryIds, result.id);
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSending(false);
    }
  }

  // Not connected
  if (!waveConfig.connected) {
    return (
      <div className="invoice-builder">
        <div className="invoice-empty">
          <p>Connect to Wave to create invoices from your time entries.</p>
          <button className="btn btn-primary" onClick={onOpenWaveSetup}>
            Open Wave Settings
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="invoice-builder">
        <div className="invoice-success">
          <h3>Invoice Created</h3>
          <p>
            {lineItems.length} line {lineItems.length === 1 ? 'item' : 'items'} totaling{' '}
            {formatDuration(totalMinutes)} (${totalAmount.toFixed(2)})
          </p>
          {success.viewUrl && (
            <a
              href={success.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              View in Wave
            </a>
          )}
          <button
            className="btn btn-small"
            onClick={() => {
              setSuccess(null);
              setStep('select');
              setSelectedIds(new Set(unbilledEntries.map((e) => e.id)));
            }}
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  // No unbilled entries
  if (unbilledEntries.length === 0) {
    return (
      <div className="invoice-builder">
        <div className="invoice-empty">
          <p>No unbilled entries to invoice. All entries have been billed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-builder">
      {error && <div className="wave-error">{error}</div>}

      {/* Step indicator */}
      <div className="invoice-steps">
        {(['select', 'group', 'confirm'] as Step[]).map((s, i) => (
          <button
            key={s}
            className={`invoice-step ${step === s ? 'active' : ''} ${
              ['select', 'group', 'confirm'].indexOf(step) > i ? 'completed' : ''
            }`}
            onClick={() => {
              const currentIdx = ['select', 'group', 'confirm'].indexOf(step);
              if (i <= currentIdx) setStep(s);
            }}
          >
            <span className="invoice-step-num">{i + 1}</span>
            <span className="invoice-step-label">
              {s === 'select' ? 'Select' : s === 'group' ? 'Group' : 'Confirm'}
            </span>
          </button>
        ))}
      </div>

      {/* Step 1: Select entries */}
      {step === 'select' && (
        <div className="invoice-step-content">
          <div className="invoice-select-header">
            <label className="invoice-check-all">
              <input
                type="checkbox"
                checked={selectedIds.size === unbilledEntries.length}
                onChange={toggleAll}
              />
              <span>
                {selectedIds.size} of {unbilledEntries.length} entries selected
              </span>
            </label>
            <span className="invoice-select-total">
              {formatDuration(totalMinutes)} &middot; ${totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="invoice-entry-list">
            {unbilledEntries.map((entry) => (
              <label key={entry.id} className="invoice-entry-row">
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => toggleEntry(entry.id)}
                />
                <span className="invoice-entry-task">{entry.task}</span>
                {entry.reference && (
                  <span className="invoice-entry-ref">{entry.reference}</span>
                )}
                <span className="invoice-entry-duration">
                  {formatDuration(entry.duration)}
                </span>
                <span className="invoice-entry-date">{entry.date}</span>
              </label>
            ))}
          </div>

          <div className="invoice-step-actions">
            <button
              className="btn btn-primary"
              disabled={selectedIds.size === 0}
              onClick={() => setStep('group')}
            >
              Next: Group Line Items
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Group into line items */}
      {step === 'group' && (
        <div className="invoice-step-content">
          <div className="invoice-group-toggle">
            <span className="invoice-group-label">Group by:</span>
            {(['task', 'reference', 'single'] as GroupMode[]).map((m) => (
              <button
                key={m}
                className={`btn btn-small ${groupMode === m ? 'btn-primary' : ''}`}
                onClick={() => setGroupMode(m)}
              >
                {m === 'task' ? 'Task' : m === 'reference' ? 'Reference' : 'One Item'}
              </button>
            ))}
          </div>

          <div className="invoice-line-items">
            {lineItems.map((li, idx) => (
              <div key={idx} className="invoice-line-item">
                <input
                  type="text"
                  className="form-input"
                  value={
                    editedDescriptions[
                      // recover the original group key
                      groupMode === 'task'
                        ? selectedEntries.find((e) => li.entryIds.includes(e.id))?.task ?? ''
                        : groupMode === 'reference'
                          ? selectedEntries.find((e) => li.entryIds.includes(e.id))?.reference ??
                            selectedEntries.find((e) => li.entryIds.includes(e.id))?.task ??
                            ''
                          : 'All hours'
                    ] ?? li.description
                  }
                  onChange={(e) => {
                    const key =
                      groupMode === 'task'
                        ? selectedEntries.find((en) => li.entryIds.includes(en.id))?.task ?? ''
                        : groupMode === 'reference'
                          ? selectedEntries.find((en) => li.entryIds.includes(en.id))?.reference ??
                            selectedEntries.find((en) => li.entryIds.includes(en.id))?.task ??
                            ''
                          : 'All hours';
                    setEditedDescriptions((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }));
                  }}
                />
                <div className="invoice-line-meta">
                  <span>{formatDecimalHours(li.quantity * 60)}h</span>
                  <span>&times; ${li.unitPrice.toFixed(2)}</span>
                  <span className="invoice-line-total">
                    = ${(li.quantity * li.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="invoice-total-row">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>

          <div className="invoice-step-actions">
            <button className="btn" onClick={() => setStep('select')}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setStep('confirm');
                if (customers.length === 0) loadCustomers();
              }}
            >
              Next: Review & Send
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm and send */}
      {step === 'confirm' && (
        <div className="invoice-step-content">
          <div className="invoice-confirm-fields">
            <div className="invoice-field">
              <label className="wave-label">Customer</label>
              {customers.length > 0 ? (
                <select
                  className="form-input"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    const c = customers.find((cu) => cu.id === e.target.value);
                    setCustomerName(c?.name ?? '');
                  }}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="muted">
                  {customerName || 'No customer selected'}{' '}
                  <button className="btn btn-small" onClick={onOpenWaveSetup}>
                    Configure
                  </button>
                </span>
              )}
            </div>

            <div className="invoice-field">
              <label className="wave-label">Invoice Date</label>
              <input
                type="date"
                className="form-input small"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          <div className="invoice-confirm-summary">
            <h4>Line Items</h4>
            {lineItems.map((li, idx) => (
              <div key={idx} className="invoice-confirm-line">
                <span>{li.description}</span>
                <span>
                  {formatDecimalHours(li.quantity * 60)}h &times; ${li.unitPrice.toFixed(2)} ={' '}
                  <strong>${(li.quantity * li.unitPrice).toFixed(2)}</strong>
                </span>
              </div>
            ))}
            <div className="invoice-total-row">
              <span>Total</span>
              <span>
                <strong>${totalAmount.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          <div className="invoice-step-actions">
            <button className="btn" onClick={() => setStep('group')}>
              Back
            </button>
            <button
              className="btn btn-primary"
              disabled={sending || !customerId}
              onClick={handleSend}
            >
              {sending ? 'Creating...' : 'Create Invoice in Wave'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
