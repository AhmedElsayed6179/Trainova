import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe, ReactiveFormsModule, RouterLink]
})
export class Register implements OnInit, OnDestroy {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  usernameExists = false;
  emailExists = false;
  phoneExists = false;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private apiService: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private recaptchaV3Service: ReCaptchaV3Service
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)]],
      lastName: ['', [Validators.minLength(2), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]*$/)]],
      age: [null, [Validators.required, Validators.min(10), Validators.max(70)]],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)]],
      confirmPassword: ['', Validators.required],
      weight: [null, [Validators.required, Validators.min(20), Validators.max(300)]],
      height: [null, [Validators.required, Validators.min(50), Validators.max(300)]],
      phone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      goal: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.setupUsernameValidation();
    this.setupEmailValidation();
    this.setupPhoneValidation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notMatching: true };
  }

  setupUsernameValidation() {
    this.registerForm.get('username')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(username => {
        const trimmed = (username || '').trim();
        if (trimmed && trimmed.length >= 3 && !this.registerForm.get('username')?.errors) {
          this.apiService.checkUsername(trimmed).subscribe({
            next: (r) => { this.usernameExists = r.exists; },
            error: () => { this.usernameExists = false; }
          });
        } else { this.usernameExists = false; }
      });
  }

  setupEmailValidation() {
    this.registerForm.get('email')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(email => {
        const trimmed = (email || '').trim();
        if (trimmed && trimmed.includes('@') && !this.registerForm.get('email')?.errors) {
          this.apiService.checkEmail(trimmed).subscribe({
            next: (r) => { this.emailExists = r.exists; },
            error: () => { this.emailExists = false; }
          });
        } else { this.emailExists = false; }
      });
  }

  setupPhoneValidation() {
    this.registerForm.get('phone')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(phone => {
        const trimmed = (phone || '').trim();
        if (trimmed && trimmed.length === 11 && !this.registerForm.get('phone')?.errors) {
          this.apiService.checkPhone(trimmed).subscribe({
            next: (r) => { this.phoneExists = r.exists; },
            error: () => { this.phoneExists = false; }
          });
        } else { this.phoneExists = false; }
      });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  isValid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.touched && control.valid;
  }

  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.touched && control.invalid;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.markAllFieldsAsTouched();
      forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Register.ERRORS.FORM_INVALID') })
        .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      return;
    }

    if (this.usernameExists) {
      forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Register.ERRORS.USERNAME_EXISTS') })
        .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      return;
    }

    if (this.emailExists) {
      forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Register.ERRORS.EMAIL_EXISTS') })
        .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      return;
    }

    if (this.phoneExists) {
      forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Register.ERRORS.PHONE_EXISTS') })
        .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      return;
    }

    this.isLoading = true;

    // Execute reCAPTCHA v3 before submitting registration
    this.recaptchaV3Service.execute('register').subscribe({
      next: (token: string) => this._submitWithToken(token),
      error: () => {
        this.isLoading = false;
        forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Login.ERRORS.RECAPTCHA_FAILED') })
          .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      }
    });
  }

  private _submitWithToken(recaptchaToken: string) {
    const formData = { ...this.registerForm.value };
    delete formData.confirmPassword;

    ['firstName', 'lastName', 'email', 'username', 'phone', 'password'].forEach(key => {
      if (typeof formData[key] === 'string') formData[key] = formData[key].trim();
    });

    const firstName = (formData.firstName || '').trim();
    const lastName  = (formData.lastName  || '').trim();
    formData.name = lastName ? `${firstName} ${lastName}` : firstName;
    delete formData.firstName;
    delete formData.lastName;

    formData.lang = this.translate.currentLang || 'en';
    formData.recaptchaToken = recaptchaToken;

    this.apiService.registerUser(formData).subscribe({
      next: (response) => {
        this.ngZone.run(() => { this.isLoading = false; });

        if (response.success) {
          forkJoin({
            title: this.translate.get('SUCCESS'),
            text: this.translate.get('Register.SUCCESS_VERIFICATION_MESSAGE'),
            confirmText: this.translate.get('Register.CHECK_EMAIL_BTN'),
            cooldownNote: this.translate.get('Register.RESEND_COOLDOWN_NOTE')
          }).subscribe(t => {
            Swal.fire({
              icon: 'success',
              title: t.title,
              html: `<p style="margin:0 0 14px">${t.text}</p><div style="background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.2);border-radius:10px;padding:10px 16px;font-size:0.85rem;color:#F5A623;display:inline-flex;align-items:center;gap:8px;"><i class="fas fa-clock" style="font-size:1rem;"></i> ${t.cooldownNote}</div>`,
              confirmButtonColor: '#ffc107',
              confirmButtonText: t.confirmText,
              allowOutsideClick: false
            }).then(() => this.router.navigate(['/verify']));
          });

        } else if ((response as any).error === 'recaptcha_failed') {
          forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Login.ERRORS.RECAPTCHA_FAILED') })
            .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));

        } else {
          let errorKey = 'Register.ERRORS.REGISTRATION_FAILED';
          if (response.error === 'email_exists') {
            errorKey = 'Register.ERRORS.EMAIL_EXISTS_VERIFY';
            this.emailExists = true;
          } else if (response.error === 'username_exists') {
            errorKey = 'Register.ERRORS.USERNAME_EXISTS';
            this.usernameExists = true;
          } else if (response.error === 'phone_exists') {
            errorKey = 'Register.ERRORS.PHONE_EXISTS';
            this.phoneExists = true;
          }

          forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get(errorKey) })
            .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
        }
      },
      error: () => {
        this.ngZone.run(() => { this.isLoading = false; });
        forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Register.ERRORS.CONNECTION_ERROR') })
          .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      }
    });
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control?.invalid) control.markAsTouched();
    });
  }
}
