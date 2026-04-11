import { Injectable } from '@angular/core';

export interface Goldsmith {
  id: string;
  name: string;
  makingCharges: Record<string, Record<string, number>>; // Item Name -> Type -> Making Charge
}

export interface OrderItem {
  itemName: string;
  type: string;
  quantity: number; // weight
  rate: number;     // rate per gm
  makingCharges: number;
  amount: number;
}

export interface OrderStatusTracker {
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
  date: string;
}

export interface GoldsmithOrder {
  id?: string;
  date?: string;
  goldsmithId: string;
  goldsmithName: string;
  
  customerName: string;
  customerPhone: string;
  
  items: OrderItem[];
  
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
  statusHistory?: OrderStatusTracker[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // Mock data for Goldsmiths with varied making charges per item per type
  private goldsmiths: Goldsmith[] = [
    {
      id: 'gs1',
      name: 'Ramesh Karigar',
      makingCharges: {
        'Ring': { 'Gold 22k': 350, 'Gold 24k': 400, 'Silver': 50 },
        'Chain': { 'Gold 22k': 250, 'Gold 24k': 300, 'Silver': 40 },
        'Necklace': { 'Gold 22k': 450, 'Gold 24k': 500, 'Silver': 100 }
      }
    },
    {
      id: 'gs2',
      name: 'Shiva Jewellers',
      makingCharges: {
        'Ring': { 'Gold 22k': 300, 'Gold 24k': 350, 'Silver': 45 },
        'Bangle': { 'Gold 22k': 400, 'Gold 24k': 450, 'Silver': 60 },
        'Pendant': { 'Gold 22k': 350, 'Gold 24k': 380, 'Silver': 55 }
      }
    }
  ];

  // Store placed orders mock history
  private orders: GoldsmithOrder[] = [];

  getGoldsmiths(): Goldsmith[] {
    return this.goldsmiths;
  }

  getMakingCharge(goldsmithId: string, itemName: string, type: string): number {
    const gs = this.goldsmiths.find(g => g.id === goldsmithId);
    if (gs && gs.makingCharges[itemName] && gs.makingCharges[itemName][type]) {
      return gs.makingCharges[itemName][type];
    }
    return 0; // fallback if no specific rate is configured
  }

  placeOrder(order: GoldsmithOrder): void {
    const defaultDate = new Date().toLocaleString('en-IN');
    const newOrder: GoldsmithOrder = { 
      ...order, 
      id: 'ORD-' + Math.floor(Math.random() * 10000),
      date: new Date().toLocaleDateString('en-IN'),
      status: 'Pending' as const,
      statusHistory: [{ status: 'Pending', date: defaultDate }]
    };
    this.orders.unshift(newOrder); // Add to top
  }

  updateOrderStatus(orderId: string, status: GoldsmithOrder['status']): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({ status: status, date: new Date().toLocaleString('en-IN') });
    }
  }

  getAllOrders(): GoldsmithOrder[] {
    return this.orders;
  }

  getOrdersByGoldsmith(goldsmithId: string): GoldsmithOrder[] {
    return this.orders.filter(o => o.goldsmithId === goldsmithId);
  }
}

