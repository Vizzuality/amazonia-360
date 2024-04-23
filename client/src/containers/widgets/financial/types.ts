export interface IDBOperation {
  objectid: number;
  opernum?: string;
  pipeyr?: number;
  opername?: string;
  opertype?: string;
  opertypenm?: string;
  phase?: string;
  stage?: string;
  responsibleunit?: string;
  teamleader?: string;
  sector?: string;
  taxonomy?: string;
  idbamount?: number;
  cofinancingamount?: number;
  counterpartamount?: number;
  totalamount?: number;
  idbamountbypoint?: number;
  cofinancingamountbypoint?: number;
  counterpartamountbypoint?: number;
  totalamountbypoint?: number;
  oper_supported?: string;
  focusarea?: string;
  country?: string;
  regional?: string;
  cntry_iso?: string;
  countryfilter?: string;
  region?: string;
  fundcd?: string;
  fund?: string;
  executingagency?: string;
  internal_url?: string;
  location?: string;
  lat?: number;
  long_?: number;
  public_url?: string;
  npoints?: number;
  globalid: string;
}