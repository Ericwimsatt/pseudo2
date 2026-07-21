export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserList = User[];

export interface DataItem {
  id: number;
  label: string;
  value: number;
}

export interface DataState {
  items: DataItem[];
  loading: boolean;
  error: string | null;
}
