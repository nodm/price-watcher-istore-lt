export const enum PhilatelyProductType {
  STAMP = 'Stamp',
  FIRST_DAY_COVER = 'First-day cover',
  SMALL_SHEET = 'Small sheet',
  MAXIMUM_CARD = 'Maximum card',
  PA = 'PA',
  BOOKLET = 'Booklet',
  ANNUAL_COLLECTION = 'Annual collection',
  OTHER = 'Other',
}

export interface PhilatelyProduct {
  href: string;
  type: PhilatelyProductType;
  title: string;
  imgUrl: string;
  price: {
    value: number;
    currency: string;
  };
  catalogNumber?: string | undefined;
  dateOfIssue?: string;
  year?: number,
  meta?: string[];
  description?: string[],
}
