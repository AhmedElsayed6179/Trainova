import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;
  cardDoneDays = 8;

  doneArr = new Array(8);
  remainArr = new Array(21);

  constructor(
    private translate: TranslateService,
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkAuth();
    window.addEventListener('storage', () => this.checkAuth());
  }

  checkAuth(): void {
    this.isLoggedIn = this.apiService.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUser = this.apiService.getCurrentUser();
      const doneDays = this.currentUser?.completed_days || 8;
      this.cardDoneDays = doneDays;
      const clamped = Math.min(doneDays, 29);
      this.doneArr = new Array(clamped);
      this.remainArr = new Array(Math.max(0, 29 - clamped));
    } else {
      this.currentUser = null;
      this.cardDoneDays = 8;
      this.doneArr = new Array(8);
      this.remainArr = new Array(21);
    }
  }

  features = [
    { icon: 'fas fa-calendar-check', title: 'Home.FEATURE_1', desc: 'Home.FEATURE_1_DESC' },
    { icon: 'fas fa-chart-line', title: 'Home.FEATURE_2', desc: 'Home.FEATURE_2_DESC' },
    { icon: 'fas fa-heartbeat', title: 'Home.FEATURE_3', desc: 'Home.FEATURE_3_DESC' }
  ];

  exercises = [
    { img: 'exercises/abs.jpg', name: 'Home.EXERCISE_ABS', count: 5, cat: 'abs' },
    { img: 'exercises/back.jpg', name: 'Home.EXERCISE_BACK', count: 5, cat: 'back' },
    { img: 'exercises/legs.webp', name: 'Home.EXERCISE_LEGS', count: 5, cat: 'legs' },
    { img: 'exercises/fullbody.jpg', name: 'Home.EXERCISE_FULLBODY', count: 5, cat: 'full-body' }
  ];

  goToCategory(cat: string): void {
    if (!this.isLoggedIn) {
      this.promptLogin();
      return;
    }
    this.router.navigate(['/exercises', cat]);
  }

  promptLogin() {
    this.translate.get([
      'Home.ALERT_TITLE',
      'Home.ALERT_TEXT',
      'Home.ALERT_BUTTON'
    ]).subscribe(translations => {
      Swal.fire({
        icon: 'info',
        title: translations['Home.ALERT_TITLE'],
        text: translations['Home.ALERT_TEXT'],
        confirmButtonText: translations['Home.ALERT_BUTTON'],
        confirmButtonColor: '#F5A623'
      });
    });
  }
}
