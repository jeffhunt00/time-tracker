export async function fetchWaveStatus(): Promise<{ connected: boolean }> {
  const res = await fetch('/api/wave/status');
  return res.json();
}

export async function disconnectWave(): Promise<void> {
  await fetch('/api/wave/disconnect', { method: 'POST' });
}

async function waveQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/wave/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `Wave API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export interface WaveBusiness {
  id: string;
  name: string;
}

export interface WaveCustomer {
  id: string;
  name: string;
}

export interface WaveProduct {
  id: string;
  name: string;
  unitPrice: number;
}

export async function fetchBusinesses(): Promise<WaveBusiness[]> {
  const data = await waveQuery<{
    businesses: { edges: { node: WaveBusiness }[] };
  }>(`query { businesses { edges { node { id name } } } }`);
  return data.businesses.edges.map((e) => e.node);
}

export async function fetchCustomers(businessId: string): Promise<WaveCustomer[]> {
  const data = await waveQuery<{
    business: { customers: { edges: { node: WaveCustomer }[] } };
  }>(
    `query ($businessId: ID!) {
      business(id: $businessId) {
        customers { edges { node { id name } } }
      }
    }`,
    { businessId }
  );
  return data.business.customers.edges.map((e) => e.node);
}

export async function fetchProducts(businessId: string): Promise<WaveProduct[]> {
  const data = await waveQuery<{
    business: { products: { edges: { node: WaveProduct }[] } };
  }>(
    `query ($businessId: ID!) {
      business(id: $businessId) {
        products { edges { node { id name unitPrice } } }
      }
    }`,
    { businessId }
  );
  return data.business.products.edges.map((e) => e.node);
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  description: string;
}

export interface InvoiceResult {
  id: string;
  viewUrl: string;
}

export async function createInvoice(
  businessId: string,
  customerId: string,
  invoiceDate: string,
  items: InvoiceItem[]
): Promise<InvoiceResult> {
  const data = await waveQuery<{
    invoiceCreate: {
      didSucceed: boolean;
      invoice: { id: string; viewUrl: string } | null;
      inputErrors: { path: string; message: string }[];
    };
  }>(
    `mutation ($input: InvoiceCreateInput!) {
      invoiceCreate(input: $input) {
        didSucceed
        invoice { id viewUrl }
        inputErrors { path message }
      }
    }`,
    {
      input: {
        businessId,
        customerId,
        invoiceDate,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          description: i.description,
        })),
      },
    }
  );

  if (!data.invoiceCreate.didSucceed || !data.invoiceCreate.invoice) {
    const errors = data.invoiceCreate.inputErrors
      .map((e) => `${e.path}: ${e.message}`)
      .join(', ');
    throw new Error(`Invoice creation failed: ${errors}`);
  }

  return data.invoiceCreate.invoice;
}
