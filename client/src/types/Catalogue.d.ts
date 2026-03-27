interface CatalogueItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  cost: number;
  price: number;
  type: 'PRODUCT' | 'BUNDLE';
  isActive: boolean;
  createdOnDate: string;
  modifiedOnDate: string;
}
