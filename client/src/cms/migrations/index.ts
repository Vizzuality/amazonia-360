import * as migration_20251117_082711 from './20251117_082711';
import * as migration_20251117_212242 from './20251117_212242';

export const migrations = [
  {
    up: migration_20251117_082711.up,
    down: migration_20251117_082711.down,
    name: '20251117_082711',
  },
  {
    up: migration_20251117_212242.up,
    down: migration_20251117_212242.down,
    name: '20251117_212242'
  },
];
