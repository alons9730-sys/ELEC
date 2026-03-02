/**
 * 스케줄 텍스트 파서 v2 — 다중행 문맥 인식
 *
 * ===== 기존 지원 형식 =====
 * - "16:00 - 16:30 인솔 인원 : 장현준 - 정별하 - 임가은"
 * - "도윤 : 자료 준비하기"
 *
 * ===== v2 추가 지원 형식 =====
 * - 그룹 명단 → 하위 업무 자동 연결 (계층형)
 *   예) "총무부&홍보부(최유환, 이현석, ...)"
 *       "- 15시 00분에 출발"
 *       ">> 학술관 도착해서 301호로 바로 안내"
 *
 * - 자연어 시간 인식: "15시", "15시 00분", "오후 3시"
 * - Bullet 기호 기반 업무/메모 분류
 * - 괄호 안 이름 추출 + 부가설명 → memo 필드
 */

export interface User {
  id: string;
  name: string;       // 성명
  shortName?: string; // 단명
  role?: string;
}

export interface Task {
  id: string;
  userId: string;
  userName: string;
  title: string;
  category: string;
  time: string;
  status: 'pending' | 'done';
  originalText?: string;
  memo?: string;
}

export interface TimelineItem {
  id: string;
  time: string;        // "13:40"
  location: string;    // "라이온스홀"
  title: string;       // "공학대학 학과 회장단 소개"
  detail: string;      // "건환/건축/교통/..."
  assignedTasks: Task[]; // 해당 시간대에 배정된 업무들
}

export interface ParseResult {
  tasks: Task[];
  timeline: TimelineItem[];
}

// ─── 유틸 함수 ─────────────────────────────────────────────

/** 괄호 안 내용 추출 (모든 괄호 그룹을 합쳐서 반환) */
function extractParenContent(str: string): { outside: string; inside: string } {
  const matches = [...str.matchAll(/\(([^)]+)\)/g)];
  if (matches.length === 0) return { outside: str, inside: '' };
  return {
    outside: str.replace(/\([^)]*\)/g, '').trim(),
    inside: matches.map(m => m[1].trim()).join(', '),
  };
}

/** 이름 구분자로 문자열 분리 */
function splitNames(str: string): string[] {
  return str.split(/[-,/·&\s]+/).map(s => s.trim()).filter(s => s.length > 0);
}

/** 텍스트에서 유저 찾기 (성명 + 단명 매칭) */
function findUsersInText(text: string, users: User[]): User[] {
  const segments = splitNames(text);
  const matched: User[] = [];
  const seen = new Set<string>();

  for (const seg of segments) {
    if (!seg) continue;
    const found = users.find(u => {
      if (u.name === seg) return true;
      if (u.shortName && u.shortName === seg) return true;
      return false;
    });
    if (found && !seen.has(found.id)) {
      seen.add(found.id);
      matched.push(found);
    }
  }
  return matched;
}

/** 자연어 시간 추출 (다양한 형식 지원) */
function extractTime(text: string): string | null {
  // 패턴 1: HH:MM - HH:MM or HH:MM~HH:MM
  const rangeMatch = text.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) return `${rangeMatch[1]} - ${rangeMatch[2]}`;

  // 패턴 2: HH:MM 단독
  const colonMatch = text.match(/\b(\d{1,2}:\d{2})\b/);
  if (colonMatch) return colonMatch[1];

  // 패턴 3: "15시 00분" or "15시00분"
  const korFullMatch = text.match(/(\d{1,2})시\s*(\d{1,2})분/);
  if (korFullMatch) {
    const h = korFullMatch[1].padStart(2, '0');
    const m = korFullMatch[2].padStart(2, '0');
    return `${h}:${m}`;
  }

  // 패턴 4: "15시" (분 없이)
  const korHourMatch = text.match(/(\d{1,2})시(?!\s*\d)/);
  if (korHourMatch) return `${korHourMatch[1].padStart(2, '0')}:00`;

  // 패턴 5: "오후 N시"
  const ampmMatch = text.match(/(오전|오후)\s*(\d{1,2})시/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[2]);
    if (ampmMatch[1] === '오후' && h < 12) h += 12;
    if (ampmMatch[1] === '오전' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:00`;
  }

  return null;
}

/** 줄이 bullet (업무) 줄인지 판별 */
function isBulletLine(line: string): boolean {
  return /^[-*•]\s/.test(line);
}

/** 줄이 부가 설명(메모) 줄인지 판별 */
function isMemoLine(line: string): boolean {
  return /^(>>|※|→|▸|▹)\s*/.test(line);
}

/** bullet/memo 접두사 제거 */
function stripBullet(line: string): string {
  return line.replace(/^[-*•>>※→▸▹]+\s*/, '').trim();
}

/** 업무 내용으로 카테고리 자동 감지 */
function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/인솔|안내|안내방송/.test(lower)) return '인솔';
  if (/점검|확인|체크/.test(lower)) return '점검';
  if (/준비|챙기|설치|진열|세팅/.test(lower)) return '준비';
  if (/출발|이동|탑승|도착/.test(lower)) return '이동';
  return '업무';
}

/** 장소 키워드 감지 */
function extractLocation(text: string): string | null {
  // 흔한 장소 패턴: "~홀", "~관", "~실", "~동"
  const match = text.match(/([가-힣]+(?:홀|관|실|동|센터|광장|체육관|강당))/);
  return match ? match[1] : null;
}

/**
 * v2 시간 추출 후 원본에서 시간 부분 제거
 */
function extractAndRemoveTime(line: string): { time: string | null; rest: string } {
  // 패턴 1: HH:MM - HH:MM
  const rangeMatch = line.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) {
    return { time: `${rangeMatch[1]} - ${rangeMatch[2]}`, rest: line.replace(rangeMatch[0], '').trim() };
  }

  // 패턴 2: "15시 00분"
  const korFullMatch = line.match(/(\d{1,2})시\s*(\d{1,2})분/);
  if (korFullMatch) {
    const h = korFullMatch[1].padStart(2, '0');
    const m = korFullMatch[2].padStart(2, '0');
    return { time: `${h}:${m}`, rest: line.replace(korFullMatch[0], '').trim() };
  }

  // 패턴 3: HH:MM 단독 (시간 context로만, 라인에서 제거)
  const colonMatch = line.match(/\b(\d{1,2}:\d{2})\b/);
  if (colonMatch) {
    return { time: colonMatch[1], rest: line.replace(colonMatch[0], '').trim() };
  }

  // 패턴 4: "15시"
  const korHourMatch = line.match(/(\d{1,2})시/);
  if (korHourMatch) {
    return { time: `${korHourMatch[1].padStart(2, '0')}:00`, rest: line.replace(korHourMatch[0], '').trim() };
  }

  return { time: null, rest: line };
}

// ─── 메인 파서 ─────────────────────────────────────────────

export const parseScheduleText = (text: string, users: User[]): Task[] => {
  const result = parseScheduleFull(text, users);
  return result.tasks;
};

/**
 * v2 Full 파서: Task[] + TimelineItem[] 반환
 */
export const parseScheduleFull = (text: string, users: User[]): ParseResult => {
  const lines = text.split('\n');
  const tasks: Task[] = [];
  const timelineItems: TimelineItem[] = [];

  // ── 상태(State) ──
  let currentTime = '';
  let currentLocation = '';
  let activeUsers: User[] = [];     // 현재 줄 이하에 배정될 사용자 그룹
  let lastTasks: Task[] = [];       // 직전 생성된 task 들 (memo 병합용)

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // ── Step 1: 시간 추출 ──
    const { time: lineTime, rest: afterTimeRemoval } = extractAndRemoveTime(line);
    if (lineTime) {
      currentTime = lineTime;
    }

    // ── Step 2: 장소 감지 ──
    const loc = extractLocation(line);
    if (loc) currentLocation = loc;

    // ── Step 3: 메모 줄 (>> / ※) → 직전 task 들에 memo 병합 ──
    if (isMemoLine(line)) {
      const memoText = stripBullet(line);
      if (memoText && lastTasks.length > 0) {
        for (const lt of lastTasks) {
          lt.memo = lt.memo ? `${lt.memo} / ${memoText}` : memoText;
        }
      }
      continue;
    }

    // ── Step 4: 콜론(:) 기반 레거시 파싱 (기존 v1 호환) ──
    // 시간 패턴 제거 후 남은 문자열에서 콜론 분리
    const workLine = afterTimeRemoval || line;
    const colonIdx = workLine.indexOf(':');

    if (colonIdx !== -1) {
      const leftRaw = workLine.slice(0, colonIdx).trim();
      const rightRaw = workLine.slice(colonIdx + 1).trim();

      if (leftRaw && rightRaw) {
        // 왼쪽에서 괄호 처리
        const { outside: leftOutside, inside: leftInside } = extractParenContent(leftRaw);
        // 괄호 안 이름 + 바깥 이름 모두 추출
        const leftNames = leftInside ? `${leftOutside} ${leftInside}` : leftOutside;
        const rightNames = rightRaw;

        const usersInLeft = findUsersInText(leftNames, users);
        const usersInRight = findUsersInText(rightNames, users);

        if (usersInRight.length > 0 && usersInLeft.length === 0) {
          // 패턴: "인솔 인원 : 장현준 - 정별하"
          let taskTitle = leftRaw.replace(/인원/g, '').replace(/인솔/g, '').replace(/\(.*?\)/g, '').trim();
          if (!taskTitle) taskTitle = '인솔';
          const category = detectCategory(`${leftRaw} ${taskTitle}`);
          const newTasks: Task[] = [];

          for (const user of usersInRight) {
            const t: Task = {
              id: crypto.randomUUID(),
              userId: user.id,
              userName: user.name,
              title: taskTitle,
              time: currentTime || '미정',
              category,
              status: 'pending',
              originalText: rawLine,
            };
            tasks.push(t);
            newTasks.push(t);
          }
          lastTasks = newTasks;
          // 이 줄에서 감지된 사용자를 activeUsers에도 세팅
          activeUsers = usersInRight;
          continue;

        } else if (usersInLeft.length > 0 && usersInRight.length === 0) {
          // 패턴: "도윤, 민재 : 과깃발 챙기기"
          const taskTitle = rightRaw;
          const category = detectCategory(rightRaw);
          const newTasks: Task[] = [];

          for (const user of usersInLeft) {
            const t: Task = {
              id: crypto.randomUUID(),
              userId: user.id,
              userName: user.name,
              title: taskTitle,
              time: currentTime || '미정',
              category,
              status: 'pending',
              originalText: rawLine,
            };
            tasks.push(t);
            newTasks.push(t);
          }
          lastTasks = newTasks;
          activeUsers = usersInLeft;
          continue;

        } else if (usersInLeft.length > 0 && usersInRight.length > 0) {
          // 양쪽에 이름
          let taskTitle = leftRaw.replace(/인원/g, '').replace(/인솔/g, '').replace(/\(.*?\)/g, '').trim();
          if (!taskTitle) taskTitle = '인솔';
          const category = detectCategory(`${leftRaw} ${taskTitle}`);
          const allUsers = [...usersInLeft, ...usersInRight];
          const seen = new Set<string>();
          const newTasks: Task[] = [];

          for (const user of allUsers) {
            if (seen.has(user.id)) continue;
            seen.add(user.id);
            const t: Task = {
              id: crypto.randomUUID(),
              userId: user.id,
              userName: user.name,
              title: taskTitle,
              time: currentTime || '미정',
              category,
              status: 'pending',
              originalText: rawLine,
            };
            tasks.push(t);
            newTasks.push(t);
          }
          lastTasks = newTasks;
          activeUsers = allUsers;
          continue;

        } else {
          // 콜론이 있지만 양쪽 모두 이름이 아님 → 타임라인 항목일 수 있음
          // (예: "13:40  공학대학 학과 회장단 소개  건환/건축/...")
          // 아래 타임라인 수집으로 넘김
        }
      }
    }

    // ── Step 5: 그룹 명단 감지 (콜론 없이 이름만 있는 줄) ──
    // 예: "총무부&홍보부(최유환, 이현석, 강동혁, ...)"
    const { outside, inside } = extractParenContent(line);
    const combinedText = inside ? `${outside} ${inside}` : outside;
    const detectedUsers = findUsersInText(combinedText, users);

    if (detectedUsers.length >= 2 && !isBulletLine(line)) {
      // 2명 이상 감지 → 그룹 명단으로 간주, activeUsers 설정
      activeUsers = detectedUsers;
      lastTasks = [];
      continue;
    }

    // ── Step 6 & 7: Bullet 줄이 아니더라도 activeUsers가 있으면 업무로 간주 (묵시적 업무) ──
    // 예: "10:30 - 11:30 준비" -> 시간 + 내용만 있는 경우
    if (activeUsers.length > 0 && !isMemoLine(line)) {
      const bulletContent = stripBullet(line);
      // bullet 내에서 시간 추출
      const { time: bulletTime, rest: bulletRest } = extractAndRemoveTime(bulletContent);
      if (bulletTime) currentTime = bulletTime;

      // 괄호 안 부가 설명을 memo로 분리
      const { outside: taskBody, inside: taskMemo } = extractParenContent(bulletRest || bulletContent);

      const taskTitle = taskBody
        .replace(/에는$/, '')
        .replace(/늦어도\s*/, '')
        .trim() || bulletContent;

      if (taskTitle) {
        const category = detectCategory(taskTitle);
        const newTasks: Task[] = [];

        for (const user of activeUsers) {
          const t: Task = {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            title: taskTitle,
            time: currentTime || '미정',
            category,
            status: 'pending',
            originalText: rawLine,
            memo: taskMemo || undefined,
          };
          tasks.push(t);
          newTasks.push(t);
        }
        lastTasks = newTasks;

        // "10:30 - 11:30 운영" 처럼 타임라인 항목도 겸하는 경우 타임라인에 추가
        if (currentTime) {
          const exists = timelineItems.find(t => t.time === currentTime && t.title === taskTitle);
          if (!exists) {
            timelineItems.push({
              id: crypto.randomUUID(),
              time: currentTime,
              location: currentLocation,
              title: taskTitle,
              detail: '',
              assignedTasks: [],
            });
          }
        }
        continue;
      }
    }

    // ── Step 8: 타임라인 항목 수집 (activeUsers가 없는 단독 줄) ──
    // 시간이 있는 줄이면서 위의 조건에 해당하지 않는 줄 → 타임라인 단독 항목
    if (lineTime || currentTime) {
      const content = afterTimeRemoval || line;
      if (content && content.length > 1) {
        // 콜론 기반으로 분리 시도 (title : detail)
        const ci = content.indexOf(':');
        let title = content;
        let detail = '';
        if (ci !== -1) {
          title = content.slice(0, ci).trim();
          detail = content.slice(ci + 1).trim();
        }

        // 이미 같은 시간에 같은 제목이 있으면 스킵
        const exists = timelineItems.find(t => t.time === (lineTime || currentTime) && t.title === title);
        if (!exists && title) {
          timelineItems.push({
            id: crypto.randomUUID(),
            time: lineTime || currentTime,
            location: currentLocation,
            title,
            detail,
            assignedTasks: [],
          });
        }
      }
    }
  }

  // ── 후처리: 타임라인에 관련 Task 연결 ──
  for (const tl of timelineItems) {
    tl.assignedTasks = tasks.filter(t => t.time === tl.time || t.time.startsWith(tl.time));
  }

  // 타임라인 시간순 정렬
  timelineItems.sort((a, b) => {
    const ta = a.time.replace(/[^0-9:]/g, '').split(':').map(Number);
    const tb = b.time.replace(/[^0-9:]/g, '').split(':').map(Number);
    const ma = (ta[0] || 0) * 60 + (ta[1] || 0);
    const mb = (tb[0] || 0) * 60 + (tb[1] || 0);
    return ma - mb;
  });

  return { tasks, timeline: timelineItems };
};
