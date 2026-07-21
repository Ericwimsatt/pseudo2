export function evaluateGrade(score: number): string {
  // If/else
  if (score >= 90) return 'A';
  else if (score >= 80) return 'B';
  else return 'C';

  // Ternary
  const pass = score >= 60 ? 'pass' : 'fail';

  // Switch/case
  switch (score) {
    case 100:
      return 'Perfect';
    case 0:
      return 'No score';
    default:
      return pass;
  }
}

export function loops() {
  const items = ['a', 'b', 'c'];

  // For loop
  for (let i = 0; i < items.length; i++) {
    console.log(items[i]);
  }

  // For-of
  for (const item of items) {
    console.log(item);
  }

  // For-in
  for (const index in items) {
    console.log(index);
  }

  // While
  let n = 0;
  while (n < 3) {
    n++;
  }

  // Do-while
  let m = 0;
  do {
    m++;
  } while (m < 3);
}

export function risky() {
  try {
    throw new Error('Oops');
  } catch (err) {
    console.error(err);
  }
}
