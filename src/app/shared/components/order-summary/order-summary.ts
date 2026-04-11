import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order/order.service';
import { PrintService } from '../../../core/services/print/print.service';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-summary.html'
})
export class OrderSummary implements OnInit {
  @Input() backRoute: string = '/';
  allOrders: any[] = [];

  constructor(private orderService: OrderService, private printService: PrintService) {}

  ngOnInit() {
    this.allOrders = this.orderService.getAllOrders();
  }

  changeOrderStatus(orderId: string, status: 'Pending' | 'Fulfilled' | 'Cancelled') {
    this.orderService.updateOrderStatus(orderId, status);
  }

  generateOrderPrint(orderData: any) {
    this.printService.printOrder(orderData);
  }

  generateTaxInvoice(orderData: any) {
    this.printService.printTaxInvoice(orderData);
  }
}







