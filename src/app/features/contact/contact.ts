import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ReCaptchaV3Service } from '../../core/services/re-captcha-v3-service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  form = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private translate: TranslateService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private recaptchaV3Service: ReCaptchaV3Service
  ) { }

  onSubmit() {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) return;

    this.isSubmitting = true;
    this.submitted = false;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.recaptchaV3Service.execute('contact').subscribe({
      next: (token: string) => this._submitWithToken(token),
      error: () => this._submitWithToken('')
    });
  }

  private _submitWithToken(recaptchaToken: string): void {
    this.apiService.sendContactMessage({
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      subject: this.form.subject || 'General',
      message: this.form.message.trim(),
      recaptchaToken
    }).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.isSubmitting = false;
          if (res?.success) {
            this.submitted = true;
            this.errorMessage = '';
            this.form = { name: '', email: '', subject: '', message: '' };
            setTimeout(() => {
              this.ngZone.run(() => {
                this.submitted = false;
                this.cdr.detectChanges();
              });
            }, 8000);
          } else {
            this.errorMessage = this.translate.instant('CONTACT.FORM.ERROR');
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isSubmitting = false;
          this.errorMessage = this.translate.instant('CONTACT.FORM.ERROR');
          this.cdr.detectChanges();
        });
      }
    });
  }
}
