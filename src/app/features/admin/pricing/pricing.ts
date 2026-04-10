import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PricingService } from '../../../core/services/pricing/pricing';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing implements OnInit {
  pricingForm!: FormGroup;
  successMessage: string | null = null;

  constructor(private fb: FormBuilder, private pricingService: PricingService) {}

  ngOnInit(): void {
    const rates = this.pricingService.getCurrentRates();
    
    this.pricingForm = this.fb.group({
      gold22kRate: [rates['Gold 22k'], [Validators.required, Validators.min(1)]],
      gold24kRate: [rates['Gold 24k'], [Validators.required, Validators.min(1)]],
      silverRate: [rates['Silver'], [Validators.required, Validators.min(1)]]
    });
  }

  onSubmit(): void {
    if (this.pricingForm.valid) {
      const { gold22kRate, gold24kRate, silverRate } = this.pricingForm.value;
      this.pricingService.updateRates(gold22kRate, gold24kRate, silverRate);
      
      this.successMessage = "Today's pricing has been updated successfully. New invoices will use these rates.";
      
      // Hide message after 3 seconds
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    }
  }
}
