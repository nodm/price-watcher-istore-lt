export const enum PhilatelyProductType {
  STAMP = 'Stamp',
  PDV = 'PDV',
  ML = 'ML',
  KM = 'KM',
  PA = 'PA',
  BOOKLET = 'BOOKLET',
  ANNUAL_COLLECTION = 'ANNUAL_COLLECTION',
}

export interface PhilatelyProduct {
  href: string;
  catalogNumber?: string | undefined;
  dateOfIssue: string;
  year: number | null,
  type: PhilatelyProductType;
  title: string;
  imgUrl: string;
  price: {
    value: number;
    currency: string;
  };
  meta: string[];
  description: string[],
}
