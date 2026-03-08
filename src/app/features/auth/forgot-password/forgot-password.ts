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
  showMaintenanceMsg = false;
  showNotFoundMsg = false;
  userExists: boolean | null = null;

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

    // ── Live-check pipeline ───────────────────────────────────────────────
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
          // Start check — show spinner immediately
          this.isChecking = true;
          this.showNotFoundMsg = false;
          this.showMaintenanceMsg = false;
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
          this.showMaintenanceMsg = false;
          this.showNotFoundMsg = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Events ────────────────────────────────────────────────────────────

  onIdentifierChange(value: string): void {
    // Hide stale messages instantly on new input
    this.showMaintenanceMsg = false;
    this.showNotFoundMsg = false;
    this.userExists = null;
    this.cdr.markForCheck();
    this.check$.next(value.trim());
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.forgotForm);
    this.cdr.markForCheck();
    if (this.forgotForm.invalid) return;

    // If live-check already has a result — show immediately, no extra API call
    if (this.userExists === true) {
      this.isLoading = false;
      this.isChecking = false;
      this.showMaintenanceMsg = true;
      this.cdr.markForCheck();
      return;
    }
    if (this.userExists === false) {
      this.isLoading = false;
      this.isChecking = false;
      this.showNotFoundMsg = true;
      this.cdr.markForCheck();
      return;
    }

    // If live-check is still running or hasn't fired yet — explicit API call
    const identifier = this.forgotForm.get('identifier')?.value?.trim();
    if (!identifier) return;

    this.isLoading = true;
    this.showMaintenanceMsg = false;
    this.showNotFoundMsg = false;
    this.cdr.markForCheck();

    this.apiService.checkUserExists(identifier).subscribe({
      next: res => {
        this.isLoading = false;
        this.applyCheckResult(res.exists);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.showMaintenanceMsg = true;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private applyCheckResult(exists: boolean): void {
    this.userExists = exists;
    if (exists) {
      this.showMaintenanceMsg = true;
      this.showNotFoundMsg = false;
    } else {
      this.showNotFoundMsg = true;
      this.showMaintenanceMsg = false;
    }
  }

  private resetCheckState(): void {
    this.userExists = null;
    this.showNotFoundMsg = false;
    this.showMaintenanceMsg = false;
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
    return this.forgotForm.invalid || this.isBusy || this.userExists === false;
  }

  private markFormGroupTouched(fg: FormGroup): void {
    Object.values(fg.controls).forEach(c => c.markAsTouched());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
