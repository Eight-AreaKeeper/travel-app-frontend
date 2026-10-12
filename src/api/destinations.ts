import { http, unwrap } from './http';
import type { Destination } from './types';

export const hotDestinations = (limit = 10) =>
  unwrap<Destination[]>(http.get('/destinations/hot', { params: { limit } }));

export const searchDestinations = (keyword: string, limit = 10) =>
  unwrap<Destination[]>(http.get('/destinations/search', { params: { keyword, limit } }));
