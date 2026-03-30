import { useState, useEffect, useCallback } from 'react';
import type { WaveConfig } from '../types';
import {
  fetchWaveStatus,
  fetchBusinesses,
  fetchCustomers,
  fetchProducts,
  disconnectWave,
} from '../utils/waveApi';
import type { WaveBusiness, WaveCustomer, WaveProduct } from '../utils/waveApi';

interface Props {
  waveConfig: WaveConfig;
  onUpdateConfig: (config: Partial<WaveConfig>) => void;
  onClose: () => void;
}

export function WaveSetup({ waveConfig, onUpdateConfig, onClose }: Props) {
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<WaveBusiness[]>([]);
  const [customers, setCustomers] = useState<WaveCustomer[]>([]);
  const [products, setProducts] = useState<WaveProduct[]>([]);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [hourlyRate, setHourlyRate] = useState(
    waveConfig.defaultHourlyRate?.toString() ?? ''
  );

  const checkStatus = useCallback(async () => {
    try {
      const { connected } = await fetchWaveStatus();
      setServerConnected(connected);
      onUpdateConfig({ connected });
    } catch {
      setServerConnected(false);
    }
  }, [onUpdateConfig]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!serverConnected || !waveConfig.businessId) return;
    loadCustomersAndProducts(waveConfig.businessId);
  }, [serverConnected, waveConfig.businessId]);

  async function loadBusinesses() {
    setLoading('Loading businesses...');
    setError('');
    try {
      const biz = await fetchBusinesses();
      setBusinesses(biz);
      if (biz.length === 1 && !waveConfig.businessId) {
        onUpdateConfig({ businessId: biz[0].id, businessName: biz[0].name });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setLoading('');
    }
  }

  async function loadCustomersAndProducts(businessId: string) {
    setLoading('Loading customers & products...');
    setError('');
    try {
      const [custs, prods] = await Promise.all([
        fetchCustomers(businessId),
        fetchProducts(businessId),
      ]);
      setCustomers(custs);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading('');
    }
  }

  async function handleConnect() {
    window.location.href = '/api/wave/auth';
  }

  async function handleDisconnect() {
    await disconnectWave();
    onUpdateConfig({
      connected: false,
      businessId: undefined,
      businessName: undefined,
      defaultCustomerId: undefined,
      defaultCustomerName: undefined,
      defaultProductId: undefined,
      defaultProductName: undefined,
    });
    setServerConnected(false);
    setBusinesses([]);
    setCustomers([]);
    setProducts([]);
  }

  function handleBusinessChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const biz = businesses.find((b) => b.id === id);
    onUpdateConfig({
      businessId: id || undefined,
      businessName: biz?.name,
      defaultCustomerId: undefined,
      defaultCustomerName: undefined,
      defaultProductId: undefined,
      defaultProductName: undefined,
    });
    if (id) loadCustomersAndProducts(id);
  }

  function handleCustomerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const cust = customers.find((c) => c.id === id);
    onUpdateConfig({
      defaultCustomerId: id || undefined,
      defaultCustomerName: cust?.name,
    });
  }

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const prod = products.find((p) => p.id === id);
    onUpdateConfig({
      defaultProductId: id || undefined,
      defaultProductName: prod?.name,
    });
  }

  function handleRateBlur() {
    const rate = parseFloat(hourlyRate);
    onUpdateConfig({ defaultHourlyRate: isNaN(rate) ? undefined : rate });
  }

  return (
    <div className="wave-setup-overlay" onClick={onClose}>
      <div className="wave-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wave-setup-header">
          <h2>Wave Integration</h2>
          <button className="btn btn-small" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="wave-error">{error}</div>}
        {loading && <div className="wave-loading">{loading}</div>}

        {/* Connection status */}
        <div className="wave-setup-section">
          <label className="wave-label">Connection</label>
          {serverConnected === null ? (
            <span className="muted">Checking...</span>
          ) : serverConnected ? (
            <div className="wave-connected">
              <span className="wave-status-dot connected" />
              <span>Connected to Wave</span>
              <button className="btn btn-small" onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleConnect}>
              Connect to Wave
            </button>
          )}
        </div>

        {/* Only show config if connected */}
        {serverConnected && (
          <>
            {/* Business */}
            <div className="wave-setup-section">
              <label className="wave-label">Business</label>
              {businesses.length === 0 ? (
                <button className="btn btn-small" onClick={loadBusinesses}>
                  Load Businesses
                </button>
              ) : (
                <select
                  className="form-input"
                  value={waveConfig.businessId ?? ''}
                  onChange={handleBusinessChange}
                >
                  <option value="">Select business...</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Customer */}
            {waveConfig.businessId && (
              <div className="wave-setup-section">
                <label className="wave-label">Default Customer</label>
                <select
                  className="form-input"
                  value={waveConfig.defaultCustomerId ?? ''}
                  onChange={handleCustomerChange}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Product */}
            {waveConfig.businessId && (
              <div className="wave-setup-section">
                <label className="wave-label">Default Product/Service</label>
                <select
                  className="form-input"
                  value={waveConfig.defaultProductId ?? ''}
                  onChange={handleProductChange}
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hourly rate */}
            <div className="wave-setup-section">
              <label className="wave-label">Default Hourly Rate ($)</label>
              <input
                type="number"
                className="form-input small"
                placeholder="150"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                onBlur={handleRateBlur}
                min="0"
                step="0.01"
              />
              <span className="muted wave-rate-hint">
                Can be overridden per project
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
