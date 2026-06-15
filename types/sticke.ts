export type Pack = {
  id: string;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  cover_preview_url?: string | null;
  price: number;
  is_active?: boolean;
  sort_order?: number;
  sticker_count?: number;
};

export type Sticker = {
  id: string;
  pack_id: string;
  name?: string | null;
  image_url: string;
  sort_order: number;
};

export type Purchase = {
  id: string;
  user_id?: string | null;
  email: string;
  pack_id?: string | null;
  access_code?: string | null;
  amount?: number;
  payment_method?: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  mp_payment_id?: string | null;
  categories?: StickerCategory[];
};

export type StickerCategory = Pack & {
  stickers: Sticker[];
};

export type PixData = {
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  price: number;
};
