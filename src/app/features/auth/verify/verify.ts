import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';

type VerifyStatus = 'loading' | 'success' | 'invalid' | 'expired' | 'no_token' | 'already_verified';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.html',
  styleUrls: ['./verify.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe, RouterLink]
})
export class Verify implements OnInit, OnDestroy {
  status: VerifyStatus = 'loading';
  countdown = 5;
  resendIdentifier = '';
  resendError = '';
  resendSuccess = false;
  isResending = false;
  cooldownSeconds = 0;
  private countdownTimer: any = null;
  private cooldownTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status = 'no_token';
      this.cdr.markForCheck();
      return;
    }
    this.verifyToken(token);
  }

  private verifyToken(token: string) {
    this.apiService.verifyEmail(token).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.status = 'success';
          this.startCountdown();
        } else if (res.error === 'token_expired') {
          this.status = 'expired';
        } else if (res.error === 'already_verified') {
          this.status = 'already_verified';
          this.startCountdown();
        } else {
          this.status = 'invalid';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.status = 'invalid';
        this.cdr.markForCheck();
      }
    });
  }

  private startCountdown() {
    this.countdown = 5;
    this.countdownTimer = setInterval(() => {
      this.countdown--;
      this.cdr.markForCheck();
      if (this.countdown <= 0) {
        clearInterval(this.countdownTimer);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  resendVerification() {
    if (!this.resendIdentifier.trim() || this.isResending || this.cooldownSeconds > 0) return;
    this.resendError = '';
    this.resendSuccess = false;
    this.isResending = true;
    this.cdr.markForCheck();

    const lang = this.translate.currentLang || 'en';

    this.apiService.resendVerification(this.resendIdentifier.trim(), lang).subscribe({
      next: (res: any) => {
        this.isResending = false;
        if (res.success) {
          this.resendSuccess = true;
          this.startCooldown(180);
        } else if (res.error === 'cooldown') {
          this.startCooldown(res.secondsLeft || 180);
        } else if (res.error === 'already_verified') {
          this.translate.get('Verify.ERRORS.ALREADY_VERIFIED').subscribe(t => {
            this.resendError = t;
            this.cdr.markForCheck();
          });
        } else if (res.error === 'user_not_found') {
          this.translate.get('Verify.ERRORS.USER_NOT_FOUND').subscribe(t => {
            this.resendError = t;
            this.cdr.markForCheck();
          });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isResending = false;
        this.translate.get('Login.ERRORS.CONNECTION_ERROR').subscribe(t => {
          this.resendError = t;
          this.cdr.markForCheck();
        });
      }
    });
  }

  private startCooldown(seconds: number) {
    this.cooldownSeconds = seconds;
    this.cdr.markForCheck();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.cooldownSeconds--;
      this.cdr.markForCheck();
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownSeconds = 0;
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  get cooldownDisplay(): string {
    const m = Math.floor(this.cooldownSeconds / 60);
    const s = this.cooldownSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }
}
