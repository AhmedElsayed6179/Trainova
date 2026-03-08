import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

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

  private FORMSPREE_URL = `${environment.FORMSPREE_URL}`;

  constructor(
    private translate: TranslateService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  async onSubmit() {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) return;

    this.isSubmitting = true;
    this.submitted = false;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const response = await fetch(this.FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: this.form.name,
          email: this.form.email,
          subject: this.form.subject || 'General',
          message: this.form.message
        })
      });

      const data = await response.json();

      this.ngZone.run(() => {
        this.isSubmitting = false;

        if (response.ok) {
          this.submitted = true;
          this.errorMessage = '';
          this.form = { name: '', email: '', subject: '', message: '' };
          this.cdr.detectChanges();

          setTimeout(() => {
            this.ngZone.run(() => {
              this.submitted = false;
              this.cdr.detectChanges();
            });
          }, 8000);
        } else {
          this.errorMessage = this.translate.instant('CONTACT.FORM.ERROR');
          this.cdr.detectChanges();
        }
      });

    } catch (err) {
      this.ngZone.run(() => {
        this.isSubmitting = false;
        this.errorMessage = this.translate.instant('CONTACT.FORM.ERROR');
        this.cdr.detectChanges();
      });
    }
  }
}
