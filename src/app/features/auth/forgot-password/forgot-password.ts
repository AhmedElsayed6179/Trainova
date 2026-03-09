import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, RouterLink]
})
export class ForgotPassword implements OnDestroy {
  forgotForm: FormGroup;
  isChecking = false;
  isLoading = false;
  showNotFoundMsg = false;
  showSuccessMsg = false;
  userExists: boolean | null = null;
  cooldownSeconds = 0;
  private cooldownTimer: any = null;

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  private destroy$ = new Subject<void>();
  private check$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.forgotForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.check$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          if (!value || value.length < 3) {
            this.resetCheckState();
            this.cdr.markForCheck();
            return of(null);
          }
          this.isChecking = true;
          this.showNotFoundMsg = false;
          this.showSuccessMsg = false;
          this.userExists = null;
          this.cdr.markForCheck();
          return this.apiService.checkUserExists(value);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: res => {
          this.isChecking = false;
          if (res === null) return;
          this.applyCheckResult(res.exists);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isChecking = false;
          this.userExists = null;
          this.showNotFoundMsg = false;
          this.cdr.markForCheck();
        }
      });
  }

  onIdentifierChange(value: string): void {
    this.showNotFoundMsg = false;
    this.showSuccessMsg = false;
    this.userExists = null;
    this.cdr.markForCheck();
    this.check$.next(value.trim());
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.forgotForm);
    this.cdr.markForCheck();
    if (this.forgotForm.invalid) return;

    if (this.userExists === false) {
      this.showNotFoundMsg = true;
      this.cdr.markForCheck();
      return;
    }

    const identifier = this.forgotForm.get('identifier')?.value?.trim();
    if (!identifier) return;

    this.isLoading = true;
    this.showNotFoundMsg = false;
    this.showSuccessMsg = false;
    this.cdr.markForCheck();

    const lang = this.translate.currentLang || 'en';

    this.apiService.forgotPassword(identifier, lang).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.error === 'user_not_found') {
          this.showNotFoundMsg = true;
          this.userExists = false;
        } else if (res?.error === 'cooldown') {
          this.startCooldown(res.secondsLeft || 120);
        } else {
          // Show success even on server error to avoid email enumeration
          this.showSuccessMsg = true;
          this.showNotFoundMsg = false;
          this.forgotForm.get('identifier')?.disable();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.showSuccessMsg = true;
        this.cdr.markForCheck();
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.cooldownSeconds = seconds;
    this.cdr.markForCheck();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.cooldownSeconds--;
      this.cdr.markForCheck();
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
        this.cooldownSeconds = 0;
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  get isCooldown(): boolean {
    return this.cooldownSeconds > 0;
  }

  get cooldownDisplay(): string {
    const m = Math.floor(this.cooldownSeconds / 60);
    const s = this.cooldownSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private applyCheckResult(exists: boolean): void {
    this.userExists = exists;
    this.showNotFoundMsg = !exists;
  }

  private resetCheckState(): void {
    this.userExists = null;
    this.showNotFoundMsg = false;
    this.showSuccessMsg = false;
    this.isChecking = false;
    this.isLoading = false;
  }

  hasError(controlName: string, errorName: string): boolean {
    const c = this.forgotForm.get(controlName);
    return !!c && c.touched && c.hasError(errorName);
  }

  get isIdentifierValid(): boolean {
    return !!this.forgotForm.get('identifier')?.valid && this.userExists === true;
  }

  get isIdentifierInvalid(): boolean {
    return !!this.forgotForm.get('identifier')?.touched && this.userExists === false;
  }

  get isBusy(): boolean {
    return this.isChecking || this.isLoading;
  }

  get isSubmitDisabled(): boolean {
    return this.forgotForm.invalid || this.isBusy || this.userExists === false || this.showSuccessMsg || this.isCooldown;
  }

  private markFormGroupTouched(fg: FormGroup): void {
    Object.values(fg.controls).forEach(c => c.markAsTouched());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }
}
