import * as SQLite from 'expo-sqlite';
import { Recipient } from '@/store/recipients';

const DB_NAME = 'postscript.db';

export const db = SQLite.openDatabaseSync(DB_NAME);

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS recipients (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      relationship TEXT,
      avatar_url TEXT,
      synced_at INTEGER
    );
  `);
}

export function getLocalRecipients(): Recipient[] {
  const result = db.getAllSync<Recipient>('SELECT * FROM recipients ORDER BY name ASC');
  return result;
}

export function saveLocalRecipients(recipients: Recipient[]) {
  db.withTransactionSync(() => {
    db.execSync('DELETE FROM recipients'); // Simple Strategy: Replace all for full sync
    // For large datasets, this is bad. For personal recipients list (usually < 100), it's fine and robust.

    // Bulk insert
    const statement = db.prepareSync(
      'INSERT INTO recipients (id, name, email, relationship) VALUES ($id, $name, $email, $relationship)',
    );

    for (const r of recipients) {
      statement.executeSync({
        $id: r.id,
        $name: r.name,
        $email: r.email,
        $relationship: r.relationship ?? null,
      });
    }
  });
}

export function addLocalRecipient(r: Recipient) {
  db.runSync('INSERT OR REPLACE INTO recipients (id, name, email, relationship) VALUES (?, ?, ?, ?)', [
    r.id,
    r.name,
    r.email,
    r.relationship ?? null,
  ]);
}

export function deleteLocalRecipient(id: string) {
  db.runSync('DELETE FROM recipients WHERE id = ?', [id]);
}
