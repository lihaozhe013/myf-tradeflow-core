#!/usr/bin/env python3
"""Migrate invoice_number values into invoice_image_url columns.

This script copies (or optionally overwrites) the value of invoice_number
into invoice_image_url for all rows in inbound_records and outbound_records.

By default it ONLY fills empty (NULL or empty string) invoice_image_url fields.
Use --overwrite to force overwriting any existing non-empty invoice_image_url.

Provides a dry-run summary before applying changes unless --apply is given.
Creates an optional backup of the original database file.

Usage examples:
  python scripts/migrate_invoice_number_to_image.py                  # dry-run
  python scripts/migrate_invoice_number_to_image.py --apply          # migrate
  python scripts/migrate_invoice_number_to_image.py --overwrite --apply
  python scripts/migrate_invoice_number_to_image.py --db data/data.db --apply
  python scripts/migrate_invoice_number_to_image.py --backup-dir backups --apply

Exit codes:
  0 success
  1 unrecoverable error
"""
from __future__ import annotations
import argparse
import os
import shutil
import sqlite3
import sys
from datetime import datetime
from typing import Optional

DEFAULT_DB_RELATIVE = os.path.join('data', 'data.db')

def resolve_db_path(provided: Optional[str]) -> str:
    if provided:
        return provided
    # Try default relative path from project root
    candidate = os.path.abspath(DEFAULT_DB_RELATIVE)
    return candidate

def backup_db(db_path: str, backup_dir: str) -> str:
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
    base = os.path.basename(db_path)
    backup_path = os.path.join(backup_dir, f'{base}.{timestamp}.bak')
    shutil.copy2(db_path, backup_path)
    return backup_path

def get_counts(conn: sqlite3.Connection):
    cur = conn.cursor()
    def count(table: str):
        cur.execute(f'SELECT COUNT(*) FROM {table}')
        return cur.fetchone()[0]
    def pending(table: str, overwrite: bool):
        if overwrite:
            cur.execute(f'''SELECT COUNT(*) FROM {table} WHERE invoice_number IS NOT NULL AND invoice_number <> '' ''')
        else:
            cur.execute(f'''SELECT COUNT(*) FROM {table} WHERE invoice_number IS NOT NULL AND invoice_number <> '' AND (invoice_image_url IS NULL OR invoice_image_url = '') ''')
        return cur.fetchone()[0]
    return {
        'inbound_total': count('inbound_records'),
        'outbound_total': count('outbound_records'),
    }

def compute_pending(conn: sqlite3.Connection, overwrite: bool):
    cur = conn.cursor()
    def pending(table: str):
        if overwrite:
            cur.execute(f'''SELECT COUNT(*) FROM {table} WHERE invoice_number IS NOT NULL AND invoice_number <> '' ''')
        else:
            cur.execute(f'''SELECT COUNT(*) FROM {table} WHERE invoice_number IS NOT NULL AND invoice_number <> '' AND (invoice_image_url IS NULL OR invoice_image_url = '') ''')
        return cur.fetchone()[0]
    return {
        'inbound_to_update': pending('inbound_records'),
        'outbound_to_update': pending('outbound_records'),
    }

def perform_migration(conn: sqlite3.Connection, overwrite: bool) -> dict:
    cur = conn.cursor()
    if overwrite:
        inbound_sql = '''UPDATE inbound_records SET invoice_image_url = invoice_number WHERE invoice_number IS NOT NULL AND invoice_number <> '' '''
        outbound_sql = '''UPDATE outbound_records SET invoice_image_url = invoice_number WHERE invoice_number IS NOT NULL AND invoice_number <> '' '''
    else:
        inbound_sql = '''UPDATE inbound_records SET invoice_image_url = invoice_number WHERE invoice_number IS NOT NULL AND invoice_number <> '' AND (invoice_image_url IS NULL OR invoice_image_url = '') '''
        outbound_sql = '''UPDATE outbound_records SET invoice_image_url = invoice_number WHERE invoice_number IS NOT NULL AND invoice_number <> '' AND (invoice_image_url IS NULL OR invoice_image_url = '') '''
    cur.execute(inbound_sql)
    inbound_changed = cur.rowcount
    cur.execute(outbound_sql)
    outbound_changed = cur.rowcount
    conn.commit()
    return {
        'inbound_changed': inbound_changed,
        'outbound_changed': outbound_changed,
    }

def main():
    parser = argparse.ArgumentParser(description='Migrate invoice_number values into invoice_image_url columns.')
    parser.add_argument('--db', help='Path to SQLite database file (default: data/data.db)')
    parser.add_argument('--apply', action='store_true', help='Apply changes (otherwise dry-run summary only)')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing non-empty invoice_image_url values')
    parser.add_argument('--backup-dir', default=None, help='Directory to store a backup copy of the DB before migration')
    args = parser.parse_args()

    db_path = 'data.db'
    if not os.path.exists(db_path):
        print(f'ERROR: Database file not found: {db_path}', file=sys.stderr)
        sys.exit(1)

    print(f'Database: {db_path}')
    print(f'Overwrite existing invoice_image_url: {args.overwrite}')
    print('Opening database...')
    conn = sqlite3.connect(db_path)

    try:
        counts = get_counts(conn)
        pending = compute_pending(conn, args.overwrite)
        print('\nCurrent totals:')
        for k, v in counts.items():
            print(f'  {k}: {v}')
        print('\nPending updates (invoice_number -> invoice_image_url):')
        for k, v in pending.items():
            print(f'  {k}: {v}')

        if not args.apply:
            print('\nDry run complete. Use --apply to perform migration.')
            return

        if args.backup_dir:
            backup_path = backup_db(db_path, args.backup_dir)
            print(f'Backup created at: {backup_path}')

        print('\nApplying migration...')
        result = perform_migration(conn, args.overwrite)
        print('Migration results:')
        for k, v in result.items():
            print(f'  {k}: {v}')
        print('\nDone.')
    finally:
        conn.close()

if __name__ == '__main__':
    main()
