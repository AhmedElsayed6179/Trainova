import { Component, OnInit, Renderer2, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { SecurityService } from './core/services/security-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Trainova');
  constructor(private security: SecurityService, private renderer: Renderer2) { }

  ngOnInit() {
    this.fixReCaptchaOnLanguageChange();
  }

  private fixReCaptchaOnLanguageChange() {
    const observer = new MutationObserver(() => {
      this.fixReCaptchaBadge();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['dir', 'class'],
      subtree: true
    });

    setTimeout(() => this.fixReCaptchaBadge(), 1000);
  }

  private fixReCaptchaBadge() {
    const badge = document.querySelector('.grecaptcha-badge') as HTMLElement;
    if (badge) {
      this.renderer.setStyle(badge, 'backgroundColor', 'transparent');

      const iframe = badge.querySelector('iframe');
      if (iframe) {
        this.renderer.setStyle(iframe, 'backgroundColor', '#f9f9f9');
        this.renderer.setStyle(iframe, 'filter', 'none');
      }
    }
  }
}

