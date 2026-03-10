import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { LoginResponse } from '../../../core/models/user-profile';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, RouterLink]
})
export class Login implements OnInit, OnDestroy {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  // Email-not-verified state
  showVerifyPrompt = false;
  verifyIdentifier = '';
  isResending = false;
  resendSuccess = false;
  resendError = '';
  cooldownSeconds = 0;
  private cooldownTimer: any = null;

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private apiService: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    this.checkSavedCredentials();
  }

  ngOnDestroy() {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  checkSavedCredentials() {
    const savedIdentifier = localStorage.getItem('rememberedIdentifier');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedIdentifier && savedPassword) {
      this.loginForm.patchValue({ identifier: savedIdentifier, password: savedPassword, rememberMe: true });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Login.ERRORS.FORM_INVALID') })
        .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      return;
    }

    this.isLoading = true;
    const { rememberMe } = this.loginForm.value;
    const identifier = (this.loginForm.value.identifier || '').trim();
    const password = (this.loginForm.value.password || '').trim();

    this.apiService.login(identifier, password).subscribe({
      next: (response: LoginResponse) => {
        this.ngZone.run(() => {
          this.isLoading = false;

          if (response.success && response.user && response.token) {
            if (rememberMe) {
              localStorage.setItem('rememberedIdentifier', identifier);
              localStorage.setItem('rememberedPassword', password);
            } else {
              localStorage.removeItem('rememberedIdentifier');
              localStorage.removeItem('rememberedPassword');
            }
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('authToken', response.token);

            forkJoin({ title: this.translate.get('SUCCESS'), text: this.translate.get('Login.SUCCESS_MESSAGE') })
              .subscribe(t => {
                Swal.fire({ icon: 'success', title: t.title, text: t.text, timer: 1500, showConfirmButton: false })
                  .then(() => this.router.navigate(['/dashboard']).then(() => window.location.reload()));
              });

          } else if ((response as any).error === 'email_not_verified') {
            // Show inline verify prompt immediately
            this.showVerifyPrompt = true;
            this.verifyIdentifier = identifier;
            this.cdr.detectChanges(); // ← فوري بدون تأخير

            const res = response as any;
            if (res.canResend) {
              this.sendVerificationEmail(identifier, false);
            } else if (res.secondsLeft > 0) {
              this.startCooldown(res.secondsLeft);
            }

          } else {
            const errorKey = (response as any).error === 'server_error'
              ? 'Login.ERRORS.SERVER_ERROR'
              : 'Login.ERRORS.INVALID_CREDENTIALS';
            forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get(errorKey) })
              .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
          }

          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
          forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Login.ERRORS.CONNECTION_ERROR') })
            .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
        });
      }
    });
  }

  sendVerificationEmail(identifier: string, showLoader = true) {
    if (this.isResending || this.cooldownSeconds > 0) return;
    this.resendError = '';
    this.resendSuccess = false;
    if (showLoader) this.isResending = true;
    this.cdr.detectChanges(); // ← تحديث فوري لحالة الزرار

    const lang = this.translate.currentLang || 'en';
    this.apiService.resendVerification(identifier, lang).subscribe({
      next: (res: any) => {
        this.isResending = false;
        if (res.success) {
          this.resendSuccess = true;
          this.startCooldown(120);
        } else if (res.error === 'cooldown') {
          this.startCooldown(res.secondsLeft || 120);
        } else if (res.error === 'already_verified') {
          this.translate.get('Verify.ERRORS.ALREADY_VERIFIED').subscribe(t => {
            this.resendError = t;
            this.cdr.detectChanges();
          });
        } else if (res.error === 'user_not_found') {
          this.translate.get('Verify.ERRORS.USER_NOT_FOUND').subscribe(t => {
            this.resendError = t;
            this.cdr.detectChanges();
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isResending = false;
        this.translate.get('Login.ERRORS.CONNECTION_ERROR').subscribe(t => {
          this.resendError = t;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private startCooldown(seconds: number) {
    this.cooldownSeconds = seconds;
    this.cdr.detectChanges();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.cooldownSeconds--;
      this.cdr.detectChanges();
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownSeconds = 0;
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  get cooldownDisplay(): string {
    const m = Math.floor(this.cooldownSeconds / 60);
    const s = this.cooldownSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  dismissVerifyPrompt() {
    this.showVerifyPrompt = false;
    this.resendSuccess = false;
    this.resendError = '';
    this.cdr.detectChanges();
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }
}
