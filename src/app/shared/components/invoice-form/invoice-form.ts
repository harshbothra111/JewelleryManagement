import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PricingService } from '../../../core/services/pricing/pricing';
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

  constructor(private fb: FormBuilder, private pricingService: PricingService) {}

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
      
      // Removed form reset as requested
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the invoice.');
      return;
    }

    const customer = data.formData;
    const items = data.formData.items;
    const totals = data.totals;

    let itemsHtml = '';
    items.forEach((item: any, index: number) => {
      itemsHtml += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.itemName}</td>
          <td>${item.type}</td>
          <td>${item.quantity.toFixed(3)}</td>
          <td>₹${item.rate.toFixed(2)}</td>
          <td>₹${item.makingCharges.toFixed(2)}</td>
          <td>₹${item.amount.toFixed(2)}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #555; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #444; text-transform: uppercase; font-size: 24px; }
          .header h3 { margin: 5px 0 0; color: #777; font-weight: normal; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-block { width: 48%; }
          .info-block p { margin: 5px 0; }
          .info-title { font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th:nth-child(2), td:nth-child(2),
          th:nth-child(3), td:nth-child(3) { text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 12px; }
          .totals { width: 50%; float: right; margin-bottom: 20px; }
          .totals table th, .totals table td { border: none; padding: 5px 10px; }
          .totals table tr.grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 16px; }
          .clear { clear: both; }
          .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>Tax Invoice</h1>
            <h3>Your Jewellery Store Name</h3>
          </div>
          
          <div class="info-section">
            <div class="info-block">
              <div class="info-title">Billed To:</div>
              <p><strong>Name:</strong> ${customer.customerName}</p>
              <p><strong>Phone:</strong> ${customer.customerPhone}</p>
              ${customer.customerAddress ? `<p><strong>Address:</strong> ${customer.customerAddress}</p>` : ''}
            </div>
            <div class="info-block" style="text-align: right;">
              <div class="info-title">Invoice Details:</div>
              <p><strong>Date:</strong> ${data.date}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Item Description</th>
                <th>Type</th>
                <th>Weight (gm)</th>
                <th>Rate/gm</th>
                <th>Making Chg.</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td style="text-align: left;">Sub Total</td>
                <td>₹${totals.subTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: left;">CGST (1.5%)</td>
                <td>₹${totals.cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: left;">SGST (1.5%)</td>
                <td>₹${totals.sgst.toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td style="text-align: left;">Grand Total</td>
                <td>₹${totals.grandTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div class="clear"></div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Subject to local jurisdiction.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
