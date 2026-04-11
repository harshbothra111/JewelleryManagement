import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService, Goldsmith, GoldsmithOrder } from '../../../core/services/order/order.service';
import { PricingService } from '../../../core/services/pricing/pricing';
import { PrintService } from '../../../core/services/print/print.service';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './new-order.html'
})
export class NewOrder implements OnInit {
  @Input() allowRateEdit: boolean = true;
  @Input() backRoute: string = '/';

  orderForm!: FormGroup;
  goldsmiths: Goldsmith[] = [];
  subTotal = 0;
  cgstAmount = 0;
  sgstAmount = 0;
  grandTotal = 0;
  readonly CGST_RATE = 1.5;
  readonly SGST_RATE = 1.5;

  constructor(private fb: FormBuilder, private orderService: OrderService, private pricingService: PricingService, private router: Router, private printService: PrintService) {}

  ngOnInit() {
    this.goldsmiths = this.orderService.getGoldsmiths();
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      goldsmithId: ['', Validators.required],
      items: this.fb.array([this.createItemFormGroup()])
    });
    this.orderForm.valueChanges.subscribe(val => this.calculateTotals(val.items));
    this.orderForm.get('goldsmithId')?.valueChanges.subscribe(gsId => this.refreshMakingCharges(gsId));
  }

  get items(): FormArray { return this.orderForm.get('items') as FormArray; }

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      itemName: ['Ring', Validators.required],
      type: ['Gold 22k', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      rate: [this.pricingService.getRate('Gold 22k'), [Validators.required, Validators.min(0)]],
      makingCharges: [0, [Validators.required, Validators.min(0)]],
      amount: [{ value: 0, disabled: true }]
    });
  }

  addItem() { this.items.push(this.createItemFormGroup()); }
  removeItem(i: number) { if (this.items.length > 1) this.items.removeAt(i); }

  onItemValueChange(i: number) {
    const itemGroup = this.items.at(i) as FormGroup;
    const gsId = this.orderForm.get('goldsmithId')?.value;
    const itemName = itemGroup.get('itemName')?.value;
    const type = itemGroup.get('type')?.value;
    const newRate = this.pricingService.getRate(type);
    if (itemGroup.get('rate')?.value !== newRate) itemGroup.patchValue({ rate: newRate }, { emitEvent: false });
    if (gsId && itemName && type) {
      const mc = this.orderService.getMakingCharge(gsId, itemName, type);
      if (itemGroup.get('makingCharges')?.value !== mc) itemGroup.patchValue({ makingCharges: mc }, { emitEvent: false });
    }
  }

  refreshMakingCharges(gsId: string) { this.items.controls.forEach((_, i) => this.onItemValueChange(i)); }

  private calculateTotals(itemsValue: any[]) {
    let sum = 0;
    itemsValue.forEach((item, i) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      const m = parseFloat(item.makingCharges) || 0;
      const itemAmount = (q * r) + m;
      sum += itemAmount;
      const formControl = this.items.at(i).get('amount');
      if (formControl && formControl.value !== itemAmount) formControl.patchValue(itemAmount, { emitEvent: false });
    });
    this.subTotal = sum;
    this.cgstAmount = (this.subTotal * this.CGST_RATE) / 100;
    this.sgstAmount = (this.subTotal * this.SGST_RATE) / 100;
    this.grandTotal = this.subTotal + this.cgstAmount + this.sgstAmount;
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/\D/g, '').substring(0, 10);
    input.value = sanitized;
    this.orderForm.get('customerPhone')?.setValue(sanitized, { emitEvent: false });
  }

  onSubmit() {
    if (this.orderForm.valid) {
      const formData = this.orderForm.getRawValue();
      const selectedGoldsmith = this.goldsmiths.find(g => g.id === formData.goldsmithId);
      const newOrder: GoldsmithOrder = {
        goldsmithId: formData.goldsmithId,
        goldsmithName: selectedGoldsmith?.name || 'Unknown',
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        items: formData.items,
        subTotal: this.subTotal,
        cgstAmount: this.cgstAmount,
        sgstAmount: this.sgstAmount,
        grandTotal: this.grandTotal,
        status: 'Pending'
      };
      this.orderService.placeOrder(newOrder);
      alert('Order placed successfully!');
      this.orderForm.reset();
      this.items.clear();
      this.addItem();
      this.router.navigateByUrl(this.backRoute).then(() => setTimeout(() => this.generateOrderPrint(newOrder), 500));
    } else {
      this.orderForm.markAllAsTouched();
    }
  }

  private generateOrderPrint(orderData: any) {
    this.printService.printOrder(orderData);
  }
}







