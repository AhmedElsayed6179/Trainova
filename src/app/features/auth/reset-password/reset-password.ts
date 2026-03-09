import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, RouterLink]
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  token = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  /** 'idle' | 'success' | 'error' | 'expired' | 'invalid' */
  state: 'idle' | 'success' | 'error' | 'expired' | 'invalid' = 'idle';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    this.resetForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    const lang = this.route.snapshot.queryParamMap.get('lang') || null;

    if (!this.token) {
      this.state = 'invalid';
      this.cdr.markForCheck();
      return;
    }

    // Apply language from URL param (respects user's choice at forgot-password time)
    if (lang && (lang === 'ar' || lang === 'en')) {
      this.translate.use(lang);
      localStorage.setItem('lang', lang);
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p === c ? null : { notMatching: true };
  }

  onSubmit(): void {
    this.markTouched();
    if (this.resetForm.invalid) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.apiService.resetPassword(this.token, this.resetForm.get('password')!.value).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success) {
          this.state = 'success';
        } else if (res?.error === 'token_expired') {
          this.state = 'expired';
        } else {
          this.state = 'invalid';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.state = 'error';
        this.cdr.markForCheck();
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  hasError(controlName: string, errorName: string): boolean {
    const c = this.resetForm.get(controlName);
    return !!c && c.touched && c.hasError(errorName);
  }

  isValid(controlName: string): boolean {
    const c = this.resetForm.get(controlName);
    return !!c && c.touched && c.valid;
  }

  isInvalid(controlName: string): boolean {
    const c = this.resetForm.get(controlName);
    return !!c && c.touched && c.invalid;
  }

  private markTouched(): void {
    Object.values(this.resetForm.controls).forEach(c => c.markAsTouched());
  }
}
