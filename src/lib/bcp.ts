import { BcpResult } from '@/types';

export function calculateBcp(
  birthDate: Date,
  targetDate: Date
): BcpResult {
  // Calculate completed age
  let completedAge = targetDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = targetDate.getMonth() - birthDate.getMonth();
  const dayDiff = targetDate.getDate() - birthDate.getDate();
  const hourDiff = targetDate.getHours() - birthDate.getHours();
  const minDiff = targetDate.getMinutes() - birthDate.getMinutes();
  const secDiff = targetDate.getSeconds() - birthDate.getSeconds();

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && (dayDiff < 0 || (dayDiff === 0 && (hourDiff < 0 || (hourDiff === 0 && (minDiff < 0 || (minDiff === 0 && secDiff < 0)))))))) {
    completedAge--;
  }

  // Running year of life = completed age + 1
  const runningYear = completedAge + 1;

  // Active BCP year house = ((runningYear - 1) % 12) + 1
  const activeYearHouse = ((runningYear - 1) % 12) + 1;

  // BCP cycle
  const bcpCycle = Math.floor((runningYear - 1) / 12) + 1;

  // Calculate running month from birthday (not calendar year)
  // Month 1 starts on birthday
  let monthInRunningYear: number;

  if (targetDate >= birthDate) {
    // Target is after birth date in same year or later years
    const birthThisYear = new Date(
      targetDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      birthDate.getHours(),
      birthDate.getMinutes(),
      birthDate.getSeconds()
    );

    if (targetDate >= birthThisYear) {
      // Birthday has passed this year
      monthInRunningYear = Math.floor(
        (targetDate.getTime() - birthThisYear.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      ) + 1;
    } else {
      // Birthday hasn't passed, use last year's birthday
      const birthLastYear = new Date(
        targetDate.getFullYear() - 1,
        birthDate.getMonth(),
        birthDate.getDate(),
        birthDate.getHours(),
        birthDate.getMinutes(),
        birthDate.getSeconds()
      );
      monthInRunningYear = Math.floor(
        (targetDate.getTime() - birthLastYear.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      ) + 1;
    }
  } else {
    // Target is before birth date (shouldn't happen normally but handle it)
    monthInRunningYear = 1;
  }

  // Clamp month to 1-12
  monthInRunningYear = Math.max(1, Math.min(12, monthInRunningYear));

  // Active BCP month house = ((activeYearHouse + monthInRunningYear - 2) % 12) + 1
  const activeMonthHouse = ((activeYearHouse + monthInRunningYear - 2) % 12) + 1;

  return {
    completedAge,
    runningYear,
    activeYearHouse,
    bcpCycle,
    monthInRunningYear,
    activeMonthHouse,
  };
}

export function parseDateTime(input: string): Date | null {
  // Format: dd.mm.yyyy hh.mm.ss
  const pattern = /^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/;
  const match = input.trim().match(pattern);

  if (!match) return null;

  const [, dd, mm, yyyy, hh, min, ss] = match;
  return new Date(
    parseInt(yyyy),
    parseInt(mm) - 1,
    parseInt(dd),
    parseInt(hh),
    parseInt(min),
    parseInt(ss)
  );
}
