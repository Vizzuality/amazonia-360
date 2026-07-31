import * as migration_20251202_124844 from './20251202_124844';
import * as migration_20260210_161015 from './20260210_161015';
import * as migration_20260731_095538_am535_content_collections from './20260731_095538_am535_content_collections';

export const migrations = [
  {
    up: migration_20251202_124844.up,
    down: migration_20251202_124844.down,
    name: '20251202_124844',
  },
  {
    up: migration_20260210_161015.up,
    down: migration_20260210_161015.down,
    name: '20260210_161015',
  },
  {
    up: migration_20260731_095538_am535_content_collections.up,
    down: migration_20260731_095538_am535_content_collections.down,
    name: '20260731_095538_am535_content_collections'
  },
];
