import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, Goldsmith } from '../../../core/services/order/order.service';
import { PrintService } from '../../../core/services/print/print.service';

@Component({
  selector: 'app-order-by-karigar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-by-karigar.html'
})
export class OrderByKarigar implements OnInit {
  @Input() backRoute: string = '/';
  allOrders: any[] = [];
  goldsmiths: Goldsmith[] = [];
  selectedGoldsmithHistoryId: string = '';

  constructor(private orderService: OrderService, private printService: PrintService) {}

  ngOnInit() {
    this.goldsmiths = this.orderService.getGoldsmiths();
  }

  loadGoldsmithHistory(event: any) {
    this.selectedGoldsmithHistoryId = event.target.value;
    if (this.selectedGoldsmithHistoryId) {
      this.allOrders = this.orderService.getOrdersByGoldsmith(this.selectedGoldsmithHistoryId);
    } else {
      this.allOrders = [];
    }
  }

  changeOrderStatus(orderId: string, status: 'Pending' | 'Fulfilled' | 'Cancelled') {
    this.orderService.updateOrderStatus(orderId, status);
  }

  generateOrderPrint(orderData: any) {
    this.printService.printOrder(orderData);
  }

  printInvoice(orderData: any) {
    this.printService.printTaxInvoice(orderData);
  }
}







