import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

declare const grecaptcha: any;

@Injectable({ providedIn: 'root' })
export class ReCaptchaV3Service {
  execute(action: string): Observable<string> {
    return from(
      new Promise<string>((resolve, reject) => {
        if (typeof grecaptcha === 'undefined') {
          reject(new Error('reCAPTCHA not loaded'));
          return;
        }
        grecaptcha.ready(() => {
          grecaptcha
            .execute('6Lc-74UsAAAAAEAhq_TJhF8cb4yFTu851stagtUV', { action })
            .then(resolve)
            .catch(reject);
        });
      })
    );
  }
}
