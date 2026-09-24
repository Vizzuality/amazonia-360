/** The seeded catalogue's shape: 164 regional indicators and Ecuador's 21. */
export const CATALOGUE = [
  ...Array.from({ length: 164 }, (_, i) => ({ id: i, country: null })),
  ...Array.from({ length: 21 }, (_, i) => ({ id: 1000 + i, country: "ECU" })),
];
