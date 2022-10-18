export interface Product {
  url: string;
  name: string;
  currentPrice: number;
  specialPrice: boolean;
}

export interface ProductRecord extends Product {
  previousPrice: number;
  timestamp: number;
}
