import { http, unwrap } from './http';
import type {
  Alternative,
  AdjustItemPayload,
  ItineraryItem,
  ItineraryPlan,
  ItineraryPlanSummary,
  ItineraryStatus,
  PageResult,
  RegeneratePayload,
  RegenerateResult,
} from './types';

export const getPlan = (id: number | string) => unwrap<ItineraryPlan>(http.get(`/itinerary/plans/${id}`));

export const getPlanStatus = (id: number | string) =>
  unwrap<ItineraryStatus>(http.get(`/itinerary/plans/${id}/status`));

export const adjustItem = (planId: number | string, itemId: number | string, payload: AdjustItemPayload) =>
  unwrap<{ item: ItineraryItem | null }>(http.patch(`/itinerary/plans/${planId}/items/${itemId}`, payload));

export const getAlternatives = (planId: number | string, itemId: number | string) =>
  unwrap<Alternative[]>(http.get(`/itinerary/plans/${planId}/items/${itemId}/alternatives`));

export const regeneratePlan = (planId: number | string, payload: RegeneratePayload = {}) =>
  unwrap<RegenerateResult>(http.post(`/itinerary/plans/${planId}/regenerate`, payload));

export const listMyPlans = (page = 1, pageSize = 10) =>
  unwrap<PageResult<ItineraryPlanSummary>>(http.get('/users/me/itinerary-plans', { params: { page, pageSize } }));

export const exportPlanPdf = (planId: number | string) =>
  http.get(`/itinerary/plans/${planId}/export`, { responseType: 'blob' }).then((res) => res.data as Blob);
