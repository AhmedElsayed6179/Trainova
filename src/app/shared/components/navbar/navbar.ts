import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit, OnDestroy {
  isDark: boolean = false;
  currentLang: string = 'EN';
  isLoggedIn: boolean = false;
  currentUser: any = null;
  profileImage: string = 'default-avatar.jpg';
  private storageListener: any;

  constructor(
    private translate: TranslateService,
    private apiService: ApiService,
    private router: Router
  ) {
    translate.setDefaultLang('en');
  }

  ngOnInit(): void {
    this.loadTheme();
    this.loadLanguage();
    this.checkAuthStatus();

    this.storageListener = (event: StorageEvent) => {
      if (event.key === 'currentUser') {
        this.checkAuthStatus();
      }
    };
    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  // ── Auth ──────────────────────────────────────────
  checkAuthStatus(): void {
    this.isLoggedIn = this.apiService.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUser = this.apiService.getCurrentUser();
      this.profileImage = this.currentUser?.profileImage
        ? this.apiService.getFullImageUrl(this.currentUser.profileImage)
        : 'default-avatar.jpg';
    } else {
      this.currentUser = null;
      this.profileImage = 'default-avatar.jpg';
    }
  }

  // ── Theme ─────────────────────────────────────────
  loadTheme(): void {
    this.isDark = true;
    localStorage.setItem('theme', 'dark');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.add('dark-mode');
  }

  // ── Language ──────────────────────────────────────
  loadLanguage(): void {
    const saved = localStorage.getItem('lang') || 'en';
    this.currentLang = saved.toUpperCase();
    this.applyLang(saved);
  }

  toggleLang(): void {
    const newLang = this.currentLang === 'EN' ? 'ar' : 'en';
    this.currentLang = newLang.toUpperCase();
    localStorage.setItem('lang', newLang);
    this.applyLang(newLang);
  }

  private applyLang(lang: string): void {
    this.translate.use(lang);

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.body.dir = dir;
    if (lang === 'ar') {
      document.body.style.fontFamily = "'Cairo', sans-serif";
    } else {
      document.body.style.fontFamily = "'Cairo', 'Rajdhani', sans-serif";
    }
  }

  // ── Mobile Nav ────────────────────────────────────
  closeNavOnMobile(): void {
    const navMenu = document.getElementById('navMenu');
    if (navMenu && navMenu.classList.contains('show')) {
      const bsCollapse = (window as any).bootstrap?.Collapse?.getInstance(navMenu);
      if (bsCollapse) {
        bsCollapse.hide();
      } else {
        navMenu.classList.remove('show');
      }
    }
  }

  // ── Logout ────────────────────────────────────────
  async logout(): Promise<void> {
    this.closeNavOnMobile();

    const confirmTitle = await this.translate.get('Logout.CONFIRM_TITLE').toPromise();
    const confirmText = await this.translate.get('Logout.CONFIRM_TEXT').toPromise();
    const confirmButton = await this.translate.get('Logout.CONFIRM_BUTTON').toPromise();
    const cancelButton = await this.translate.get('Logout.CANCEL_BUTTON').toPromise();
    const successTitle = await this.translate.get('Logout.SUCCESS_TITLE').toPromise();
    const successText = await this.translate.get('Logout.SUCCESS_TEXT').toPromise();

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F5A623',
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmButton,
      cancelButtonText: cancelButton,
      reverseButtons: true,
      didOpen: () => {
        document.body.style.overflow = 'hidden';
      },
      willClose: () => {
        document.body.style.overflow = '';
      }
    });

    if (result.isConfirmed) {
      this.apiService.logout();
      this.isLoggedIn = false;
      this.currentUser = null;
      this.profileImage = 'default-avatar.jpg';

      await Swal.fire({
        icon: 'success',
        title: successTitle,
        text: successText,
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true
      });

      window.location.href = '/';
    }
  }
}
