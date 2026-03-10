import { Component, NgZone, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const COOLDOWN_KEY = 'contact_last_sent';
const COOLDOWN_MS  = 15 * 60 * 1000;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements OnInit, OnDestroy {
  form = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting  = false;
  submitted     = false;
  errorMessage  = '';

  /** Remaining cooldown in seconds (0 = no cooldown) */
  cooldownSecs  = 0;

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;
  private readonly FORMSPREE_URL = environment.FORMSPREE_URL;

  constructor(
    private translate: TranslateService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────

  ngOnInit(): void {
    this.refreshCooldown();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ── Cooldown helpers ───────────────────────────────────────

  private refreshCooldown(): void {
    const lastSent = localStorage.getItem(COOLDOWN_KEY);
    if (!lastSent) return;

    const elapsed   = Date.now() - parseInt(lastSent, 10);
    const remaining = COOLDOWN_MS - elapsed;

    if (remaining > 0) {
      this.cooldownSecs = Math.ceil(remaining / 1000);
      this.startTimer();
    } else {
      localStorage.removeItem(COOLDOWN_KEY);
      this.cooldownSecs = 0;
    }
  }

  private startTimer(): void {
    this.clearTimer();
    this.cooldownInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.cooldownSecs = Math.max(0, this.cooldownSecs - 1);
        if (this.cooldownSecs === 0) {
          this.clearTimer();
          localStorage.removeItem(COOLDOWN_KEY);
        }
        this.cdr.detectChanges();
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.cooldownInterval !== null) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  /** "mm:ss" format shown in the template */
  get cooldownLabel(): string {
    const m = Math.floor(this.cooldownSecs / 60).toString().padStart(2, '0');
    const s = (this.cooldownSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get isCoolingDown(): boolean {
    return this.cooldownSecs > 0;
  }

  // ── Submit ─────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) return;
    if (this.isCoolingDown) return;

    this.isSubmitting = true;
    this.submitted    = false;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload = {
      name:    this.form.name.trim(),
      email:   this.form.email.trim(),
      subject: this.form.subject || 'General',
      message: this.form.message.trim()
    };

    this.http.post(this.FORMSPREE_URL, payload, {
      headers: { Accept: 'application/json' }
    }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          // Save timestamp & start cooldown
          localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
          this.cooldownSecs = COOLDOWN_MS / 1000;
          this.startTimer();

          this.isSubmitting = false;
          this.submitted    = true;
          this.errorMessage = '';
          this.form         = { name: '', email: '', subject: '', message: '' };
          this.cdr.detectChanges();

          setTimeout(() => {
            this.ngZone.run(() => {
              this.submitted = false;
              this.cdr.detectChanges();
            });
          }, 8000);
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
