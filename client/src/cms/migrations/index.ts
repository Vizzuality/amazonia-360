import * as migration_20251117_082711 from './20251117_082711';
import * as migration_20251117_212242 from './20251117_212242';
import * as migration_20251120_153912 from './20251120_153912';
import * as migration_20251128_130617 from './20251128_130617';
import * as migration_20251202_104535 from './20251202_104535';

export const migrations = [
  {
    up: migration_20251117_082711.up,
    down: migration_20251117_082711.down,
    name: '20251117_082711',
  },
  {
    up: migration_20251117_212242.up,
    down: migration_20251117_212242.down,
    name: '20251117_212242',
  },
  {
    up: migration_20251120_153912.up,
    down: migration_20251120_153912.down,
    name: '20251120_153912',
  },
  {
    up: migration_20251128_130617.up,
    down: migration_20251128_130617.down,
    name: '20251128_130617',
  },
  {
    up: migration_20251202_104535.up,
    down: migration_20251202_104535.down,
    name: '20251202_104535'
  },
];
