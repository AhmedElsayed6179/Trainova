import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class SecurityService implements OnDestroy {

  private listeners: Array<{ event: string; fn: EventListener }> = [];
  private devToolsInterval: any;

  constructor(private translate: TranslateService) {
    this.init();
  }

  private init(): void {

    // ── منع كليك يمين ──
    this.addListener('contextmenu', (e) => e.preventDefault());

    // ── منع F12 / Ctrl+Shift+I/J/C / Ctrl+U ──
    this.addListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      const blocked =
        ke.key === 'F12' ||
        (ke.ctrlKey && ke.shiftKey && ['I', 'J', 'C'].includes(ke.key)) ||
        (ke.ctrlKey && ke.key === 'u');
      if (blocked) {
        ke.preventDefault();
        ke.stopPropagation();
      }
    });

    // ── منع التحديد والنسخ ──
    this.addListener('selectstart', (e) => e.preventDefault());
    this.addListener('copy', (e) => e.preventDefault());
    this.addListener('cut', (e) => e.preventDefault());

    // ── كشف DevTools عن طريق حجم النافذة ──
    this.devToolsInterval = setInterval(() => {
      const threshold = 160;
      const devOpen =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;

      if (devOpen) {
        const title = this.translate.instant('Security.DEVTOOLS_TITLE');
        const msg = this.translate.instant('Security.DEVTOOLS_MSG');
        const isAr = this.translate.currentLang === 'ar';

        document.body.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #0d0d0d;
            color: #ff4d6d;
            font-family: ${isAr ? "'Cairo'" : "'Rajdhani', 'Cairo'"}, sans-serif;
            text-align: center;
            direction: ${isAr ? 'rtl' : 'ltr'};
          ">
            <h1 style="font-size: 3rem; margin-bottom: 12px;">🚫</h1>
            <h2 style="font-size: 1.6rem; margin-bottom: 8px;">${title}</h2>
            <p style="font-size: 1rem; color: #aaa;">${msg}</p>
          </div>`;
      }
    }, 1000);
  }

  private addListener(event: string, fn: EventListener): void {
    document.addEventListener(event, fn);
    this.listeners.push({ event, fn });
  }

  ngOnDestroy(): void {
    clearInterval(this.devToolsInterval);
    this.listeners.forEach(({ event, fn }) =>
      document.removeEventListener(event, fn)
    );
  }
}
