import { MockServerEndpoint } from '../../types';

export class MockServerEngine {
  private static isRunning: boolean = false;
  private static port: number = 3333;
  private static store: Record<string, Record<string, any>[]> = {
    user: [
      { _id: 'usr_101', email: 'admin@bubble.io', first_name: 'Alex', role: 'Admin', created_date: '2026-08-01T10:00:00Z' },
      { _id: 'usr_102', email: 'sarah@bubble.io', first_name: 'Sarah', role: 'Manager', created_date: '2026-08-02T11:30:00Z' },
      { _id: 'usr_103', email: 'john@example.com', first_name: 'John', role: 'Customer', created_date: '2026-08-03T14:15:00Z' }
    ],
    product: [
      { _id: 'prd_201', title: 'MacBook Pro M3 Max', price: 3499, sku: 'MBP-M3-16', inventory_count: 12 },
      { _id: 'prd_202', title: 'Ergonomic Standing Desk', price: 650, sku: 'DSK-ST-02', inventory_count: 8 },
      { _id: 'prd_203', title: '4K UltraWide Monitor', price: 899, sku: 'MON-4K-34', inventory_count: 24 }
    ],
    order: [
      { _id: 'ord_301', order_number: 'ORD-98214', total_amount: 4149, status: 'Processing', stripe_charge_id: 'ch_3N18xyz' },
      { _id: 'ord_302', order_number: 'ORD-98215', total_amount: 899, status: 'Delivered', stripe_charge_id: 'ch_3N19abc' }
    ]
  };

  public static getEndpoints(): MockServerEndpoint[] {
    return [
      {
        method: 'GET',
        path: '/api/1.1/obj/:type?cursor=0&limit=10',
        description: 'Paginated list of objects by data type (supports cursor, limit, and query filtering)',
        sampleResponse: {
          response: {
            cursor: 0,
            results: [{ _id: 'usr_101', email: 'admin@bubble.io', first_name: 'Alex' }],
            remaining: 2,
            count: 1
          }
        }
      },
      {
        method: 'GET',
        path: '/api/1.1/obj/:type/:id',
        description: 'Retrieve a single record by unique Bubble identifier',
        sampleResponse: {
          response: { _id: 'usr_101', email: 'admin@bubble.io', first_name: 'Alex', role: 'Admin' }
        }
      },
      {
        method: 'POST',
        path: '/api/1.1/obj/:type',
        description: 'Create a new record in in-memory storage',
        sampleResponse: { status: 'success', id: 'usr_104' }
      },
      {
        method: 'PATCH',
        path: '/api/1.1/obj/:type/:id',
        description: 'Update fields of an existing record',
        sampleResponse: { status: 'success' }
      },
      {
        method: 'DELETE',
        path: '/api/1.1/obj/:type/:id',
        description: 'Permanently remove a record from in-memory mock storage',
        sampleResponse: { status: 'success' }
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Mock server operational status and loaded entity types',
        sampleResponse: { status: 'ok', uptime: 120, loadedTypes: ['user', 'product', 'order'] }
      }
    ];
  }

  public static getStatus(): { isRunning: boolean; port: number; loadedTypes: string[]; totalRecords: number } {
    const loadedTypes = Object.keys(this.store);
    const totalRecords = Object.values(this.store).reduce((sum, arr) => sum + arr.length, 0);
    return {
      isRunning: this.isRunning,
      port: this.port,
      loadedTypes,
      totalRecords
    };
  }

  public static startServer(port: number = 3333): { success: boolean; port: number } {
    this.isRunning = true;
    this.port = port;
    return { success: true, port };
  }

  public static stopServer(): { success: boolean } {
    this.isRunning = false;
    return { success: true };
  }

  /**
   * Dispatches an in-memory simulated request to test the mock endpoints live in the GUI
   */
  public static simulateRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    type: string,
    id?: string,
    body?: any
  ): { status: number; data: any } {
    const tableKey = type.toLowerCase();
    const records = this.store[tableKey] || [];

    if (method === 'GET') {
      if (id) {
        const item = records.find(r => r._id === id);
        if (!item) return { status: 404, data: { error: 'Record not found' } };
        return { status: 200, data: { response: item } };
      } else {
        return {
          status: 200,
          data: {
            response: {
              cursor: 0,
              results: records,
              remaining: 0,
              count: records.length
            }
          }
        };
      }
    }

    if (method === 'POST') {
      const newId = `${tableKey}_${Date.now()}`;
      const newRecord = { _id: newId, ...body, created_date: new Date().toISOString() };
      this.store[tableKey] = [newRecord, ...records];
      return { status: 201, data: { status: 'success', id: newId } };
    }

    if (method === 'PATCH' && id) {
      const index = records.findIndex(r => r._id === id);
      if (index === -1) return { status: 404, data: { error: 'Record not found' } };
      this.store[tableKey][index] = { ...this.store[tableKey][index], ...body, modified_date: new Date().toISOString() };
      return { status: 200, data: { status: 'success' } };
    }

    if (method === 'DELETE' && id) {
      this.store[tableKey] = records.filter(r => r._id !== id);
      return { status: 200, data: { status: 'success' } };
    }

    return { status: 400, data: { error: 'Unsupported mock operation' } };
  }
}
