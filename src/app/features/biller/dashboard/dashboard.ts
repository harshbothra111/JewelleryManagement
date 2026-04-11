import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService, GoldsmithOrder } from '../../../core/services/order/order.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  recentOrders: GoldsmithOrder[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    // get top 5 most recent orders for summary
    this.recentOrders = this.orderService.getAllOrders().slice(0, 5);
  }
}


