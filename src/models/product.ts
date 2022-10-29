export interface Product {
  url: string;
  name: string;
  currentPrice: number;
  specialPrice: boolean;
}

export interface ProductItem extends Product {
  previousPrice: number;
  timestamp: string;
}
