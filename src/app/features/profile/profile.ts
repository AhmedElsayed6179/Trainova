import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import Chart from 'chart.js/auto';
import { User, UserStats } from '../../core/models/user-profile';
import { StateService } from '../../core/services/state-service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, RouterLink]
})
export class Profile implements OnInit {

  profileForm: FormGroup;
  passwordForm: FormGroup;
  user: User | null = null;
  isLoading = false;
  isEditing = false;
  isEditingPassword = false;
  isUploading = false;
  isImageLoading = true;
  showNewPassword = false;
  showConfirmPassword = false;

  // ── Crop State ────────────────────────────────────────
  cropZoom = 1;
  private cropOffsetX = 0;
  private cropOffsetY = 0;
  private cropDragStartX = 0;
  private cropDragStartY = 0;
  private cropIsDragging = false;
  private originalFile: File | null = null;


  profileImage: string = 'default-avatar.jpg';
  userStats: UserStats = {
    completed_days: 0,
    total_workouts: 0,
    current_streak: 0,
    monthly: 0,
    weekly: 0,
    goal: '',
    byCategory: {}
  };
  categoryChart: any;
  weeklyChart: any;
  weeklyData: number[] = [0, 0, 0, 0, 0, 0, 0];
  categoryData: { [key: string]: number } = {};
  chartsInitialized = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private stateService: StateService,
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    // Profile Form
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
      username: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      age: [{ value: null, disabled: true }, [Validators.required, Validators.min(10), Validators.max(70)]],
      gender: [{ value: '', disabled: true }, Validators.required],
      weight: [{ value: null, disabled: true }, [Validators.required, Validators.min(20), Validators.max(300)]],
      height: [{ value: null, disabled: true }, [Validators.required, Validators.min(50), Validators.max(300)]],
      phone: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      goal: [{ value: '', disabled: true }, Validators.required]
    });

    // Password Form — no currentPassword required
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // ✅ Load user immediately from state/storage — no delay
    this.user = this.stateService.getUser() || this.apiService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.patchFormValues();
    this.loadProfileImage();

    // ✅ Load all data in parallel immediately
    this.loadAllData();
  }

  // ✅ Patch form immediately with available user data
  patchFormValues() {
    if (!this.user) return;
    this.profileForm.patchValue({
      name: this.user.name,
      username: this.user.username,
      email: this.user.email,
      age: this.user.age,
      gender: this.user.gender,
      weight: this.user.weight,
      height: this.user.height,
      phone: this.user.phone,
      goal: this.user.goal
    });
  }

  loadProfileImage() {
    this.isImageLoading = true;
    if (this.user?.profileImage) {
      this.profileImage = this.apiService.getFullImageUrl(this.user.profileImage);
    } else {
      this.profileImage = 'default-avatar.jpg';
      this.isImageLoading = false;
      return;
    }
    const img = new Image();
    img.onload = () => { this.isImageLoading = false; this.cdr.detectChanges(); };
    img.onerror = () => { this.profileImage = 'default-avatar.jpg'; this.isImageLoading = false; this.cdr.detectChanges(); };
    img.src = this.profileImage;
  }

  // ✅ Load all data in parallel — no sequential waiting
  loadAllData() {
    if (!this.user) return;

    forkJoin({
      stats: this.apiService.getUserStats(this.user._id).pipe(catchError(() => of(null))),
      history: this.apiService.getWorkoutHistory(this.user._id, 'week').pipe(catchError(() => of(null))),
      categories: this.apiService.getCategoryDistribution(this.user._id).pipe(catchError(() => of({})))
    }).subscribe({
      next: ({ stats, history, categories }) => {
        // Update stats
        if (stats) {
          this.userStats = stats;
        }

        // Update weekly data
        if (history?.stats?.daily) {
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            this.weeklyData[6 - i] = history.stats.daily[dateStr] || 0;
          }
        }

        // ✅ Use real category distribution from API
        if (categories && typeof categories === 'object') {
          const catObj = categories as { [key: string]: number };
          // Filter out zero-value entries
          this.categoryData = Object.fromEntries(
            Object.entries(catObj).filter(([, v]) => v > 0)
          );
          // Also update userStats.byCategory for chart
          this.userStats.byCategory = this.categoryData;
        }

        this.cdr.detectChanges();
        // ✅ Init charts right after data is ready
        setTimeout(() => this.initCharts(), 50);
      },
      error: (err) => {
        console.error('Error loading profile data:', err);
        // Still init charts with whatever data we have
        setTimeout(() => this.initCharts(), 50);
      }
    });
  }

  initCharts() {
    this.initCategoryChart();
    this.initWeeklyChart();
    this.chartsInitialized = true;
  }

  initCategoryChart() {
    const ctx1 = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx1) return;
    if (this.categoryChart) { this.categoryChart.destroy(); }

    const categories = Object.keys(this.categoryData);
    const values = Object.values(this.categoryData) as number[];

    // ✅ Only show "no data" placeholder when truly empty
    const hasRealData = categories.length > 0 && values.some(v => v > 0);
    const chartLabels = hasRealData
      ? categories.map(c => this.getCategoryName(c))
      : [this.translate.instant('Profile.NO_DATA')];
    const chartValues = hasRealData ? values : [1];
    const chartColors = hasRealData
      ? ['#ffc107', '#28a745', '#17a2b8', '#dc3545', '#6c757d', '#6f42c1']
      : ['rgba(255,255,255,0.1)'];

    this.categoryChart = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartValues,
          backgroundColor: chartColors,
          borderWidth: 0,
          hoverOffset: hasRealData ? 4 : 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Cairo, sans-serif', size: 12 },
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (!hasRealData) return this.translate.instant('Profile.NO_CATEGORY_DATA');
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value} ${this.translate.instant('Profile.WORKOUTS')}`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  initWeeklyChart() {
    const ctx2 = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (!ctx2) return;
    if (this.weeklyChart) { this.weeklyChart.destroy(); }

    this.weeklyChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: this.getWeekDays(),
        datasets: [{
          label: this.translate.instant('Profile.WORKOUTS_COUNT'),
          data: this.weeklyData,
          backgroundColor: '#ffc107',
          borderRadius: 8,
          hoverBackgroundColor: '#ff9800'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.raw} ${this.translate.instant('Profile.WORKOUTS')}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { display: true, color: 'rgba(0,0,0,0.05)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  getWeekDays(): string[] {
    const days = [];
    const today = new Date().getDay();
    const dayNames = this.translate.instant('Profile.DAYS');
    if (Array.isArray(dayNames)) {
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7;
        days.push(dayNames[dayIndex]);
      }
    } else {
      const defaultDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7;
        days.push(defaultDays[dayIndex]);
      }
    }
    return days;
  }

  getCategoryName(category: string): string {
    const names: any = {
      abs: 'Profile.CATEGORIES.ABS',
      legs: 'Profile.CATEGORIES.LEGS',
      'full-body': 'Profile.CATEGORIES.FULL_BODY',
      back: 'Profile.CATEGORIES.BACK',
      all: 'Profile.CATEGORIES.ALL'
    };
    return names[category] ? this.translate.instant(names[category]) : category;
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notMatching: true };
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.patchFormValues();
      this.profileForm.disable();
    } else {
      this.profileForm.enable();
    }
  }

  togglePasswordEdit() {
    this.isEditingPassword = !this.isEditingPassword;
    if (!this.isEditingPassword) {
      this.passwordForm.reset();
    }
  }

  getPasswordStrength(): number {
    const pw = this.passwordForm.get('newPassword')?.value || '';
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (/[A-Z]/.test(pw)) score += 25;
    if (/[0-9]/.test(pw)) score += 25;
    if (/[\W_]/.test(pw)) score += 25;
    return score;
  }

  getPasswordStrengthLabel(): string {
    const s = this.getPasswordStrength();
    if (s <= 33) return 'Profile.PASSWORD_WEAK';
    if (s <= 66) return 'Profile.PASSWORD_MEDIUM';
    return 'Profile.PASSWORD_STRONG';
  }

  togglePasswordVisibility(field: string) {
    if (field === 'new') this.showNewPassword = !this.showNewPassword;
    else if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }

  uploadImageFile(file: File) {
    this.isUploading = true;
    this.apiService.uploadProfileImageFile(this.user!._id, file).subscribe({
      next: (res) => {
        if (res.success) {
          this.user!.profileImage = res.imageUrl;
          this.apiService.updateUserData(this.user!);
          this.stateService.notifyImageUpdated(res.imageUrl);
          Swal.fire({
            icon: 'success', title: this.translate.instant('SUCCESS'),
            text: this.translate.instant('Profile.IMAGE_UPDATED'),
            timer: 1500, showConfirmButton: false
          }).then(() => window.location.reload());
        }
      },
      error: (err) => {
        console.error('Upload error:', err);
        Swal.fire({
          icon: 'error', title: this.translate.instant('ERROR'),
          text: this.translate.instant('Profile.IMAGE_FAILED'),
          confirmButtonColor: '#ffc107'
        }).then(() => window.location.reload());
        this.loadProfileImage();
      },
      complete: () => { this.isUploading = false; }
    });
  }

  deleteImage() {
    Swal.fire({
      title: this.translate.instant('Profile.DELETE_IMAGE_TITLE'),
      text: this.translate.instant('Profile.DELETE_IMAGE_CONFIRM'),
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d',
      confirmButtonText: this.translate.instant('Profile.DELETE_YES'),
      cancelButtonText: this.translate.instant('Profile.DELETE_NO'),
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.isUploading = true;
        this.apiService.deleteProfileImage(this.user!._id).subscribe({
          next: (res) => {
            if (res.success) {
              this.user!.profileImage = null;
              this.apiService.updateUserData(this.user!);
              this.profileImage = 'default-avatar.jpg';
              Swal.fire({
                icon: 'success', title: this.translate.instant('SUCCESS'),
                text: this.translate.instant('Profile.IMAGE_DELETED'),
                timer: 1500, showConfirmButton: false
              }).then(() => window.location.reload());
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            Swal.fire({
              icon: 'error', title: this.translate.instant('ERROR'),
              text: this.translate.instant('Profile.IMAGE_DELETE_FAILED'),
              confirmButtonColor: '#ffc107'
            }).then(() => window.location.reload());
          },
          complete: () => { this.isUploading = false; }
        });
      }
    });
  }

  takePhoto() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
    input.onchange = (event: any) => { if (event.target.files[0]) this.onImageSelected(event); };
    input.click();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Profile.IMAGE_TOO_LARGE'), confirmButtonColor: '#ffc107' });
      return;
    }
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
      Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Profile.IMAGE_TYPE_ERROR'), confirmButtonColor: '#ffc107' });
      return;
    }
    this.originalFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.openCropModal(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  openCropModal(imageSrc: string) {
    this.originalImageSrc = imageSrc;
    this.cropZoom = 1;
    this.cropOffsetX = 0;
    this.cropOffsetY = 0;
    this.cropIsDragging = false;

    // Build SweetAlert2 with inline crop canvas
    Swal.fire({
      title: this.translate.instant('Profile.CROP_TITLE'),
      background: '#1a1a2e',
      color: '#fff',
      showCloseButton: true,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: `<i class="fas fa-check me-1"></i> ${this.translate.instant('Profile.CROP_APPLY')}`,
      cancelButtonText: `<i class="fas fa-times me-1"></i> ${this.translate.instant('Profile.CANCEL')}`,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      customClass: {
        popup: 'swal-crop-tool-popup',
        confirmButton: 'swal-crop-confirm-btn',
        cancelButton: 'swal-crop-cancel-btn',
      },
      html: `
        <div class="swal-crop-wrapper">
          <div class="swal-crop-area" id="swalCropArea">
            <canvas id="swalCropCanvas"></canvas>
            <div class="swal-crop-overlay">
              <div class="swal-crop-circle" id="swalCropCircle">
                <div class="swal-crop-circle-border"></div>
              </div>
            </div>
            <div class="swal-crop-hint" id="swalCropHint">
              <i class="fas fa-arrows-alt"></i>
              <span>${this.translate.instant('Profile.CROP_ZOOM_HINT')}</span>
            </div>
          </div>
          <div class="swal-crop-controls">
            <button class="swal-zoom-btn" id="swalZoomOut" type="button"><i class="fas fa-search-minus"></i></button>
            <div class="swal-zoom-track">
              <div class="swal-zoom-fill" id="swalZoomFill"></div>
              <input type="range" id="swalZoomSlider" min="0.5" max="3" step="0.01" value="1">
            </div>
            <button class="swal-zoom-btn" id="swalZoomIn" type="button"><i class="fas fa-search-plus"></i></button>
            <button class="swal-zoom-btn swal-reset-btn" id="swalReset" type="button" title="Reset">
              <i class="fas fa-undo-alt"></i>
            </button>
          </div>
          <div class="swal-crop-previews">
            <div class="swal-preview-item">
              <canvas id="swalPreviewLg" width="64" height="64"></canvas>
              <span>64px</span>
            </div>
            <div class="swal-preview-item">
              <canvas id="swalPreviewSm" width="36" height="36"></canvas>
              <span>36px</span>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        this.initSwalCrop(imageSrc);
      },
      preConfirm: () => {
        return this.getSwalCroppedBlob();
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const blob = result.value as Blob;
        const croppedFile = new File([blob], this.originalFile?.name || 'profile.jpg', { type: 'image/jpeg' });
        // Show preview immediately
        const url = URL.createObjectURL(blob);
        this.profileImage = url;
        this.uploadImageFile(croppedFile);
      } else {
        this.originalFile = null;
      }
    });
  }

  private swalCropCtx: CanvasRenderingContext2D | null = null;
  private swalCropImg: HTMLImageElement | null = null;
  private swalCropSize = 0;
  private swalCropRadius = 0;
  private originalImageSrc = '';

  private initSwalCrop(imageSrc: string) {
    const area = document.getElementById('swalCropArea') as HTMLDivElement;
    const canvas = document.getElementById('swalCropCanvas') as HTMLCanvasElement;
    if (!area || !canvas) return;

    // Responsive size — fill popup width, max 400
    const popupW = area.offsetWidth || 340;
    const size = Math.min(popupW, 400);
    this.swalCropSize = size;
    this.swalCropRadius = Math.floor(size * 0.44);

    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    // Style crop circle overlay to match
    const circle = document.getElementById('swalCropCircle') as HTMLDivElement;
    if (circle) {
      const d = this.swalCropRadius * 2;
      circle.style.width = d + 'px';
      circle.style.height = d + 'px';
    }

    this.swalCropCtx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      this.swalCropImg = img;
      // Fit image to fill the circle on load
      const minDim = Math.min(img.width, img.height);
      this.cropZoom = (this.swalCropRadius * 2) / minDim;
      this.cropOffsetX = 0;
      this.cropOffsetY = 0;
      this.renderSwalCrop();
      this.updateSwalZoomUI();
    };
    img.src = imageSrc;

    // Zoom slider
    const slider = document.getElementById('swalZoomSlider') as HTMLInputElement;
    slider?.addEventListener('input', () => {
      this.cropZoom = parseFloat(slider.value);
      this.renderSwalCrop();
      this.updateSwalZoomUI();
    });

    // Zoom buttons
    document.getElementById('swalZoomOut')?.addEventListener('click', () => {
      this.cropZoom = Math.max(0.5, this.cropZoom - 0.1);
      this.renderSwalCrop(); this.updateSwalZoomUI();
    });
    document.getElementById('swalZoomIn')?.addEventListener('click', () => {
      this.cropZoom = Math.min(3, this.cropZoom + 0.1);
      this.renderSwalCrop(); this.updateSwalZoomUI();
    });

    // Reset
    document.getElementById('swalReset')?.addEventListener('click', () => {
      if (!this.swalCropImg) return;
      const minDim = Math.min(this.swalCropImg.width, this.swalCropImg.height);
      this.cropZoom = (this.swalCropRadius * 2) / minDim;
      this.cropOffsetX = 0;
      this.cropOffsetY = 0;
      this.renderSwalCrop(); this.updateSwalZoomUI();
    });

    // Drag — mouse
    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.cropIsDragging = true;
      this.cropDragStartX = e.clientX - this.cropOffsetX;
      this.cropDragStartY = e.clientY - this.cropOffsetY;
      canvas.style.cursor = 'grabbing';
      const hint = document.getElementById('swalCropHint');
      if (hint) hint.style.opacity = '0';
    });
    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.cropIsDragging) return;
      this.cropOffsetX = e.clientX - this.cropDragStartX;
      this.cropOffsetY = e.clientY - this.cropDragStartY;
      this.renderSwalCrop();
    });
    window.addEventListener('mouseup', () => {
      this.cropIsDragging = false;
      canvas.style.cursor = 'grab';
    });

    // Drag — touch
    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      this.cropDragStartX = t.clientX - this.cropOffsetX;
      this.cropDragStartY = t.clientY - this.cropOffsetY;
      const hint = document.getElementById('swalCropHint');
      if (hint) hint.style.opacity = '0';
    }, { passive: false });
    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t = e.touches[0];
        this.cropOffsetX = t.clientX - this.cropDragStartX;
        this.cropOffsetY = t.clientY - this.cropDragStartY;
        this.renderSwalCrop();
      }
    }, { passive: false });

    // Wheel zoom
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.cropZoom = Math.min(3, Math.max(0.5, this.cropZoom + (e.deltaY > 0 ? -0.05 : 0.05)));
      this.renderSwalCrop(); this.updateSwalZoomUI();
    }, { passive: false });
  }

  private renderSwalCrop() {
    const ctx = this.swalCropCtx;
    const img = this.swalCropImg;
    if (!ctx || !img) return;
    const size = this.swalCropSize;

    ctx.clearRect(0, 0, size, size);
    const scaledW = img.width * this.cropZoom;
    const scaledH = img.height * this.cropZoom;
    const drawX = size / 2 - scaledW / 2 + this.cropOffsetX;
    const drawY = size / 2 - scaledH / 2 + this.cropOffsetY;
    ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

    // Draw previews
    this.renderSwalPreview('swalPreviewLg', img, drawX, drawY, scaledW, scaledH, size, 64);
    this.renderSwalPreview('swalPreviewSm', img, drawX, drawY, scaledW, scaledH, size, 36);
  }

  private renderSwalPreview(id: string, img: HTMLImageElement, drawX: number, drawY: number, scaledW: number, scaledH: number, size: number, pSize: number) {
    const pc = document.getElementById(id) as HTMLCanvasElement;
    if (!pc) return;
    const pCtx = pc.getContext('2d')!;
    const scale = pSize / size;
    pCtx.clearRect(0, 0, pSize, pSize);
    pCtx.save();
    pCtx.beginPath();
    pCtx.arc(pSize / 2, pSize / 2, pSize / 2, 0, Math.PI * 2);
    pCtx.clip();
    pCtx.drawImage(img, drawX * scale, drawY * scale, scaledW * scale, scaledH * scale);
    pCtx.restore();
  }

  private updateSwalZoomUI() {
    const slider = document.getElementById('swalZoomSlider') as HTMLInputElement;
    const fill = document.getElementById('swalZoomFill') as HTMLDivElement;
    if (slider) slider.value = String(this.cropZoom);
    const pct = ((this.cropZoom - 0.5) / 2.5) * 100;
    if (fill) fill.style.width = pct + '%';
  }

  private getSwalCroppedBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = this.swalCropImg;
      if (!img) return resolve(null);
      const outputSize = 400;
      const offscreen = document.createElement('canvas');
      offscreen.width = outputSize;
      offscreen.height = outputSize;
      const ctx = offscreen.getContext('2d')!;
      const scale = outputSize / this.swalCropSize;
      const scaledW = img.width * this.cropZoom * scale;
      const scaledH = img.height * this.cropZoom * scale;
      const drawX = outputSize / 2 - scaledW / 2 + this.cropOffsetX * scale;
      const drawY = outputSize / 2 - scaledH / 2 + this.cropOffsetY * scale;
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
      offscreen.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }

  cancelCrop() {
    this.swalCropImg = null;
    this.swalCropCtx = null;
    this.originalFile = null;
  }


  onSubmit() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Profile.FORM_INVALID'), confirmButtonColor: '#ffc107' });
      return;
    }
    this.isLoading = true;
    const updatedData = this.profileForm.value;
    const oldGoal = this.user!.goal;

    // Build uniqueness checks only for changed fields
    const checks: Promise<void>[] = [];

    if (updatedData.username && updatedData.username !== this.user!.username) {
      checks.push(
        this.apiService.checkUsername(updatedData.username).toPromise().then((res: any) => {
          if (res?.exists) throw new Error('username_taken');
        })
      );
    }

    if (updatedData.email && updatedData.email !== this.user!.email) {
      checks.push(
        this.apiService.checkEmail(updatedData.email).toPromise().then((res: any) => {
          if (res?.exists) throw new Error('email_taken');
        })
      );
    }

    if (updatedData.phone && updatedData.phone !== this.user!.phone) {
      checks.push(
        this.apiService.checkPhone(updatedData.phone).toPromise().then((res: any) => {
          if (res?.exists) throw new Error('phone_taken');
        })
      );
    }

    Promise.all(checks).then(() => {
      this.apiService.updateProfile(this.user!._id, updatedData).subscribe({
        next: (res) => {
          if (res.success) {
            this.user = { ...this.user!, ...res.user };
            this.apiService.updateUserData(this.user!);
            this.stateService.notifyProfileUpdated(this.user!);
            this.isEditing = false;
            if (updatedData.goal !== oldGoal) {
              this.stateService.notifyGoalChanged(updatedData.goal);
              this.regenerateWorkouts();
            }
            Swal.fire({
              icon: 'success', title: this.translate.instant('SUCCESS'),
              text: this.translate.instant('Profile.UPDATED'),
              timer: 1500, showConfirmButton: false
            }).then(() => window.location.reload());
          }
        },
        error: (err) => {
          console.error('Update error:', err);
          Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Profile.UPDATE_FAILED'), confirmButtonColor: '#ffc107' });
        },
        complete: () => { this.isLoading = false; }
      });
    }).catch((err: Error) => {
      this.isLoading = false;
      if (err.message === 'username_taken') {
        Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Register.ERRORS.username.exists'), confirmButtonColor: '#ffc107' });
      } else if (err.message === 'email_taken') {
        Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Register.ERRORS.email.exists'), confirmButtonColor: '#ffc107' });
      } else if (err.message === 'phone_taken') {
        Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Register.ERRORS.phone.exists'), confirmButtonColor: '#ffc107' });
      } else {
        Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Profile.UPDATE_FAILED'), confirmButtonColor: '#ffc107' });
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
      Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Profile.PASSWORD_FORM_INVALID'), confirmButtonColor: '#ffc107' });
      return;
    }
    this.isLoading = true;
    const passwordData = {
      newPassword: this.passwordForm.value.newPassword
    };
    this.apiService.changePassword(this.user!._id, passwordData as any).subscribe({
      next: (res) => {
        if (res.success) {
          this.isEditingPassword = false;
          this.passwordForm.reset();
          Swal.fire({
            icon: 'success', title: this.translate.instant('SUCCESS'),
            text: this.translate.instant('Profile.PASSWORD_UPDATED'),
            timer: 1500, showConfirmButton: false
          }).then(() => window.location.reload());
        } else {
          const errorMsg = res.error === 'invalid_current_password'
            ? 'Profile.INVALID_CURRENT_PASSWORD'
            : 'Profile.PASSWORD_CHANGE_FAILED';
          Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant(errorMsg), confirmButtonColor: '#ffc107' });
        }
      },
      error: (err) => {
        console.error('Password change error:', err);
        Swal.fire({ icon: 'error', title: this.translate.instant('ERROR'), text: this.translate.instant('Profile.PASSWORD_CHANGE_FAILED'), confirmButtonColor: '#ffc107' });
      },
      complete: () => { this.isLoading = false; }
    });
  }

  regenerateWorkouts() {
    this.apiService.generateDailyWorkout(this.user!._id).subscribe({
      next: () => console.log('Workouts regenerated for new goal'),
      error: (err) => console.error('Error regenerating workouts:', err)
    });
  }

  formatNumber(num: number): string {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  }

  getGoalName(goal: string): string {
    const keys: any = {
      abs: 'Profile.GOALS.ABS',
      legs: 'Profile.GOALS.LEGS',
      'full-body': 'Profile.GOALS.FULL_BODY',
      back: 'Profile.GOALS.BACK',
      all: 'Profile.GOALS.ALL'
    };
    const fallback: any = {
      abs: 'Abs & Core',
      legs: 'Legs',
      'full-body': 'Full Body',
      back: 'Back & Shoulders',
      all: 'All Areas'
    };
    if (!keys[goal]) return goal;
    const translated = this.translate.instant(keys[goal]);
    return (translated && translated !== keys[goal]) ? translated : fallback[goal];
  }

  hasError(controlName: string, errorName: string, form: FormGroup = this.profileForm): boolean {
    const control = form.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  getErrorMessage(controlName: string, form: FormGroup = this.profileForm): string {
    const control = form.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    if (control.hasError('required')) return `Register.ERRORS.${controlName}.required`;
    if (control.hasError('email')) return 'Register.ERRORS.email.email';
    if (control.hasError('minlength')) return `Register.ERRORS.${controlName}.minlength`;
    if (control.hasError('maxlength')) return `Register.ERRORS.${controlName}.maxlength`;
    if (control.hasError('min')) return `Register.ERRORS.${controlName}.min`;
    if (control.hasError('max')) return `Register.ERRORS.${controlName}.max`;
    if (control.hasError('pattern')) {
      if (controlName === 'newPassword' || controlName === 'currentPassword') return 'Register.ERRORS.password.pattern';
      return `Register.ERRORS.${controlName}.pattern`;
    }
    if (control.hasError('notMatching')) return 'Register.ERRORS.confirmPassword.notMatching';
    return '';
  }

  // ── DELETE ACCOUNT ──────────────────────────────────────────────
  deleteConfirmUsername: string = '';
  isDeletingAccount: boolean = false;
  showDangerZone: boolean = false;

  toggleDangerZone(): void {
    this.showDangerZone = !this.showDangerZone;
    if (!this.showDangerZone) this.deleteConfirmUsername = '';
  }

  async deleteAccount() {
    if (!this.user) return;
    if (!this.deleteConfirmUsername.trim()) {
      Swal.fire({ icon: 'warning', title: this.translate.instant('Profile.DELETE_ACCOUNT_MISMATCH'), background: '#1a1a2e', color: '#fff', confirmButtonColor: '#dc3545' });
      return;
    }
    if (this.deleteConfirmUsername !== this.user.username) {
      Swal.fire({ icon: 'error', title: this.translate.instant('Profile.DELETE_ACCOUNT_WRONG_USERNAME'), background: '#1a1a2e', color: '#fff', confirmButtonColor: '#dc3545' });
      return;
    }
    this.isDeletingAccount = true;
    try {
      const res = await fetch(`${environment.apiUrl}/profile/${this.user._id}/delete-account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.deleteConfirmUsername })
      });
      const data = await res.json();
      if (data.success) {
        this.stateService.clearState();
        await Swal.fire({
          icon: 'success', title: this.translate.instant('Profile.DELETE_ACCOUNT_SUCCESS'),
          background: '#1a1a2e', color: '#fff', confirmButtonColor: '#F5A623',
          timer: 3000, showConfirmButton: false
        });
        window.location.href = '/login';
      } else {
        Swal.fire({ icon: 'error', title: data.error || this.translate.instant('Profile.DELETE_ACCOUNT_WRONG_USERNAME'), background: '#1a1a2e', color: '#fff', confirmButtonColor: '#dc3545' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error deleting account', background: '#1a1a2e', color: '#fff', confirmButtonColor: '#dc3545' });
    } finally {
      this.isDeletingAccount = false;
    }
  }
}
