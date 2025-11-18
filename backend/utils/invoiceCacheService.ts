import fs from 'fs';
import path from 'path';
import db from '@/db.js';
import decimalCalc from '@/utils/decimalCalculator';
import { logger } from '@/utils/logger';
import { getDataDir } from '@/utils/paths';

const CACHE_FILE_NAME = 'invoice-cache.json';

interface InvoicedRecord {
  invoice_number: string;
  invoice_date: string | null;
  total_amount: number;
  record_count: number;
}

interface InvoiceCacheData {
  [customer_code: string]: {
    invoiced_records: InvoicedRecord[];
    last_updated: string;
  };
}

class InvoiceCacheService {
  private cachePath: string;
  private cache: InvoiceCacheData;

  constructor() {
    this.cachePath = path.join(getDataDir(), CACHE_FILE_NAME);
    this.cache = this.loadCache();
  }

  /**
   * Load cache from file
   */
  private loadCache(): InvoiceCacheData {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = fs.readFileSync(this.cachePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error(`Failed to load invoice cache: ${error}`);
    }
    return {};
  }

  /**
   * Save cache to file
   */
  private saveCache(): void {
    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), 'utf-8');
      logger.info('Invoice cache saved successfully');
    } catch (error) {
      logger.error(`Failed to save invoice cache: ${error}`);
      throw error;
    }
  }

  /**
   * Refresh cache for a specific customer (outbound/receivable)
   */
  public refreshCustomerCache(customer_code: string): Promise<InvoicedRecord[]> {
    return this.refreshCache(customer_code, 'outbound_records', 'customer_code');
  }

  /**
   * Refresh cache for a specific supplier (inbound/payable)
   */
  public refreshSupplierCache(supplier_code: string): Promise<InvoicedRecord[]> {
    return this.refreshCache(supplier_code, 'inbound_records', 'supplier_code');
  }

  /**
   * Generic refresh cache method
   */
  private refreshCache(code: string, tableName: string, codeColumn: string): Promise<InvoicedRecord[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          invoice_number,
          MIN(invoice_date) as invoice_date,
          SUM(total_price) as total_amount,
          COUNT(*) as record_count
        FROM ${tableName}
        WHERE ${codeColumn} = ? 
          AND invoice_number IS NOT NULL 
          AND invoice_number != ''
        GROUP BY invoice_number
        ORDER BY MIN(invoice_date) DESC
      `;

      db.all<{
        invoice_number: string;
        invoice_date: string | null;
        total_amount: number | null;
        record_count: number;
      }>(sql, [code], (err, rows) => {
        if (err) {
          logger.error(`Failed to refresh invoice cache for ${code}: ${err.message}`);
          reject(err);
          return;
        }

        const invoicedRecords: InvoicedRecord[] = rows.map(row => ({
          invoice_number: row.invoice_number,
          invoice_date: row.invoice_date,
          total_amount: decimalCalc.fromSqlResult(row.total_amount, 0),
          record_count: row.record_count,
        }));

        this.cache[code] = {
          invoiced_records: invoicedRecords,
          last_updated: new Date().toISOString(),
        };

        this.saveCache();
        resolve(invoicedRecords);
      });
    });
  }

  /**
   * Get cached invoiced records for a customer
   */
  public getCachedInvoicedRecords(customer_code: string): InvoicedRecord[] | null {
    const customerCache = this.cache[customer_code];
    if (!customerCache) {
      return null;
    }
    return customerCache.invoiced_records;
  }

  /**
   * Get last update time for a customer
   */
  public getLastUpdateTime(customer_code: string): string | null {
    const customerCache = this.cache[customer_code];
    if (!customerCache) {
      return null;
    }
    return customerCache.last_updated;
  }

  /**
   * Clear cache for a specific customer
   */
  public clearCustomerCache(customer_code: string): void {
    delete this.cache[customer_code];
    this.saveCache();
  }

  /**
   * Clear all cache
   */
  public clearAllCache(): void {
    this.cache = {};
    this.saveCache();
  }
}

export default new InvoiceCacheService();
