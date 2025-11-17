import * as migration_20251117_082711 from './20251117_082711';

export const migrations = [
  {
    up: migration_20251117_082711.up,
    down: migration_20251117_082711.down,
    name: '20251117_082711'
  },
];
