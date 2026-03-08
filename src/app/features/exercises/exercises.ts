import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

export interface Exercise {
  id: string;
  name: string;
  name_ar: string;
  category: 'abs' | 'legs' | 'full-body' | 'back';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  muscles: string[];
  muscles_ar: string[];
  sets: number;
  reps: string;
  restTime: number;
  gifUrl?: string;
  instructions: string[];
  instructions_ar: string[];
  tips: string[];
  tips_ar: string[];
  equipment: string;
  equipment_ar: string;
  calories: number;
}

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, RouterLink],
  templateUrl: './exercises.html',
  styleUrl: './exercises.css',
})
export class Exercises implements OnInit, OnDestroy {

  allExercises: Exercise[] = [
    // ── ABS ──
    {
      id: 'abs-1', name: 'Crunches', name_ar: 'كرانشز', category: 'abs', difficulty: 'Beginner',
      muscles: ['Upper Abs'], muscles_ar: ['عضلات البطن العلوية'],
      sets: 3, reps: '15–20', restTime: 45, calories: 8,
      gifUrl: '',
      instructions: ['Lie on your back with knees bent, feet flat.', 'Place hands lightly behind your head.', 'Engage core and lift shoulder blades off floor.', 'Squeeze at the top, hold 1 second.', 'Lower slowly — don\'t drop.'],
      instructions_ar: ['استلقِ على ظهرك مع ثني الركبتين، قدماك مسطحتان.', 'ضع يديك خلف رأسك بخفة.', 'اضغط الكور وارفع الكتفين عن الأرض.', 'اضغط في القمة ثانية واحدة.', 'انزل ببطء ولا تسقط.'],
      tips: ['Don\'t pull your neck — just support it.', 'Exhale on the way up.', 'Keep lower back pressed to the floor.'],
      tips_ar: ['لا تسحب رقبتك — فقط ادعمها.', 'ازفر عند الصعود.', 'أبق أسفل الظهر مضغوطاً على الأرض.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'abs-2', name: 'Plank', name_ar: 'البلانك', category: 'abs', difficulty: 'Beginner',
      muscles: ['Core', 'Lower Abs', 'Shoulders'], muscles_ar: ['الكور', 'البطن السفلية', 'الأكتاف'],
      sets: 3, reps: '30–60s', restTime: 60, calories: 5,
      gifUrl: '',
      instructions: ['Get into forearm or push-up position.', 'Keep body in a perfectly straight line.', 'Engage abs, glutes, and quads simultaneously.', 'Breathe steadily throughout.', 'Hold without letting hips sag.'],
      instructions_ar: ['احصل على وضع الساعد أو وضع الضغط.', 'أبق جسمك في خط مستقيم تماماً.', 'اضغط البطن والأرداف والفخذين في نفس الوقت.', 'تنفس بانتظام طوال الوقت.', 'احتفظ دون أن تنخفض الوركان.'],
      tips: ['Think about pulling belly button to spine.', 'Look at the floor — neutral neck.', 'Progress: add 10s each week.'],
      tips_ar: ['فكر في سحب السرة نحو العمود الفقري.', 'انظر للأرض — رقبة محايدة.', 'التقدم: أضف 10 ثوانٍ كل أسبوع.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'abs-3', name: 'Bicycle Crunches', name_ar: 'كرانشز الدراجة', category: 'abs', difficulty: 'Intermediate',
      muscles: ['Obliques', 'Upper Abs', 'Hip Flexors'], muscles_ar: ['العضلات المائلة', 'البطن العلوية', 'عضلات الورك'],
      sets: 3, reps: '20 each side', restTime: 45, calories: 12,
      gifUrl: '',
      instructions: ['Lie on back, hands behind head.', 'Lift both knees to 90 degrees.', 'Bring right elbow toward left knee.', 'Simultaneously extend right leg straight.', 'Alternate in a smooth pedaling motion.'],
      instructions_ar: ['استلقِ على ظهرك، يدان خلف الرأس.', 'ارفع الركبتين إلى 90 درجة.', 'أحضر الكوع الأيمن نحو الركبة اليسرى.', 'في نفس الوقت مد الساق اليمنى.', 'بدّل بحركة دواسة سلسة.'],
      tips: ['Don\'t rush — control the twist.', 'Full rotation of torso, not just elbows.', 'Keep chin off chest.'],
      tips_ar: ['لا تتسرع — تحكم في الدوران.', 'دوران كامل للجذع، ليس فقط الكوعين.', 'أبق الذقن بعيداً عن الصدر.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'abs-4', name: 'Leg Raises', name_ar: 'رفع الأرجل', category: 'abs', difficulty: 'Intermediate',
      muscles: ['Lower Abs', 'Hip Flexors'], muscles_ar: ['البطن السفلية', 'عضلات الورك'],
      sets: 3, reps: '12–15', restTime: 60, calories: 10,
      gifUrl: '',
      instructions: ['Lie flat, arms by your sides.', 'Keep legs together and straight.', 'Raise legs slowly to 90 degrees.', 'Pause briefly at the top.', 'Lower slowly — stop just before floor.'],
      instructions_ar: ['استلقِ مسطحاً، الذراعان على الجانبين.', 'أبق الساقين مجتمعتين ومستقيمتين.', 'ارفع الساقين ببطء إلى 90 درجة.', 'توقف للحظة في القمة.', 'انزل ببطء — توقف قبل الأرض مباشرة.'],
      tips: ['Press lower back firmly to floor.', 'Slow descend is where the work happens.', 'Easier: bent knees.'],
      tips_ar: ['اضغط أسفل الظهر بقوة على الأرض.', 'الإنزال البطيء هو أين يحدث العمل الحقيقي.', 'أسهل: ثني الركبتين.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'abs-5', name: 'Russian Twists', name_ar: 'الالتواء الروسي', category: 'abs', difficulty: 'Intermediate',
      muscles: ['Obliques', 'Core'], muscles_ar: ['العضلات المائلة', 'الكور'],
      sets: 3, reps: '20 total', restTime: 45, calories: 11,
      gifUrl: '',
      instructions: ['Sit with knees bent, lean back 45°.', 'Hold hands together or grab a weight.', 'Lift feet slightly off floor.', 'Rotate torso fully left then right.', 'Keep core engaged throughout.'],
      instructions_ar: ['اجلس مع ثني الركبتين، أمل للخلف 45°.', 'اجمع يديك أو امسك وزناً.', 'ارفع القدمين قليلاً عن الأرض.', 'أدر الجذع بالكامل يساراً ثم يميناً.', 'أبق الكور مشدوداً طوال الوقت.'],
      tips: ['Move slowly to feel the obliques.', 'Add weight for progression.', 'Breathe out with each rotation.'],
      tips_ar: ['تحرك ببطء لتشعر بالعضلات المائلة.', 'أضف وزناً للتقدم.', 'ازفر مع كل دوران.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    // ── LEGS ──
    {
      id: 'legs-1', name: 'Bodyweight Squats', name_ar: 'القرفصاء', category: 'legs', difficulty: 'Beginner',
      muscles: ['Quads', 'Glutes', 'Hamstrings', 'Calves'], muscles_ar: ['الرباعية', 'الأرداف', 'أوتار الركبة', 'الساق'],
      sets: 3, reps: '15–20', restTime: 60, calories: 15,
      gifUrl: '',
      instructions: ['Stand with feet shoulder-width apart.', 'Toes slightly pointed out (15–30°).', 'Push hips back and down.', 'Keep chest tall and knees out.', 'Drive through heels to return.'],
      instructions_ar: ['قف بعرض الكتفين.', 'أصابع القدم مائلة للخارج قليلاً (15–30°).', 'ادفع الوركين للخلف والأسفل.', 'أبق الصدر مرتفعاً والركبتين للخارج.', 'ادفع بالكعبين للعودة.'],
      tips: ['Depth: aim for parallel or below.', 'Don\'t let knees cave inward.', 'Inhale down, exhale up.'],
      tips_ar: ['العمق: اهدف إلى الموازي أو أعمق.', 'لا تدع الركبتين تنهاران للداخل.', 'استنشق عند النزول، ازفر عند الصعود.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'legs-2', name: 'Reverse Lunges', name_ar: 'الانقضاض العكسي', category: 'legs', difficulty: 'Beginner',
      muscles: ['Quads', 'Glutes', 'Balance'], muscles_ar: ['الرباعية', 'الأرداف', 'التوازن'],
      sets: 3, reps: '12 each leg', restTime: 60, calories: 13,
      gifUrl: '',
      instructions: ['Stand tall, feet together.', 'Step one foot backward.', 'Lower back knee toward the floor.', 'Keep front shin vertical.', 'Push through front foot to return.'],
      instructions_ar: ['قف مستقيماً، القدمان معاً.', 'خطو قدماً للخلف.', 'اخفض الركبة الخلفية نحو الأرض.', 'أبق الظنبوب الأمامي عمودياً.', 'ادفع من القدم الأمامية للعودة.'],
      tips: ['Reverse lunge is kinder on knees than forward.', 'Keep torso upright — don\'t lean.', 'Land softly — control the descent.'],
      tips_ar: ['الانقضاض العكسي أكثر لطفاً على الركبتين.', 'أبق الجذع مستقيماً — لا تنحني.', 'اهبط بخفة — تحكم في النزول.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'legs-3', name: 'Glute Bridges', name_ar: 'جسر الأرداف', category: 'legs', difficulty: 'Beginner',
      muscles: ['Glutes', 'Hamstrings', 'Core'], muscles_ar: ['الأرداف', 'أوتار الركبة', 'الكور'],
      sets: 3, reps: '15–20', restTime: 45, calories: 9,
      gifUrl: '',
      instructions: ['Lie on back, knees bent at 90°.', 'Feet flat, hip-width apart.', 'Drive hips up by squeezing glutes.', 'Full hip extension at the top.', 'Lower with control — don\'t drop.'],
      instructions_ar: ['استلقِ على ظهرك، ثني الركبتين 90°.', 'قدمان مسطحتان بعرض الوركين.', 'ادفع الوركين لأعلى بضغط الأرداف.', 'امتداد كامل للورك في القمة.', 'انزل بتحكم — لا تسقط.'],
      tips: ['Hold 2 seconds at the top.', 'Drive through the heels, not toes.', 'Single-leg variation for more challenge.'],
      tips_ar: ['احتفظ ثانيتين في القمة.', 'ادفع بالكعبين وليس الأصابع.', 'جرب على ساق واحدة للمزيد من التحدي.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'legs-4', name: 'Wall Sit', name_ar: 'الجلوس على الحائط', category: 'legs', difficulty: 'Beginner',
      muscles: ['Quads', 'Glutes', 'Calves'], muscles_ar: ['الرباعية', 'الأرداف', 'الساق'],
      sets: 3, reps: '30–60s', restTime: 60, calories: 8,
      gifUrl: '',
      instructions: ['Back flat against a wall.', 'Slide down until thighs are parallel.', 'Knees at 90°, directly over ankles.', 'Arms crossed or on thighs.', 'Hold without sliding.'],
      instructions_ar: ['ظهر مسطح على الحائط.', 'انزلق حتى تكون الفخذان موازيتان.', 'الركبتان 90°، مباشرة فوق الكاحلين.', 'الذراعان متقاطعتان أو على الفخذين.', 'احتفظ دون الانزلاق.'],
      tips: ['No rounding the lower back.', 'Add weight on thighs for harder version.', 'Build time gradually each session.'],
      tips_ar: ['لا تحنِ أسفل الظهر.', 'أضف وزناً على الفخذين للإصعاب.', 'ابنِ الوقت تدريجياً كل جلسة.'],
      equipment: 'Wall', equipment_ar: 'حائط'
    },

    {
      id: 'legs-5', name: 'Jump Squats', name_ar: 'قرفصاء القفز', category: 'legs', difficulty: 'Advanced',
      muscles: ['Quads', 'Calves', 'Glutes', 'Cardio'], muscles_ar: ['الرباعية', 'الساق', 'الأرداف', 'كارديو'],
      sets: 4, reps: '10–12', restTime: 90, calories: 20,
      gifUrl: '',
      instructions: ['Start in squat position.', 'Load through heels.', 'Explode upward with full power.', 'Land softly on mid-foot.', 'Absorb impact, flow into next rep.'],
      instructions_ar: ['ابدأ في وضع القرفصاء.', 'تحميل عبر الكعبين.', 'انفجر للأعلى بقوة كاملة.', 'اهبط بخفة على منتصف القدم.', 'استوعب الصدمة وانتقل للتكرار التالي.'],
      tips: ['Land quiet — loud landing = bad form.', 'Arms drive the jump.', 'Reduce reps before reducing form.'],
      tips_ar: ['اهبط بهدوء — هبوط مرتفع = شكل سيئ.', 'الذراعان يقودان القفزة.', 'قلل التكرارات قبل تقليل الشكل.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    // ── FULL-BODY ──
    {
      id: 'fb-1', name: 'Burpees', name_ar: 'البيربيز', category: 'full-body', difficulty: 'Advanced',
      muscles: ['Full Body', 'Cardio', 'Core'], muscles_ar: ['الجسم الكامل', 'كارديو', 'الكور'],
      sets: 3, reps: '10', restTime: 90, calories: 25,
      gifUrl: '',
      instructions: ['Start standing.', 'Bend and jump feet back to plank.', 'Perform a full push-up (optional).', 'Jump feet forward to hands.', 'Jump up, arms overhead.'],
      instructions_ar: ['ابدأ واقفاً.', 'انحنِ واقفز بالقدمين للخلف في وضع البلانك.', 'أدِ ضغطة كاملة (اختياري).', 'اقفز بالقدمين للأمام نحو اليدين.', 'اقفز للأعلى مع رفع الذراعين.'],
      tips: ['Modify: step instead of jump.', 'Full push-up = harder version.', 'Pace yourself — form first, speed second.'],
      tips_ar: ['تعديل: خطو بدلاً من القفز.', 'ضغطة كاملة = نسخة أصعب.', 'تحكم في إيقاعك — الشكل أولاً، السرعة ثانياً.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'fb-2', name: 'Mountain Climbers', name_ar: 'تسلق الجبل', category: 'full-body', difficulty: 'Intermediate',
      muscles: ['Core', 'Shoulders', 'Quads', 'Cardio'], muscles_ar: ['الكور', 'الأكتاف', 'الرباعية', 'كارديو'],
      sets: 3, reps: '30s', restTime: 45, calories: 18,
      gifUrl: '',
      instructions: ['Start in high push-up position.', 'Shoulders over wrists.', 'Drive right knee to chest.', 'Quickly switch — drive left knee.', 'Maintain fast, controlled pace.'],
      instructions_ar: ['ابدأ في وضع الضغط العالي.', 'الأكتاف فوق المعصمين.', 'اجلب الركبة اليمنى نحو الصدر.', 'بدّل بسرعة — اجلب الركبة اليسرى.', 'حافظ على إيقاع سريع ومتحكم.'],
      tips: ['Hips stay level — don\'t bounce them.', 'The faster you go, the more cardio benefit.', 'Core tight the entire time.'],
      tips_ar: ['الوركان مستويان — لا ترتديهما.', 'كلما أسرعت، كلما زادت فائدة الكارديو.', 'الكور مشدود طوال الوقت.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'fb-3', name: 'Push-ups', name_ar: 'تمرين الضغط', category: 'full-body', difficulty: 'Beginner',
      muscles: ['Chest', 'Triceps', 'Shoulders', 'Core'], muscles_ar: ['الصدر', 'ثلاثية الرؤوس', 'الأكتاف', 'الكور'],
      sets: 3, reps: '10–15', restTime: 60, calories: 12,
      gifUrl: '',
      instructions: ['Hands slightly wider than shoulders.', 'Body forms a straight line.', 'Lower chest to an inch from floor.', 'Elbows at 45° angle — not flared.', 'Push back to start, arms fully extended.'],
      instructions_ar: ['اليدان أعرض قليلاً من الكتفين.', 'الجسم يشكل خطاً مستقيماً.', 'اخفض الصدر على بعد سنتيمتر من الأرض.', 'الكوعان بزاوية 45° — ليس للخارج.', 'ادفع للبداية، الذراعان ممتدتان بالكامل.'],
      tips: ['Narrow grip = more triceps.', 'Wide grip = more chest.', 'Knees down for an easier modification.'],
      tips_ar: ['قبضة ضيقة = المزيد لثلاثية الرؤوس.', 'قبضة عريضة = المزيد للصدر.', 'الركبتان أسفل لتعديل أسهل.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'fb-4', name: 'Jumping Jacks', name_ar: 'القفز بالتصفيق', category: 'full-body', difficulty: 'Beginner',
      muscles: ['Full Body', 'Cardio', 'Shoulders'], muscles_ar: ['الجسم الكامل', 'كارديو', 'الأكتاف'],
      sets: 3, reps: '30–60s', restTime: 30, calories: 14,
      gifUrl: '',
      instructions: ['Stand upright, feet together.', 'Jump feet wide while raising arms overhead.', 'Arms should reach full extension.', 'Jump feet back together, lower arms.', 'Maintain steady rhythm.'],
      instructions_ar: ['قف مستقيماً، قدمان معاً.', 'اقفز بالقدمين عريضاً مع رفع الذراعين.', 'يجب أن تصل الذراعان للامتداد الكامل.', 'اقفز بالقدمين للعودة، اخفض الذراعين.', 'حافظ على إيقاع ثابت.'],
      tips: ['Great warm-up exercise.', 'Land softly on balls of feet.', 'Speed up for cardio benefit.'],
      tips_ar: ['تمرين إحماء ممتاز.', 'اهبط بخفة على رؤوس الأصابع.', 'أسرع للاستفادة من الكارديو.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    // ── BACK ──
    {
      id: 'back-1', name: 'Superman Hold', name_ar: 'وضعية سوبرمان', category: 'back', difficulty: 'Beginner',
      muscles: ['Lower Back', 'Glutes', 'Rear Deltoids'], muscles_ar: ['أسفل الظهر', 'الأرداف', 'الدالية الخلفية'],
      sets: 3, reps: '12–15', restTime: 45, calories: 7,
      gifUrl: '',
      instructions: ['Lie face down, arms extended overhead.', 'Squeeze glutes and lower back.', 'Lift arms, chest, and legs simultaneously.', 'Hold the peak position 2 seconds.', 'Lower slowly — don\'t crash down.'],
      instructions_ar: ['استلقِ وجهاً للأسفل، الذراعان ممتدتان.', 'اضغط الأرداف وأسفل الظهر.', 'ارفع الذراعين والصدر والأرجل في نفس الوقت.', 'احتفظ في الذروة 2 ثانية.', 'انزل ببطء — لا تسقط.'],
      tips: ['Don\'t strain your neck — look down.', 'Squeeze glutes hard at top.', 'Works the posterior chain — critical for posture.'],
      tips_ar: ['لا تجهد رقبتك — انظر للأسفل.', 'اضغط الأرداف بقوة في القمة.', 'يشغّل السلسلة الخلفية — مهم للوضعية.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'back-2', name: 'Bird Dog', name_ar: 'البيرد دوج', category: 'back', difficulty: 'Beginner',
      muscles: ['Core', 'Lower Back', 'Glutes', 'Balance'], muscles_ar: ['الكور', 'أسفل الظهر', 'الأرداف', 'التوازن'],
      sets: 3, reps: '10 each side', restTime: 45, calories: 6,
      gifUrl: '',
      instructions: ['Start on hands and knees (tabletop).', 'Wrists under shoulders, knees under hips.', 'Extend opposite arm and leg.', 'Keep back perfectly flat.', 'Hold 3s, return with control.'],
      instructions_ar: ['ابدأ على اليدين والركبتين (وضعية الطاولة).', 'المعصمان تحت الأكتاف، الركبتان تحت الوركين.', 'مد الذراع والساق المقابلتين.', 'أبق الظهر مسطحاً تماماً.', 'احتفظ 3 ثوانٍ، عُد بتحكم.'],
      tips: ['No hip rotation — keep pelvis square.', 'Slow is better here.', 'Touch elbow to knee between reps for variation.'],
      tips_ar: ['لا دوران للورك — أبق الحوض مستوياً.', 'البطء أفضل هنا.', 'الكوع يلمس الركبة بين التكرارات للتنويع.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'back-3', name: 'Inverted Rows', name_ar: 'الشد العكسي', category: 'back', difficulty: 'Intermediate',
      muscles: ['Upper Back', 'Lats', 'Biceps', 'Rear Delts'], muscles_ar: ['أعلى الظهر', 'العريضة', 'العضلة ذات الرأسين', 'الدالية الخلفية'],
      sets: 3, reps: '8–12', restTime: 75, calories: 14,
      gifUrl: '',
      instructions: ['Set bar at waist height.', 'Grip bar, walk under it.', 'Body straight from head to heels.', 'Pull chest to bar, squeeze blades.', 'Lower with full control.'],
      instructions_ar: ['ضع العارضة على ارتفاع الخصر.', 'امسك العارضة وامشِ تحتها.', 'الجسم مستقيم من الرأس للكعبين.', 'اسحب الصدر للعارضة، اضغط لوحي الكتف.', 'انزل بتحكم كامل.'],
      tips: ['Harder: lower bar or elevate feet.', 'Easier: more upright body angle.', 'Retract scapulae before pulling.'],
      tips_ar: ['أصعب: اخفض العارضة أو ارفع القدمين.', 'أسهل: زاوية جسم أكثر انتصاباً.', 'اسحب لوحي الكتف قبل الشد.'],
      equipment: 'Bar / Table', equipment_ar: 'عارضة / طاولة'
    },

    {
      id: 'back-4', name: 'Reverse Snow Angels', name_ar: 'ملائكة الثلج العكسية', category: 'back', difficulty: 'Beginner',
      muscles: ['Upper Back', 'Rear Deltoids', 'Trapezius'], muscles_ar: ['أعلى الظهر', 'الدالية الخلفية', 'شبه المنحرف'],
      sets: 3, reps: '12', restTime: 45, calories: 7,
      gifUrl: '',
      instructions: ['Lie face down, arms at your sides.', 'Lift arms and chest slightly off floor.', 'Move arms in a wide arc overhead.', 'Bring palms together above head.', 'Reverse the motion back to start.'],
      instructions_ar: ['استلقِ وجهاً للأسفل، الذراعان على جانبيك.', 'ارفع الذراعين والصدر قليلاً عن الأرض.', 'حرّك الذراعين في قوس عريض فوق الرأس.', 'اجمع الكفين فوق الرأس.', 'عُد عكسياً للبداية.'],
      tips: ['Keep arms off floor throughout.', 'Squeeze shoulder blades together.', 'Slow reps are more effective.'],
      tips_ar: ['أبق الذراعين عن الأرض طوال الوقت.', 'اضغط لوحي الكتف معاً.', 'التكرارات البطيئة أكثر فاعلية.'],
      equipment: 'No Equipment', equipment_ar: 'بدون معدات'
    },

    {
      id: 'back-5', name: 'Pull-ups', name_ar: 'السحب للأعلى', category: 'back', difficulty: 'Advanced',
      muscles: ['Lats', 'Biceps', 'Upper Back', 'Core'], muscles_ar: ['العريضة', 'العضلة ذات الرأسين', 'أعلى الظهر', 'الكور'],
      sets: 3, reps: '5–8', restTime: 90, calories: 16,
      gifUrl: '',
      instructions: ['Grip bar wider than shoulder-width.', 'Full dead hang to start.', 'Engage lats and pull elbows down.', 'Chin clears the bar.', 'Lower fully — don\'t kip.'],
      instructions_ar: ['أمسك العارضة أعرض من الكتفين.', 'ابدأ بتعليق ميت كامل.', 'نشّط العريضة واسحب الكوعين للأسفل.', 'الذقن يتجاوز العارضة.', 'انزل بالكامل — لا ترتجف.'],
      tips: ['Scapular pulls first — learn scapula control.', 'Add band assistance to practice pattern.', 'The negative (lowering) builds huge strength.'],
      tips_ar: ['اسحب لوحي الكتف أولاً — تعلم التحكم.', 'أضف مطاطاً للمساعدة لتعلم النمط.', 'الجزء السلبي (الإنزال) يبني قوة هائلة.'],
      equipment: 'Pull-up Bar', equipment_ar: 'عارضة سحب'
    },
  ];

  filteredExercises: Exercise[] = [];
  selectedCategory: string = 'all';
  selectedDifficulty: string = 'all';
  searchQuery: string = '';
  selectedExercise: Exercise | null = null;
  isModalOpen: boolean = false;
  currentYear = new Date().getFullYear();

  categories = [
    { key: 'all', icon: 'fas fa-border-all', color: '#F5A623' },
    { key: 'abs', icon: 'fas fa-circle-dot', color: '#ef4444' },
    { key: 'legs', icon: 'fas fa-person-running', color: '#22c55e' },
    { key: 'full-body', icon: 'fas fa-fire', color: '#3b82f6' },
    { key: 'back', icon: 'fas fa-arrows-up-down', color: '#a855f7' },
  ];

  difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  private sub = new Subscription();

  constructor(private translate: TranslateService) { }

  ngOnInit() { this.applyFilters(); }

  ngOnDestroy() {
    this.sub.unsubscribe();
    document.body.style.overflow = '';
  }

  get currentLang(): string { return this.translate.currentLang || 'en'; }
  get totalCount(): number { return this.filteredExercises.length; }

  setCategory(cat: string) { this.selectedCategory = cat; this.applyFilters(); }
  setDifficulty(d: string) { this.selectedDifficulty = d; this.applyFilters(); }

  applyFilters() {
    let r = [...this.allExercises];
    if (this.selectedCategory !== 'all') r = r.filter(e => e.category === this.selectedCategory);
    if (this.selectedDifficulty !== 'all') r = r.filter(e => e.difficulty === this.selectedDifficulty);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      r = r.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.name_ar.includes(q) ||
        e.muscles.some(m => m.toLowerCase().includes(q)) ||
        e.muscles_ar.some(m => m.includes(q))
      );
    }
    this.filteredExercises = r;
  }

  openModal(ex: Exercise) {
    this.selectedExercise = ex;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedExercise = null;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.isModalOpen) this.closeModal(); }

  getName(e: Exercise): string { return this.currentLang === 'ar' ? e.name_ar : e.name; }
  getMuscles(e: Exercise): string[] { return this.currentLang === 'ar' ? e.muscles_ar : e.muscles; }
  getInstructions(e: Exercise): string[] { return this.currentLang === 'ar' ? e.instructions_ar : e.instructions; }
  getTips(e: Exercise): string[] { return this.currentLang === 'ar' ? e.tips_ar : e.tips; }
  getEquipment(e: Exercise): string { return this.currentLang === 'ar' ? e.equipment_ar : e.equipment; }

  getCategoryColor(cat: string): string { return this.categories.find(c => c.key === cat)?.color ?? '#F5A623'; }
  getCategoryIcon(cat: string): string { return this.categories.find(c => c.key === cat)?.icon ?? 'fas fa-dumbbell'; }
  getCategoryCount(cat: string): number { return this.allExercises.filter(e => e.category === cat).length; }

  getDifficultyColor(d: string): string {
    return ({ Beginner: '#22c55e', Intermediate: '#f59e0b', Advanced: '#ef4444' } as any)[d] ?? '#F5A623';
  }
}
