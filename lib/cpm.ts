const CPM_BY_COUNTRY: Record<string, number> = {
  US: 5.0,
  CA: 4.0,
  GB: 4.5,
  AU: 4.2,
  DE: 3.5,
  FR: 3.2,
  IN: 1.0,
  BR: 1.2,
  ZZ: 0.8,
}

export function resolveCpm(country: string | null | undefined): number {
  const cc = (country || "ZZ").toUpperCase()
  return CPM_BY_COUNTRY[cc] ?? CPM_BY_COUNTRY.ZZ
}
