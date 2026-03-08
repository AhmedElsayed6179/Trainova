import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

export interface Exercise {
  id: number;
  name: string;
  nameKey: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  difficultyKey: string;
  sets: number;
  reps: string;
  muscles: string;
  musclesKey: string;
  icon: string;
  img: string;
  instructions: string;
  tips: string;
}

@Component({
  selector: 'app-exercise-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './exercise-card.html',
  styleUrl: './exercise-card.css',
})
export class ExerciseCard implements OnInit {
  category: string = 'abs';
  selectedExercise: Exercise | null = null;

  allExercises: Exercise[] = [
    // ── ABS ──
    { id: 1, name: 'ExerciseCard.ABS.EX1_NAME', nameKey: 'ExerciseCard.ABS.EX1_NAME', category: 'abs', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '30s', muscles: 'ExerciseCard.ABS.EX1_MUSCLES', musclesKey: 'ExerciseCard.ABS.EX1_MUSCLES', icon: 'fas fa-circle-dot', img: 'exercises/abs/plank.jpg', instructions: 'ExerciseCard.ABS.EX1_INSTRUCTIONS', tips: 'ExerciseCard.ABS.EX1_TIPS' },
    { id: 2, name: 'ExerciseCard.ABS.EX2_NAME', nameKey: 'ExerciseCard.ABS.EX2_NAME', category: 'abs', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '15', muscles: 'ExerciseCard.ABS.EX2_MUSCLES', musclesKey: 'ExerciseCard.ABS.EX2_MUSCLES', icon: 'fas fa-circle-dot', img: 'exercises/abs/crunches.jpg', instructions: 'ExerciseCard.ABS.EX2_INSTRUCTIONS', tips: 'ExerciseCard.ABS.EX2_TIPS' },
    { id: 3, name: 'ExerciseCard.ABS.EX3_NAME', nameKey: 'ExerciseCard.ABS.EX3_NAME', category: 'abs', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 3, reps: '20', muscles: 'ExerciseCard.ABS.EX3_MUSCLES', musclesKey: 'ExerciseCard.ABS.EX3_MUSCLES', icon: 'fas fa-circle-dot', img: 'exercises/abs/legRaises.jpg', instructions: 'ExerciseCard.ABS.EX3_INSTRUCTIONS', tips: 'ExerciseCard.ABS.EX3_TIPS' },
    { id: 4, name: 'ExerciseCard.ABS.EX4_NAME', nameKey: 'ExerciseCard.ABS.EX4_NAME', category: 'abs', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 3, reps: '20 each', muscles: 'ExerciseCard.ABS.EX4_MUSCLES', musclesKey: 'ExerciseCard.ABS.EX4_MUSCLES', icon: 'fas fa-circle-dot', img: 'exercises/abs/russian.webp', instructions: 'ExerciseCard.ABS.EX4_INSTRUCTIONS', tips: 'ExerciseCard.ABS.EX4_TIPS' },
    { id: 5, name: 'ExerciseCard.ABS.EX5_NAME', nameKey: 'ExerciseCard.ABS.EX5_NAME', category: 'abs', difficulty: 'advanced', difficultyKey: 'ExerciseCard.DIFFICULTY.ADVANCED', sets: 4, reps: '12', muscles: 'ExerciseCard.ABS.EX5_MUSCLES', musclesKey: 'ExerciseCard.ABS.EX5_MUSCLES', icon: 'fas fa-circle-dot', img: 'exercises/abs/vUp.jpg', instructions: 'ExerciseCard.ABS.EX5_INSTRUCTIONS', tips: 'ExerciseCard.ABS.EX5_TIPS' },

    // ── LEGS ──
    { id: 6, name: 'ExerciseCard.LEGS.EX1_NAME', nameKey: 'ExerciseCard.LEGS.EX1_NAME', category: 'legs', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '15', muscles: 'ExerciseCard.LEGS.EX1_MUSCLES', musclesKey: 'ExerciseCard.LEGS.EX1_MUSCLES', icon: 'fas fa-person-running', img: 'exercises/legs/squats.webp', instructions: 'ExerciseCard.LEGS.EX1_INSTRUCTIONS', tips: 'ExerciseCard.LEGS.EX1_TIPS' },
    { id: 7, name: 'ExerciseCard.LEGS.EX2_NAME', nameKey: 'ExerciseCard.LEGS.EX2_NAME', category: 'legs', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '12 each', muscles: 'ExerciseCard.LEGS.EX2_MUSCLES', musclesKey: 'ExerciseCard.LEGS.EX2_MUSCLES', icon: 'fas fa-person-running', img: 'exercises/legs/lunges.jpg', instructions: 'ExerciseCard.LEGS.EX2_INSTRUCTIONS', tips: 'ExerciseCard.LEGS.EX2_TIPS' },
    { id: 8, name: 'ExerciseCard.LEGS.EX3_NAME', nameKey: 'ExerciseCard.LEGS.EX3_NAME', category: 'legs', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 3, reps: '20', muscles: 'ExerciseCard.LEGS.EX3_MUSCLES', musclesKey: 'ExerciseCard.LEGS.EX3_MUSCLES', icon: 'fas fa-person-running', img: 'exercises/legs/calfRaises.webp', instructions: 'ExerciseCard.LEGS.EX3_INSTRUCTIONS', tips: 'ExerciseCard.LEGS.EX3_TIPS' },
    { id: 9, name: 'ExerciseCard.LEGS.EX4_NAME', nameKey: 'ExerciseCard.LEGS.EX4_NAME', category: 'legs', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 4, reps: '10 each', muscles: 'ExerciseCard.LEGS.EX4_MUSCLES', musclesKey: 'ExerciseCard.LEGS.EX4_MUSCLES', icon: 'fas fa-person-running', img: 'exercises/legs/bulgarianSplit.jpg', instructions: 'ExerciseCard.LEGS.EX4_INSTRUCTIONS', tips: 'ExerciseCard.LEGS.EX4_TIPS' },
    { id: 10, name: 'ExerciseCard.LEGS.EX5_NAME', nameKey: 'ExerciseCard.LEGS.EX5_NAME', category: 'legs', difficulty: 'advanced', difficultyKey: 'ExerciseCard.DIFFICULTY.ADVANCED', sets: 3, reps: '8 each', muscles: 'ExerciseCard.LEGS.EX5_MUSCLES', musclesKey: 'ExerciseCard.LEGS.EX5_MUSCLES', icon: 'fas fa-person-running', img: 'exercises/legs/pistolSquat.jpg', instructions: 'ExerciseCard.LEGS.EX5_INSTRUCTIONS', tips: 'ExerciseCard.LEGS.EX5_TIPS' },

    // ── BACK ──
    { id: 11, name: 'ExerciseCard.BACK.EX1_NAME', nameKey: 'ExerciseCard.BACK.EX1_NAME', category: 'back', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '10', muscles: 'ExerciseCard.BACK.EX1_MUSCLES', musclesKey: 'ExerciseCard.BACK.EX1_MUSCLES', icon: 'fas fa-arrows-up-down', img: 'exercises/back/pullUps.jpg', instructions: 'ExerciseCard.BACK.EX1_INSTRUCTIONS', tips: 'ExerciseCard.BACK.EX1_TIPS' },
    { id: 12, name: 'ExerciseCard.BACK.EX2_NAME', nameKey: 'ExerciseCard.BACK.EX2_NAME', category: 'back', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '15', muscles: 'ExerciseCard.BACK.EX2_MUSCLES', musclesKey: 'ExerciseCard.BACK.EX2_MUSCLES', icon: 'fas fa-arrows-up-down', img: 'exercises/back/superMan.jpg', instructions: 'ExerciseCard.BACK.EX2_INSTRUCTIONS', tips: 'ExerciseCard.BACK.EX2_TIPS' },
    { id: 13, name: 'ExerciseCard.BACK.EX3_NAME', nameKey: 'ExerciseCard.BACK.EX3_NAME', category: 'back', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 3, reps: '12', muscles: 'ExerciseCard.BACK.EX3_MUSCLES', musclesKey: 'ExerciseCard.BACK.EX3_MUSCLES', icon: 'fas fa-arrows-up-down', img: 'exercises/back/inverted.webp', instructions: 'ExerciseCard.BACK.EX3_INSTRUCTIONS', tips: 'ExerciseCard.BACK.EX3_TIPS' },
    { id: 14, name: 'ExerciseCard.BACK.EX4_NAME', nameKey: 'ExerciseCard.BACK.EX4_NAME', category: 'back', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 4, reps: '12', muscles: 'ExerciseCard.BACK.EX4_MUSCLES', musclesKey: 'ExerciseCard.BACK.EX4_MUSCLES', icon: 'fas fa-arrows-up-down', img: 'exercises/back/bentOverRow.jpg', instructions: 'ExerciseCard.BACK.EX4_INSTRUCTIONS', tips: 'ExerciseCard.BACK.EX4_TIPS' },
    { id: 15, name: 'ExerciseCard.BACK.EX5_NAME', nameKey: 'ExerciseCard.BACK.EX5_NAME', category: 'back', difficulty: 'advanced', difficultyKey: 'ExerciseCard.DIFFICULTY.ADVANCED', sets: 4, reps: '8', muscles: 'ExerciseCard.BACK.EX5_MUSCLES', musclesKey: 'ExerciseCard.BACK.EX5_MUSCLES', icon: 'fas fa-arrows-up-down', img: 'exercises/back/muscleUp.webp', instructions: 'ExerciseCard.BACK.EX5_INSTRUCTIONS', tips: 'ExerciseCard.BACK.EX5_TIPS' },

    // ── FULL BODY ──
    { id: 16, name: 'ExerciseCard.FULLBODY.EX1_NAME', nameKey: 'ExerciseCard.FULLBODY.EX1_NAME', category: 'full-body', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '15', muscles: 'ExerciseCard.FULLBODY.EX1_MUSCLES', musclesKey: 'ExerciseCard.FULLBODY.EX1_MUSCLES', icon: 'fas fa-person', img: 'exercises/fullbody/burpees.jpg', instructions: 'ExerciseCard.FULLBODY.EX1_INSTRUCTIONS', tips: 'ExerciseCard.FULLBODY.EX1_TIPS' },
    { id: 17, name: 'ExerciseCard.FULLBODY.EX2_NAME', nameKey: 'ExerciseCard.FULLBODY.EX2_NAME', category: 'full-body', difficulty: 'beginner', difficultyKey: 'ExerciseCard.DIFFICULTY.BEGINNER', sets: 3, reps: '12', muscles: 'ExerciseCard.FULLBODY.EX2_MUSCLES', musclesKey: 'ExerciseCard.FULLBODY.EX2_MUSCLES', icon: 'fas fa-person', img: 'exercises/fullbody/pushUp.jpg', instructions: 'ExerciseCard.FULLBODY.EX2_INSTRUCTIONS', tips: 'ExerciseCard.FULLBODY.EX2_TIPS' },
    { id: 18, name: 'ExerciseCard.FULLBODY.EX3_NAME', nameKey: 'ExerciseCard.FULLBODY.EX3_NAME', category: 'full-body', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 3, reps: '10', muscles: 'ExerciseCard.FULLBODY.EX3_MUSCLES', musclesKey: 'ExerciseCard.FULLBODY.EX3_MUSCLES', icon: 'fas fa-person', img: 'exercises/fullbody/mountainClimber.jpg', instructions: 'ExerciseCard.FULLBODY.EX3_INSTRUCTIONS', tips: 'ExerciseCard.FULLBODY.EX3_TIPS' },
    { id: 19, name: 'ExerciseCard.FULLBODY.EX4_NAME', nameKey: 'ExerciseCard.FULLBODY.EX4_NAME', category: 'full-body', difficulty: 'intermediate', difficultyKey: 'ExerciseCard.DIFFICULTY.INTERMEDIATE', sets: 4, reps: '12', muscles: 'ExerciseCard.FULLBODY.EX4_MUSCLES', musclesKey: 'ExerciseCard.FULLBODY.EX4_MUSCLES', icon: 'fas fa-person', img: 'exercises/fullbody/jumpSquat.jpg', instructions: 'ExerciseCard.FULLBODY.EX4_INSTRUCTIONS', tips: 'ExerciseCard.FULLBODY.EX4_TIPS' },
    { id: 20, name: 'ExerciseCard.FULLBODY.EX5_NAME', nameKey: 'ExerciseCard.FULLBODY.EX5_NAME', category: 'full-body', difficulty: 'advanced', difficultyKey: 'ExerciseCard.DIFFICULTY.ADVANCED', sets: 4, reps: '8', muscles: 'ExerciseCard.FULLBODY.EX5_MUSCLES', musclesKey: 'ExerciseCard.FULLBODY.EX5_MUSCLES', icon: 'fas fa-person', img: 'exercises/fullbody/spiderMan.jpg', instructions: 'ExerciseCard.FULLBODY.EX5_INSTRUCTIONS', tips: 'ExerciseCard.FULLBODY.EX5_TIPS' },
  ];

  get filteredExercises(): Exercise[] {
    return this.allExercises.filter(e => e.category === this.category);
  }

  get categoryTitleKey(): string {
    const map: Record<string, string> = {
      'abs': 'Home.EXERCISE_ABS',
      'legs': 'Home.EXERCISE_LEGS',
      'back': 'Home.EXERCISE_BACK',
      'full-body': 'Home.EXERCISE_FULLBODY'
    };
    return map[this.category] || 'ExerciseCard.ALL';
  }

  get categoryIconClass(): string {
    const map: Record<string, string> = {
      'abs': 'fas fa-circle-dot',
      'legs': 'fas fa-person-running',
      'back': 'fas fa-arrows-up-down',
      'full-body': 'fas fa-person'
    };
    return map[this.category] || 'fas fa-dumbbell';
  }

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.category = params.get('category') || 'abs';
      this.selectedExercise = null;
    });
  }

  openExercise(ex: Exercise): void {
    this.selectedExercise = ex;
  }

  closeModal(): void {
    this.selectedExercise = null;
  }

  getDifficultyClass(difficulty: string): string {
    return {
      beginner: 'badge-beginner',
      intermediate: 'badge-intermediate',
      advanced: 'badge-advanced'
    }[difficulty] || '';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
