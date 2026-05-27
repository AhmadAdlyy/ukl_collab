export interface Menu {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category_id: number;
  category: {
    name: string;
  };
}

export interface Category {
  id: number;
  name: string;
}