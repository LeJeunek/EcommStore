import { z } from 'zod';
import { insertProductSchema, insertCartSchema, cartItemSchema} from '@/lib/validators';
import { shippingAddressSchema } from '@/lib/validators';

export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  createdAt: Date;
};

export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;