import { BubbleSchema, MockServerEndpoint } from '../../types';

export class MockServerEngine {
  private static isRunning: boolean = false;
  private static port: number = 3333;
  private static store: Record<string, Record<string, any>[]> = {};

  public static initFromSchema(schema?: BubbleSchema | null) {
    if (!schema || schema.dataTypes.length === 0) {
      this.store = {};
      return;
    }
    const newStore: Record<string, Record<string, any>[]> = {};
    for (const dt of schema.dataTypes) {
      const key = dt.name.toLowerCase();
      newStore[key] = [
        {
          _id: `${key}_101`,
          created_date: new Date().toISOString(),
          ...Object.fromEntries(dt.fields.map(f => [
            f.name, 
            f.type === 'number' ? 100 : f.type === 'boolean' ? true : f.name.includes('email') ? 'user@example.com' : `sample_${f.name}`
          ]))
        }
      ];
    }
    this.store = newStore;
  }

  public static getEndpoints(): MockServerEndpoint[] {
    const types = Object.keys(this.store);
    const sampleType = types[0] || 'record';
    return [
      {
        method: 'GET',
        path: '/api/1.1/obj/:type?cursor=0&limit=10',
        description: 'Paginated list of objects by data type (supports cursor, limit, and query filtering)',
        sampleResponse: {
          response: {
            cursor: 0,
            results: this.store[sampleType] || [],
            remaining: 0,
            count: (this.store[sampleType] || []).length
          }
        }
      },
      {
        method: 'GET',
        path: '/api/1.1/obj/:type/:id',
        description: 'Retrieve a single record by unique Bubble identifier',
        sampleResponse: {
          response: this.store[sampleType]?.[0] || { _id: `${sampleType}_101`, status: 'active' }
        }
      },
      {
        method: 'POST',
        path: '/api/1.1/obj/:type',
        description: 'Create a new record in in-memory storage',
        sampleResponse: { status: 'success', id: `${sampleType}_102` }
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
        sampleResponse: { status: 'ok', uptime: 120, loadedTypes: types }
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
