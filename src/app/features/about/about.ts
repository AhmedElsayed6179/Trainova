import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { User } from '../../core/models/user-profile';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements OnInit, OnDestroy {
  isLoggedIn = false;
  currentUser: User | null = null;

  private storageListener = () => this.checkAuth();

  stats = [
    { value: '10K+', labelKey: 'About.STAT1_LABEL' },
    { value: '30', labelKey: 'About.STAT2_LABEL' },
    { value: '4', labelKey: 'About.STAT3_LABEL' },
    { value: '100%', labelKey: 'About.STAT4_LABEL' },
  ];

  values = [
    { icon: 'fas fa-bullseye', titleKey: 'About.VAL1_TITLE', descKey: 'About.VAL1_DESC' },
    { icon: 'fas fa-shield-halved', titleKey: 'About.VAL2_TITLE', descKey: 'About.VAL2_DESC' },
    { icon: 'fas fa-users', titleKey: 'About.VAL3_TITLE', descKey: 'About.VAL3_DESC' },
    { icon: 'fas fa-rocket', titleKey: 'About.VAL4_TITLE', descKey: 'About.VAL4_DESC' },
  ];

  team = [
    {
      nameKey: 'About.TEAM1_NAME',
      roleKey: 'About.TEAM1_ROLE',
      avatar: 'team/Ahmed.png',
      Contact: 'https://ahmedelsayed6179.github.io/Ahmed-Websites',
    },
  ];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.checkAuth();
    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  private checkAuth(): void {
    this.isLoggedIn = this.apiService.isLoggedIn();
    this.currentUser = this.isLoggedIn ? this.apiService.getCurrentUser() : null;
  }
}
