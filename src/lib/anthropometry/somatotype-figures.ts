export type SomatotypeProfile = 'endo' | 'meso' | 'ecto';

export type SomatotypeFigure = {
  head: { cx: number; cy: number; rx: number; ry: number };
  neck: string;
  torso: string;
  pelvis: string;
  leftArm: string;
  rightArm: string;
  leftLeg: string;
  rightLeg: string;
  garment: string;
};

const male: Record<SomatotypeProfile, SomatotypeFigure> = {
  ecto: {
    head: { cx: 30, cy: 10, rx: 6.8, ry: 8.2 },
    neck: 'M26 17 L34 17 L35 25 L25 25 Z',
    torso: 'M25 23 C20 25 18 31 18 41 L20 69 C22 75 24 79 25 84 L35 84 C36 79 38 75 40 69 L42 41 C42 31 40 25 35 23 C33 26 27 26 25 23 Z',
    pelvis: 'M24 80 C27 83 33 83 36 80 L39 91 C36 96 24 96 21 91 Z',
    leftArm: 'M19 29 C15 32 13 40 12 51 L9 77 C9 82 11 86 14 84 L17 55 L22 36 Z',
    rightArm: 'M41 29 C45 32 47 40 48 51 L51 77 C51 82 49 86 46 84 L43 55 L38 36 Z',
    leftLeg: 'M22 91 C21 104 20 116 20 128 L17 138 C18 141 25 141 26 137 L28 111 L30 94 Z',
    rightLeg: 'M38 91 C39 104 40 116 40 128 L43 138 C42 141 35 141 34 137 L32 111 L30 94 Z',
    garment: 'M21 69 L39 69 L38 91 C34 94 26 94 22 91 Z',
  },
  meso: {
    head: { cx: 30, cy: 10, rx: 7.4, ry: 8.5 },
    neck: 'M24 17 L36 17 L38 26 L22 26 Z',
    torso: 'M22 23 C13 26 10 35 12 46 L18 70 C20 77 23 82 24 86 L36 86 C37 82 40 77 42 70 L48 46 C50 35 47 26 38 23 C35 27 25 27 22 23 Z',
    pelvis: 'M23 82 C27 85 33 85 37 82 L42 94 C37 99 23 99 18 94 Z',
    leftArm: 'M14 30 C8 34 6 43 7 54 L5 78 C5 84 9 88 13 84 L16 58 L22 36 Z',
    rightArm: 'M46 30 C52 34 54 43 53 54 L55 78 C55 84 51 88 47 84 L44 58 L38 36 Z',
    leftLeg: 'M19 94 C18 105 18 117 19 129 L16 138 C18 142 27 142 28 137 L29 111 L30 97 Z',
    rightLeg: 'M41 94 C42 105 42 117 41 129 L44 138 C42 142 33 142 32 137 L31 111 L30 97 Z',
    garment: 'M18 70 L42 70 L41 94 C36 98 24 98 19 94 Z',
  },
  endo: {
    head: { cx: 30, cy: 10, rx: 8.2, ry: 8.8 },
    neck: 'M23 17 L37 17 L39 27 L21 27 Z',
    torso: 'M21 24 C13 27 10 36 11 47 C11 63 14 78 19 88 C23 94 37 94 41 88 C46 78 49 63 49 47 C50 36 47 27 39 24 C35 28 25 28 21 24 Z',
    pelvis: 'M18 84 C23 90 37 90 42 84 L46 98 C40 104 20 104 14 98 Z',
    leftArm: 'M14 31 C8 36 6 46 7 58 L5 81 C5 87 10 90 14 85 L17 61 L22 38 Z',
    rightArm: 'M46 31 C52 36 54 46 53 58 L55 81 C55 87 50 90 46 85 L43 61 L38 38 Z',
    leftLeg: 'M15 98 C14 110 15 121 18 130 L15 138 C18 142 28 142 29 137 L29 112 L30 101 Z',
    rightLeg: 'M45 98 C46 110 45 121 42 130 L45 138 C42 142 32 142 31 137 L31 112 L30 101 Z',
    garment: 'M15 82 L45 82 L45 98 C39 102 21 102 15 98 Z',
  },
};

const female: Record<SomatotypeProfile, SomatotypeFigure> = {
  ecto: {
    ...male.ecto,
    torso: 'M25 23 C20 25 18 31 19 41 L22 61 C21 71 18 78 20 86 C25 91 35 91 40 86 C42 78 39 71 38 61 L41 41 C42 31 40 25 35 23 C33 26 27 26 25 23 Z',
    pelvis: 'M20 82 C25 87 35 87 40 82 L43 93 C38 99 22 99 17 93 Z',
    garment: 'M19 82 L41 82 L42 93 C36 97 24 97 18 93 Z',
  },
  meso: {
    ...male.meso,
    torso: 'M22 23 C14 26 12 34 14 45 L20 61 C19 70 16 79 19 88 C24 94 36 94 41 88 C44 79 41 70 40 61 L46 45 C48 34 46 26 38 23 C35 27 25 27 22 23 Z',
    pelvis: 'M19 84 C25 90 35 90 41 84 L45 96 C39 102 21 102 15 96 Z',
    garment: 'M17 82 L43 82 L44 96 C38 100 22 100 16 96 Z',
  },
  endo: {
    ...male.endo,
    torso: 'M21 24 C13 27 11 36 13 47 C14 61 18 70 17 80 C16 89 21 95 30 96 C39 95 44 89 43 80 C42 70 46 61 47 47 C49 36 47 27 39 24 C35 28 25 28 21 24 Z',
    pelvis: 'M17 86 C23 93 37 93 43 86 L48 100 C41 107 19 107 12 100 Z',
    garment: 'M14 84 L46 84 L47 100 C40 105 20 105 13 100 Z',
  },
};

export function somatotypeFigure(profile: SomatotypeProfile, sex?: string): SomatotypeFigure {
  return sex === 'F' ? female[profile] : male[profile];
}
