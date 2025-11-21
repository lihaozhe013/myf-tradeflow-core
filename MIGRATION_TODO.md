# Migration TODO: sqlite3 → better-sqlite3

## Status: Phase 1-6 Complete ✅ | Testing in Progress

### Phase 1: Dependencies ✅
- [x] Update package.json to replace sqlite3 with better-sqlite3
- [x] Add @types/better-sqlite3
- [x] Install dependencies (npm install)

### Phase 2: Core Database Module ✅
- [x] Update backend/db.ts
- [x] Update backend/utils/dbUpgrade.ts
- [x] Update backend/utils/dbSchema.ts (no changes needed)
- [x] Configure WAL mode for multi-threading support
- [x] Configure busy_timeout for write queueing
- [x] Add performance optimizations (synchronous, cache_size)

### Phase 3: Utility Services ✅
- [x] Update backend/utils/inventoryCacheService.ts
- [x] Update backend/utils/invoiceCacheService.ts

### Phase 4: Main Route Files ✅
- [x] Update backend/routes/inbound.ts
- [x] Update backend/routes/outbound.ts
- [x] Update backend/routes/inventory.ts
- [x] Update backend/routes/partners.ts
- [x] Update backend/routes/products.ts
- [x] Update backend/routes/productPrices.ts
- [x] Update backend/routes/receivable.ts
- [x] Update backend/routes/payable.ts
- [x] Update backend/routes/overview.ts
- [x] Update backend/routes/about.ts (no DB calls)
- [x] Update backend/routes/dbBackup.ts (async/await pattern)

### Phase 5: Analysis Route Files ✅
- [x] Update backend/routes/analysis/analysis.ts
- [x] Update backend/routes/analysis/utils/dataQueries.ts
- [x] Update backend/routes/analysis/utils/salesCalculator.ts
- [x] Update backend/routes/analysis/utils/costCalculator.ts
- [x] Update backend/routes/analysis/utils/detailAnalyzer.ts (no DB calls)

### Phase 6: Export Route Files ✅
- [x] Update backend/routes/export/index.ts (no DB calls)
- [x] Update backend/routes/export/utils/analysisQueries.ts
- [x] Update backend/routes/export/utils/basicDataQueries.ts
- [x] Update backend/routes/export/utils/invoiceQueries.ts
- [x] Update backend/routes/export/utils/payableQueries.ts
- [x] Update backend/routes/export/utils/receivableQueries.ts
- [x] Update backend/routes/export/utils/transactionQueries.ts

### Phase 7: Testing ⏳
- [x] Build test (npm run build) - PASSED ✅
- [ ] Test database initialization
- [ ] Test CRUD operations in all routes
- [ ] Test inventory cache refresh
- [ ] Test invoice cache operations
- [ ] Test batch operations
- [ ] Test export functionality
- [ ] Test analysis functionality
- [ ] Performance benchmarking

### Phase 8: Documentation ⏳
- [ ] Update README.md if needed
- [ ] Update any database-related documentation

## Key Changes Summary

### API Transformations

#### Query Operations
```typescript
// OLD: db.all(sql, params, (err, rows) => {...})
// NEW: db.prepare(sql).all(...params)

// OLD: db.get(sql, params, (err, row) => {...})
// NEW: db.prepare(sql).get(...params)
```

#### Insert Operations
```typescript
// OLD: db.run(sql, params, function(err) { this.lastID })
// NEW: const result = db.prepare(sql).run(...params); result.lastInsertRowid
```

#### Update/Delete Operations
```typescript
// OLD: db.run(sql, params, function(err) { this.changes })
// NEW: const result = db.prepare(sql).run(...params); result.changes
```

#### Batch Operations
```typescript
// OLD: stmt.finalize((err) => {...})
// NEW: No finalize needed (auto cleanup)
// BETTER: Use transactions for batches
```

### Multi-threading Configuration

The database is now configured for PM2 cluster mode and Kubernetes:

```typescript
db.pragma('journal_mode = WAL');      // Multiple readers + queued writes
db.pragma('busy_timeout = 5000');     // Wait 5s instead of immediate error
db.pragma('synchronous = NORMAL');    // Performance + safety balance
db.pragma('cache_size = -64000');     // 64MB cache per connection
```

**Benefits:**
- ✅ Multiple workers can read simultaneously
- ✅ Write operations are automatically queued (no lost writes)
- ✅ 5-second retry window for write conflicts
- ✅ Each PM2 worker gets its own optimized connection
- ✅ 2-3x faster than sqlite3

See `docs/MULTI_THREADING.md` for detailed explanation.

## Notes
- better-sqlite3 is synchronous - much simpler code!
- Use try-catch instead of callback error handling
- Transactions are recommended for batch operations
- Database file format remains compatible
