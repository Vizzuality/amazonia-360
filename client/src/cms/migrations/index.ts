import * as migration_20251202_124844 from './20251202_124844';
import * as migration_20260210_161015 from './20260210_161015';
import * as migration_20260803_090559 from './20260803_090559';

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
    up: migration_20260803_090559.up,
    down: migration_20260803_090559.down,
    name: '20260803_090559'
  },
];
