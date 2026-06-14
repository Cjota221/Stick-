export type Pack = {
  id: string;
  name: string;
  description?: string | null;
  cover_url?: string | null;
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
  email: string;
  pack_id: string;
  access_code: string;
  status: "pending" | "approved" | "rejected";
  mp_payment_id?: string | null;
  pack?: Pack;
  stickers?: Sticker[];
};

export type PixData = {
  access_code: string;
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  price: number;
};
