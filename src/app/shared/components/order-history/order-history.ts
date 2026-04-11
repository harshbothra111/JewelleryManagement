import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintService } from '../../../core/services/print/print.service';
import { RouterModule } from '@angular/router';
import { OrderService, Goldsmith, GoldsmithOrder } from '../../../core/services/order/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-history.html',
  styleUrls: ['./order-history.css']
})
export class OrderHistory implements OnInit {
  @Input() viewMode: 'history' | 'goldsmith-history' = 'history';
  
  goldsmiths: Goldsmith[] = [];
  allOrders: GoldsmithOrder[] = [];
  selectedGoldsmithHistoryId: string = '';

  constructor(private orderService: OrderService, private printService: PrintService) {}

  ngOnInit(): void {
    this.goldsmiths = this.orderService.getGoldsmiths();
    this.loadOrders();
  }

  loadOrders(): void {
    if (this.viewMode === 'goldsmith-history' && this.selectedGoldsmithHistoryId) {
      this.allOrders = this.orderService.getOrdersByGoldsmith(this.selectedGoldsmithHistoryId);
    } else {
      this.allOrders = this.orderService.getAllOrders();
    }
  }

  setViewMode(mode: 'history' | 'goldsmith-history'): void {
    this.viewMode = mode;
    this.loadOrders();
  }

  loadGoldsmithHistory(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedGoldsmithHistoryId = selectElement.value;
    this.loadOrders();
  }

  changeOrderStatus(orderId: string, status: 'Pending' | 'Fulfilled' | 'Cancelled'): void {
    this.orderService.updateOrderStatus(orderId, status);
    this.loadOrders();
  }

  generateTaxInvoice(orderData: any): void {
    this.printService.printTaxInvoice(orderData);
  }
}

