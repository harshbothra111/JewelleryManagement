import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PricingService } from '../../../core/services/pricing/pricing';
import { PrintService } from '../../../core/services/print/print.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './invoice-form.html',
  styleUrls: ['./invoice-form.css'],
})
export class InvoiceForm implements OnInit, OnDestroy {
  @Input() allowRateEdit: boolean = false;
  @Input() backRoute: string = '/';

  invoiceForm!: FormGroup;
  private valueChangesSub!: Subscription;

  // Tax constants
  readonly CGST_RATE = 1.5; // 1.5%
  readonly SGST_RATE = 1.5; // 1.5%

  subTotal = 0;
  cgstAmount = 0;
  sgstAmount = 0;
  grandTotal = 0;

  constructor(private fb: FormBuilder, private pricingService: PricingService, private printService: PrintService) {}

  ngOnInit(): void {
    this.invoiceForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      customerAddress: [''],
      items: this.fb.array([this.createItemFormGroup()])
    });

    this.valueChangesSub = this.invoiceForm.valueChanges.subscribe(value => {
      if (this.allowRateEdit) {
        this.syncRates(value.items);
      }
      this.calculateTotals(value.items);
    });
  }

  // Admin specific: if rate changes in one row, sync to other rows of the same type
  private syncRates(itemsValue: any[]): void {
    if (!itemsValue || itemsValue.length === 0) return;
    
    const newRatesByType: Record<string, number> = {};
    
    // Track what the inputs currently hold
    itemsValue.forEach((item, index) => {
      const formControl = this.items.at(index).get('rate');
      if (formControl && formControl.dirty) {
        newRatesByType[item.type] = parseFloat(item.rate);
      }
    });

    // Apply the latest rate to all rows of the same type if it differs
    itemsValue.forEach((item, index) => {
      if (newRatesByType[item.type] !== undefined) {
        const formControl = this.items.at(index).get('rate');
        const r = parseFloat(item.rate);
        const newR = newRatesByType[item.type];
        if (formControl && r !== newR && !isNaN(newR)) {
          formControl.patchValue(newR, { emitEvent: false });
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
    }
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      itemName: ['', Validators.required],
      type: ['Gold 22k', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      rate: [this.pricingService.getRate('Gold 22k')],
      makingCharges: [0, [Validators.required, Validators.min(0)]],
      amount: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    const defaultGroup = this.createItemFormGroup();
    this.items.push(defaultGroup);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onTypeChange(index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
    const typeValue = itemGroup.get('type')?.value;
    const newRate = this.pricingService.getRate(typeValue);
    
    // Update rate dropdown internally
    itemGroup.patchValue({ rate: newRate }, { emitEvent: true });
  }

  markRateDirty(index: number): void {
    if (!this.allowRateEdit) return;
    const formControl = this.items.at(index).get('rate');
    if (formControl) {
      formControl.markAsDirty();
    }
  }

  onRateChange(event: any, index: number): void {
    if (!this.allowRateEdit) return;
    const newRate = parseFloat(event.target.value);
    const itemGroup = this.items.at(index) as FormGroup;
    const typeValue = itemGroup.get('type')?.value;

    if (!isNaN(newRate)) {
      this.items.controls.forEach((control: any) => {
        if (control.get('type').value === typeValue) {
          control.patchValue({ rate: newRate }, { emitEvent: false });
        }
      });
      // Force calculate totals
      this.calculateTotals(this.invoiceForm.get('items')?.value);
    }
  }

  onKeydown(event: KeyboardEvent, isLastInput: boolean, itemIndex: number): void {
    // If it's the last row and last input (like making charges), add new row on Tab or Enter
    if (isLastInput && (event.key === 'Tab' || event.key === 'Enter') && itemIndex === this.items.length - 1) {
      event.preventDefault(); // prevent default tab jump
      this.addItem();
    }
  }

  private calculateTotals(itemsValue: any[]): void {
    let sub = 0;
    
    // Calculate line items (can also patch amount per row if desired)
    itemsValue.forEach((item, index) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      const m = parseFloat(item.makingCharges) || 0;
      const itemAmount = (q * r) + m;
      sub += itemAmount;
      
      // Update the disabled amount field per row (silently to prevent circular updates)
      const formControl = this.items.at(index).get('amount');
      if (formControl && formControl.value !== itemAmount) {
        formControl.patchValue(itemAmount, { emitEvent: false });
      }
    });

    this.subTotal = sub;
    this.cgstAmount = (this.subTotal * this.CGST_RATE) / 100;
    this.sgstAmount = (this.subTotal * this.SGST_RATE) / 100;
    this.grandTotal = this.subTotal + this.cgstAmount + this.sgstAmount;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Replace any non-digit character with empty string
    let sanitized = input.value.replace(/\D/g, '');
    if (sanitized.length > 10) {
      sanitized = sanitized.substring(0, 10);
    }
    input.value = sanitized;
    // Update the form control value
    this.invoiceForm.get('customerPhone')?.setValue(sanitized, { emitEvent: false });
  }

  onGridKeydown(event: KeyboardEvent, rowIndex: number, colName: string, view: string): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const targetRow = event.key === 'ArrowUp' ? rowIndex - 1 : rowIndex + 1;
      if (targetRow >= 0 && targetRow < this.items.length) {
        // Prevent default cursor moving in input
        event.preventDefault(); 
        this.focusGridCell(view, colName, targetRow);
      }
    } else if (event.key === 'Enter') {
      // Prevent form submission on enter inside the grid
      event.preventDefault();
      
      let nextColName = '';
      let targetRow = rowIndex;

      switch (colName) {
        case 'itemName': nextColName = 'type'; break;
        case 'type': nextColName = 'quantity'; break;
        case 'quantity': nextColName = 'rate'; break;
        case 'rate': nextColName = 'makingCharges'; break;
        case 'makingCharges':
          // If not the last row, move to the next row's itemName
          if (rowIndex < this.items.length - 1) {
            nextColName = 'itemName';
            targetRow = rowIndex + 1;
          } else {
            // It's the last row; onKeydown will add a new row simultaneously. Focus it after a tick.
            setTimeout(() => this.focusGridCell(view, 'itemName', rowIndex + 1), 100);
            return;
          }
          break;
      }

      if (nextColName) {
        this.focusGridCell(view, nextColName, targetRow);
      }
    }
  }

  private focusGridCell(view: string, colName: string, rowIndex: number): void {
    const targetId = `${view}-input-${colName}-${rowIndex}`;
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.focus();
      if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLSelectElement) {
        if (typeof (targetElement as HTMLInputElement).select === 'function') {
          (targetElement as HTMLInputElement).select();
        }
      }
    }
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      const formData = this.invoiceForm.getRawValue();
      const invoiceData = {
        formData: formData,
        totals: {
          subTotal: this.subTotal,
          cgst: this.cgstAmount,
          sgst: this.sgstAmount,
          grandTotal: this.grandTotal
        },
        date: new Date().toLocaleDateString('en-IN')
      };

      console.log('Invoice Submitted!', invoiceData);
      this.generateInvoicePrint(invoiceData);

      // Reset form after generating the invoice print
      this.invoiceForm.reset();
      this.invoiceForm.patchValue({
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      });
      this.items.clear();
      this.addItem();
    } else {
      this.invoiceForm.markAllAsTouched();
    }
  }

  onClearForm(): void {
    if (confirm('Are you sure you want to clear the entire form?')) {
      this.invoiceForm.reset();
      // Reset the address/customer fields to strictly empty strings instead of null
      this.invoiceForm.patchValue({
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      });
      // Clear line items and initialize with one empty row
      this.items.clear();
      this.addItem();
    }
  }

  private generateInvoicePrint(data: any): void {
    this.printService.printTaxInvoice(data);
  }
}
