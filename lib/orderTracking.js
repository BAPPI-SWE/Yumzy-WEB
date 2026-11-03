// lib/orderTracking.js
//
// Shared logic for simulated + real order status tracking, used by both
// pages/orders.js (list view) and pages/order-tracking/[orderId].js
// (full tracking screen). Mirrors the same behaviour as the mobile app.
//
// Stage order: PLACED -> RECEIVED -> CONFIRMED -> ACCEPTED -> PREPARING
//              -> ON_THE_WAY -> DELIVERED
//
// The first three are simulated purely on the client using elapsed time
// since the order was created (20s / 60s / 120s). ACCEPTED / ON_THE_WAY /
// DELIVERED mirror the real "orderStatus" field set by the restaurant/admin.
//
// Note: ACCEPTED sits BEFORE PREPARING in the list, but once a rider is
// assigned the kitchen is still cooking — so the *active* status swaps to
// stay on PREPARING (not ACCEPTED) until the order is actually picked up
// ("On the way").

export const TRACKING_STAGES = [
  { key: 'PLACED', title: 'Order Placed', subtitle: "We've sent your order to the restaurant" },
  { key: 'RECEIVED', title: 'Order Received', subtitle: 'The restaurant has seen your order' },
  { key: 'CONFIRMED', title: 'Order Confirmed', subtitle: 'Your order has been confirmed' },
  { key: 'ACCEPTED', title: 'Rider Assigned', subtitle: "A rider has been assigned and will pick up your order once it's ready" },
  { key: 'PREPARING', title: 'Preparing Your Food', subtitle: 'The kitchen is cooking up your meal' },
  { key: 'ON_THE_WAY', title: 'On The Way', subtitle: 'Your food is heading to your doorstep' },
  { key: 'DELIVERED', title: 'Delivered', subtitle: 'Enjoy your meal! Thanks for ordering' },
];

export function getStageDef(key) {
  return TRACKING_STAGES.find((s) => s.key === key) || null;
}

function orderCreatedMillis(order) {
  if (order?.createdAt && typeof order.createdAt.toDate === 'function') {
    return order.createdAt.toDate().getTime();
  }
  return Date.now();
}

// Returns { activeStage: 'KEY', reachedStages: Set<'KEY'> }
export function computeProgress(order, nowMillis) {
  const status = (order?.orderStatus || '').trim().toLowerCase();
  const upToPreparing = ['PLACED', 'RECEIVED', 'CONFIRMED', 'ACCEPTED', 'PREPARING'];

  if (status === 'delivered') {
    return { activeStage: 'DELIVERED', reachedStages: new Set([...upToPreparing, 'ON_THE_WAY', 'DELIVERED']) };
  }
  if (status === 'on the way') {
    return { activeStage: 'ON_THE_WAY', reachedStages: new Set([...upToPreparing, 'ON_THE_WAY']) };
  }
  if (status === 'accepted') {
    // Rider is assigned (ACCEPTED reached), but the kitchen keeps cooking —
    // PREPARING remains the active, ongoing status.
    return { activeStage: 'PREPARING', reachedStages: new Set(upToPreparing) };
  }

  // Still "Pending" — purely time-based simulation.
  const elapsedSec = (nowMillis - orderCreatedMillis(order)) / 1000;
  if (elapsedSec < 20) return { activeStage: 'PLACED', reachedStages: new Set(['PLACED']) };
  if (elapsedSec < 60) return { activeStage: 'RECEIVED', reachedStages: new Set(['PLACED', 'RECEIVED']) };
  if (elapsedSec < 120) return { activeStage: 'CONFIRMED', reachedStages: new Set(['PLACED', 'RECEIVED', 'CONFIRMED']) };
  return { activeStage: 'PREPARING', reachedStages: new Set(['PLACED', 'RECEIVED', 'CONFIRMED', 'PREPARING']) };
}

// The text shown on the Orders list: real backend statuses pass straight
// through, but a raw "Pending" status is replaced with whichever simulated
// stage is currently active (Order Placed / Received / Confirmed / Preparing).
export function getDisplayStatusText(order, nowMillis) {
  const status = (order?.orderStatus || '').trim();
  if (status.toLowerCase() === 'pending') {
    const { activeStage } = computeProgress(order, nowMillis);
    const stage = getStageDef(activeStage);
    return stage ? stage.title : status;
  }
  return status;
}

export function getStatusColor(status = '') {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'order placed':
    case 'order received':
      return { text: '#F97316', bg: '#FFEDD5' };
    case 'confirmed':
    case 'order confirmed':
      return { text: '#3B82F6', bg: '#DBEAFE' };
    case 'preparing':
    case 'preparing your food':
      return { text: '#EF6C00', bg: '#FFF3E0' };
    case 'accepted':
    case 'rider assigned':
      return { text: '#DB2777', bg: '#FCE7F3' };
    case 'on the way':
      return { text: '#1565C0', bg: '#DBEAFE' };
    case 'delivered':
      return { text: '#16A34A', bg: '#DCFCE7' };
    case 'cancelled':
      return { text: '#EF4444', bg: '#FEE2E2' };
    default:
      return { text: '#6B7280', bg: '#F3F4F6' };
  }
}