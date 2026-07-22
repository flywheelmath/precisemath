import type { CorrectResponse, UserResponse, ScoreResult } from '@/types';

type ValidatorFn = (input: any, target: any) => ScoreResult;

export function areCollinear(p1: number[], p2: number[], p3: number[]) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;

  if ( x1 === undefined || 
      y1 === undefined ||
      x2 === undefined || 
      y2 === undefined ||
      x3 === undefined || 
      y3 === undefined) {
    return false;
  }

  const val = (y2 - y1) * (x3 - x2) - (y3 - y2) * (x2 - x1);
  return Math.abs(val) < 1e-5;
}

function deepEquals(a: any, b: any): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEquals(v, b[i]));
  }
  return a == b;
}

function satisfiesInequality(point: [number, number], target: any): boolean {
  const [x, y] = point;
  const { slope, basepoint, relation } = target;

  const m = slope[0]/slope[1];
  const b = basepoint[1] - (m * basepoint[0]);
  const lineY = (m * x) + b;

  switch (relation) {
    case '<': return y < lineY;
    case '<=': return y <= lineY + 1e-5;
    case '>': return y > lineY;
    case '>=': return y >= lineY - 1e-5;
    default: return false;
  }
}

const strategies: Record<string, ValidatorFn> = {
  math_equals: (input, target): ScoreResult => {
    const floatInput = parseFloat(input);
    const floatTarget = parseFloat(target);
    if (isNaN(floatInput) || isNaN(floatTarget)) return { isCorrect: false };
    return { isCorrect: Math.abs(floatInput - floatTarget) < 1e-5 };
  },

  x_coord_equals: (input, target): ScoreResult => {
    const inputArr = Array.isArray(input) ? input : String(input).split(',');
    const xVal = parseFloat(inputArr[0]);
    const targetVal = parseFloat(target);
    if (isNaN(xVal) || isNaN(targetVal)) return { isCorrect: false };
    return { isCorrect: Math.abs(xVal - targetVal) < 1e-5 };
  },

  y_coord_equals: (input, target): ScoreResult => {
    const inputArr = Array.isArray(input) ? input : String(input).split(',');
    const yVal = parseFloat(inputArr[1]);
    const targetVal = parseFloat(target);
    if (isNaN(yVal) || isNaN(targetVal)) return { isCorrect: false };
    return { isCorrect: Math.abs(yVal - targetVal) < 1e-5 };
  },

  text_exact: (input, target): ScoreResult => {
    const normInput = String(input).trim().toLowerCase();
    const normTarget = String(target).trim().toLowerCase();
    return { isCorrect: normInput === normTarget };
  },

  list_equals: (input, target): ScoreResult => {
    const parse = (x: any) => Array.isArray(x) ? x : String(x).split(',').map(s => s.trim());
    const inputArr = parse(input);
    const targetArr = parse(target);
    if (inputArr.length !== targetArr.length) return { isCorrect: false };
    const isCorrect = inputArr.every((val: any, i: number) => deepEquals(val, targetArr[i]));
    return {
      isCorrect,
      correctItems: isCorrect ? [] : [],
      incorrectItems: isCorrect ? [] : [],
    };
  },

  set_equals: (input: any, target: any): ScoreResult => {
    if (!Array.isArray(input) || input.length !== 2) return { isCorrect: false };

    const p1 = input[0];
    const p2 = input[1];
    const t1 = target[0];
    const t2 = target[1];

    const forward = (p1[0] === t1[0] && p1[1] === t1[1] && p2[0] === t2[0] && p2[1] === t2[1]);
    const reverse = (p1[0] === t2[0] && p1[1] === t2[1] && p2[0] === t1[0] && p2[1] === t1[1]);

    return { isCorrect: forward || reverse };
  },

  line_equals: (input: any, target: any): ScoreResult => {
    if (!Array.isArray(input) || input.length !== 2) return { isCorrect: false };

    const u1 = input[0];
    const u2 = input[1];
    const t1 = target[0];
    const t2 = target[1];

    if (u1[0] === u2[0] && u1[1] === u2[1]) return { isCorrect: false };

    const u1Valid = areCollinear(t1, t2, u1);
    const u2Valid = areCollinear(t1, t2, u2);

    return { isCorrect: u1Valid && u2Valid };
  },

  linear_inequality_match: (input: any, target: any): ScoreResult => {
    if (!input || !input.boundaryPoints || !input.shadingPoint) {
      return { isCorrect: false };
    }

    const lineInput = input.boundaryPoints;
//    const lineTarget = [target.bsaepoint, [target.basepoint[0] + target.slope[1], target.basepoint[1] + target.slope[0]]];

    const [p1, p2] = lineInput;
    const mTarget = target.slope[0] / target.slope[1];
    const mUser = (p2[1] - p1[1]) / (p2[0] - p1[0]);

    if (Math.abs(mUser - mTarget) > 1e-5) return { isCorrect: false };

    const yOnTarget = target.basepoint[1] + mTarget * (p1[0] - target.basepoint[0]);
    if (Math.abs(p1[1] - yOnTarget) > 1e-5) return { isCorrect: false };

    const isStrict = target.relation === '<' || target.relation === '>';
    if (input.isDashed !== isStrict) return { isCorrect: false };

    if (!satisfiesInequality(input.shadingPoint, target)) return { isCorrect: false };

    return { isCorrect: true };
  },

  system_inequalities_validator: (input: any, target: any): ScoreResult => {
    if (!input || !Array.isArray(input.lines) || input.lines.length !== 2) {
      return { isCorrect: false };
    }

    for (let i = 0; i < 2; i++) {
      const userLine = input.lines[i];
      const targetDef = target.inequalities[i];

      if (!userLine.points || userLine.points.length !== 2) return { isCorrect: false };

      const t1 = targetDef.basepoint;
      const t2 = [t1[0] + targetDef.slope[1], t1[1] + targetDef.slope[0]];

      if (!areCollinear(t1, t2, userLine.points[0]) || !areCollinear(t1, t2, userLine.points[1])) {
        return { isCorrect: false };
      }

      const isStrict = targetDef.relation === '<' || targetDef.relation === '>';
      if (userLine.isDashed !== isStrict) return { isCorrect: false };
    }

    if (!Array.isArray(input.shadingPoints) || input.shadingPoints.length === 0) {
      return { isCorrect: false };
    }

    const allPointsCorrect = input.shadingPoints.every((p: [number, number]) => {
      return target.inequalities.every((ineq: any) => satisfiesInequality(p, ineq));
    });

    return { isCorrect: allPointsCorrect };
  },

  quadratic_vertex_point_validator: (input: any, target: any): ScoreResult => {
    let v, cp;
    if (Array.isArray(input) && input.length === 2) {
        v = { x: input[0][0], y: input[0][1] };
        cp = { x: input[1][0], y: input[1][1] };
    } else if (input && Array.isArray(input.points)) {
        v = input.points.find((p: any) => p.id === 'vertex');
        cp = input.points.find((p: any) => p.id === 'curve');
    }

    if (!v || !cp) return { isCorrect: false };

    const hMatch = Math.abs(v.x - target.h) < 1e-5;
    const kMatch = Math.abs(v.y - target.k) < 1e-5;
    if (!hMatch || !kMatch) return { isCorrect: false };

    const dx = cp.x - v.x;
    const dy = cp.y - v.y;
    if (dx === 0) return { isCorrect: false };

    const userA = dy / (dx * dx);
    const aMatch = Math.abs(userA - target.a) < 1e-5;

    return { isCorrect: aMatch };
  },
};

export const checkResponse = (correct: CorrectResponse, userInput: UserResponse): ScoreResult => {
  const strategy = strategies[correct.validator];
  if (!strategy) {
    console.warn(`Unknown validator: '${correct.validator}'`)
    return { isCorrect: false };
  }
  return strategy(userInput, correct.value);
};
