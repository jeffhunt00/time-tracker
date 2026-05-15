import { useState, useMemo } from 'react';
import type { TimeEntry, InvoiceLineItem } from '../types';
import { formatDuration, formatDecimalHours } from '../utils/time';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { StepIndicator } from './StepIndicator';
import { TabBar } from './TabBar';
import { EntryRow } from './EntryRow';

type GroupMode = 'task' | 'reference' | 'single';
type Step = 'select' | 'group' | 'confirm';

interface Props {
  entries: TimeEntry[]; // all project entries (builder filters to unbilled)
  hourlyRate: number;
  onCreateInvoice: (entryIds: string[], lineItems: InvoiceLineItem[], dateInvoiced: string, totalAmount: number, totalMinutes: number) => void;
  onCancel: () => void;
}

export function InvoiceBuilder({
  entries,
  hourlyRate,
  onCreateInvoice,
  onCancel,
}: Props) {
  const unbilledEntries = entries.filter((e) => e.billedStatus === 'unbilled');

  const [step, setStep] = useState<Step>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(unbilledEntries.map((e) => e.id))
  );
  const [groupMode, setGroupMode] = useState<GroupMode>('task');
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );

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

  function handleCreate() {
    const allEntryIds = lineItems.flatMap((li) => li.entryIds);
    onCreateInvoice(allEntryIds, lineItems, invoiceDate, totalAmount, totalMinutes);
  }

  if (unbilledEntries.length === 0) {
    return (
      <div className="invoice-builder">
        <EmptyState
          className="invoice-empty"
          message="No unbilled entries to invoice."
          action={
            <Button size="small" onClick={onCancel}>
              Back to Invoices
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="invoice-builder">
      {/* Step indicator */}
      <StepIndicator
        steps={[
          { value: 'select' as Step, label: 'Select' },
          { value: 'group' as Step, label: 'Group' },
          { value: 'confirm' as Step, label: 'Create' },
        ]}
        activeStep={step}
        onStepClick={setStep}
      />

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
              {formatDuration(totalMinutes)}
              {totalAmount > 0 && <> &middot; ${totalAmount.toFixed(2)}</>}
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
                <EntryRow
                  date={entry.date}
                  duration={formatDuration(entry.duration)}
                  task={entry.task}
                  reference={entry.reference}
                  description={entry.description}
                />
              </label>
            ))}
          </div>

          <div className="invoice-step-actions">
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              variant="primary"
              disabled={selectedIds.size === 0}
              onClick={() => setStep('group')}
            >
              Next: Group Line Items
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Group into line items */}
      {step === 'group' && (
        <div className="invoice-step-content">
          <div className="invoice-group-toggle">
            <span className="invoice-group-label">Group by:</span>
            <TabBar
              items={[
                { value: 'task' as GroupMode, label: 'Task' },
                { value: 'reference' as GroupMode, label: 'Reference' },
                { value: 'single' as GroupMode, label: 'One Item' },
              ]}
              activeValue={groupMode}
              onChange={setGroupMode}
            />
          </div>

          <div className="invoice-line-items">
            {lineItems.map((li, idx) => {
              const groupKey =
                groupMode === 'task'
                  ? selectedEntries.find((e) => li.entryIds.includes(e.id))?.task ?? ''
                  : groupMode === 'reference'
                    ? selectedEntries.find((e) => li.entryIds.includes(e.id))?.reference ??
                      selectedEntries.find((e) => li.entryIds.includes(e.id))?.task ?? ''
                    : 'All hours';

              return (
                <div key={idx} className="invoice-line-item">
                  <input
                    type="text"
                    className="form-input"
                    value={editedDescriptions[groupKey] ?? li.description}
                    onChange={(e) => {
                      setEditedDescriptions((prev) => ({
                        ...prev,
                        [groupKey]: e.target.value,
                      }));
                    }}
                  />
                  <div className="invoice-line-meta">
                    <span>{formatDecimalHours(li.quantity * 60)}h</span>
                    {li.unitPrice > 0 && (
                      <>
                        <span>&times; ${li.unitPrice.toFixed(2)}</span>
                        <span className="invoice-line-total">
                          = ${(li.quantity * li.unitPrice).toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalAmount > 0 && (
            <div className="invoice-total-row">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="invoice-step-actions">
            <Button onClick={() => setStep('select')}>Back</Button>
            <Button variant="primary" onClick={() => setStep('confirm')}>
              Next: Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review and create */}
      {step === 'confirm' && (
        <div className="invoice-step-content">
          <div className="invoice-confirm-fields">
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
                  {formatDecimalHours(li.quantity * 60)}h
                  {li.unitPrice > 0 && (
                    <>
                      {' '}&times; ${li.unitPrice.toFixed(2)} ={' '}
                      <strong>${(li.quantity * li.unitPrice).toFixed(2)}</strong>
                    </>
                  )}
                </span>
              </div>
            ))}
            {totalAmount > 0 && (
              <div className="invoice-total-row">
                <span>Total</span>
                <span>
                  <strong>${totalAmount.toFixed(2)}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="invoice-step-actions">
            <Button onClick={() => setStep('group')}>Back</Button>
            <Button variant="primary" onClick={handleCreate}>
              Create Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
