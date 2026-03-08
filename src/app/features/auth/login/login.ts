import { Component, OnInit, NgZone } from '@angular/core';
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
export class Login implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private apiService: ApiService,
    private router: Router,
    private ngZone: NgZone
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
    const { identifier, password, rememberMe } = this.loginForm.value;

    this.apiService.login(identifier, password).subscribe({
      next: (response: LoginResponse) => {
        this.ngZone.run(() => { this.isLoading = false; });

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

        } else {
          const errorKey = response.error === 'server_error' ? 'Login.ERRORS.SERVER_ERROR' : 'Login.ERRORS.INVALID_CREDENTIALS';
          forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get(errorKey) })
            .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
        }
      },
      error: () => {
        this.ngZone.run(() => { this.isLoading = false; });
        forkJoin({ title: this.translate.get('ERROR'), text: this.translate.get('Login.ERRORS.CONNECTION_ERROR') })
          .subscribe(t => Swal.fire({ icon: 'error', title: t.title, text: t.text, confirmButtonColor: '#ffc107' }));
      }
    });
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
