import * as migration_20261018_104031_initial from './20261018_104031_initial';

export const migrations = [
  {
    up: migration_20261018_104031_initial.up,
    down: migration_20261018_104031_initial.down,
    name: '20261018_104031_initial'
  },
];
