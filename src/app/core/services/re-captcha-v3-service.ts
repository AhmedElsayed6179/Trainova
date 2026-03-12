import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

declare const grecaptcha: any;

@Injectable({ providedIn: 'root' })
export class ReCaptchaV3Service {
  private readonly siteKey = '6Lc-74UsAAAAAEAhq_TJhF8cb4yFTu851stagtUV';

  execute(action: string): Observable<string> {
    return from(
      new Promise<string>((resolve, reject) => {
        if (typeof grecaptcha === 'undefined') {
          reject(new Error('reCAPTCHA not loaded'));
          return;
        }

        grecaptcha.ready(() => {
          this.forceLightTheme();

          grecaptcha
            .execute(this.siteKey, { action })
            .then(resolve)
            .catch(reject);
        });
      })
    );
  }

  private forceLightTheme() {
    try {
      const badges = document.querySelectorAll('.grecaptcha-badge');
      badges.forEach((badge: Element) => {
        (badge as HTMLElement).style.backgroundColor = 'transparent';
        const iframe = badge.querySelector('iframe');
        if (iframe) {
          iframe.style.backgroundColor = '#f9f9f9';
        }
      });
    } catch (e) {
      console.warn('Could not force reCAPTCHA theme:', e);
    }
  }
}
