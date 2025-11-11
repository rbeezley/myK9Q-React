# Debug Sync Script

Open DevTools Console and paste this:

```javascript
(async () => {
  const { getReplicationManager } = await import('./src/services/replication/index.ts');
  const manager = getReplicationManager();

  if (manager) {
    const entriesTable = manager.getTable('entries');

    if (entriesTable) {
      // Check sync metadata
      const metadata = await entriesTable.getSyncMetadata();
      console.log('📊 Entries sync metadata:', metadata);

      // Check cached entries
      const cached = await entriesTable.getAll();
      console.log(`📦 Cached entries count: ${cached.length}`);

      // Trigger full sync
      console.log('🔄 Triggering full sync for entries...');
      const licenseKey = 'myK9Q1-a260f472-e0d76a33-4b6c264c';
      const result = await entriesTable.sync(licenseKey);
      console.log('✅ Sync result:', result);

      // Check cache again
      const cachedAfter = await entriesTable.getAll();
      console.log(`📦 Cached entries after sync: ${cachedAfter.length}`);
    } else {
      console.error('❌ Entries table not found in manager');
    }
  } else {
    console.error('❌ Replication manager not initialized');
  }
})();
```
