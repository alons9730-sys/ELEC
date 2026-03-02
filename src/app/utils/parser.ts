/**
 * 스케줄 텍스트 파서
 *
 * 지원 형식:
 * - "16:00 - 16:30 인솔 인원 : 장현준 - 정별하 - 임가은"
 * - "인솔 인원 : 이도윤, 제민재, 도훈"
 * - "도윤 : 자료 준비하기"
 * - "태성, 민재 (2) : 과깃발 챙기기"
 * - "현준 - 별하 : 안내 방송"
 *
 * 이름 인식:
 * - 성명 (예: 이도윤, 장현준)
 * - 단명/호칭 (예: 도윤, 현준)
 * - 두 가지 형식 모두 동일 인물로 매핑
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
}

// 괄호 안 내용 제거, 공백 정리
function cleanSegment(raw: string): string {
  return raw.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
}

// 이름 구분자로 문자열을 분리 (- , / · & 공백+숫자 등)
function splitNames(str: string): string[] {
  // 구분자: 대시(-), 쉼표(,), 슬래시(/), 가운뎃점(·), 앰퍼샌드(&)
  return str.split(/[-,/·&]/).map(cleanSegment).filter(s => s.length > 0);
}

/**
 * 텍스트 세그먼트에서 매칭되는 사용자 목록을 반환
 * - 성명(name)과 단명(shortName) 모두 체크
 * - 단명이 1글자인 경우(예: '인') 다른 단어의 일부로 포함되지 않도록 정확히 매칭
 */
function findUsersInSegments(segments: string[], users: User[]): User[] {
  const matched: User[] = [];
  const seen = new Set<string>();

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    const found = users.find(u => {
      if (u.name === trimmed) return true;
      if (u.shortName && u.shortName === trimmed) return true;
      return false;
    });

    if (found && !seen.has(found.id)) {
      seen.add(found.id);
      matched.push(found);
    }
  }

  return matched;
}

/**
 * 메인 파서: 텍스트를 줄별로 분석하여 Task 배열 반환
 */
export const parseScheduleText = (text: string, users: User[]): Task[] => {
  const lines = text.split('\n');
  let currentTime = '';
  const tasks: Task[] = [];

  // 시간 패턴: HH:MM - HH:MM 또는 HH:MM~HH:MM
  const timeRegex = /(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // 1. 시간 추출
    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      // 시작-종료 형식으로 정규화
      currentTime = `${timeMatch[1]} - ${timeMatch[2]}`;
      // 시간 문자열 제거 후 나머지 처리
      line = line.replace(timeMatch[0], '').trim();
      // 시간만 있는 줄이면 skip
      if (!line) continue;
    }

    // 시간 컨텍스트 없으면 "미정"
    const taskTime = currentTime || '미정';

    // 2. 콜론(:)으로 left/right 분리
    // 단, 시간 패턴 내 콜론은 이미 제거되었으므로 첫 번째 ':' 기준으로 분리
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const leftRaw = line.slice(0, colonIdx).trim();
    const rightRaw = line.slice(colonIdx + 1).trim();

    if (!leftRaw || !rightRaw) continue;

    const leftSegments = splitNames(leftRaw);
    const rightSegments = splitNames(rightRaw);

    const usersInLeft = findUsersInSegments(leftSegments, users);
    const usersInRight = findUsersInSegments(rightSegments, users);

    if (usersInRight.length > 0 && usersInLeft.length === 0) {
      // 패턴: "업무 : 이름1 - 이름2"
      // leftRaw가 task 제목
      let taskTitle = leftRaw
        .replace(/인원/g, '')
        .replace(/인솔/g, '')
        .trim();
      if (!taskTitle) taskTitle = '인솔';

      const category = detectCategory(taskTitle, leftRaw);

      for (const user of usersInRight) {
        tasks.push({
          id: crypto.randomUUID(),
          userId: user.id,
          userName: user.name,
          title: taskTitle,
          time: taskTime,
          category,
          status: 'pending',
          originalText: rawLine,
        });
      }
    } else if (usersInLeft.length > 0 && usersInRight.length === 0) {
      // 패턴: "이름1, 이름2 : 업무 내용"
      const taskTitle = rightRaw;
      const category = detectCategory('', rightRaw);

      for (const user of usersInLeft) {
        tasks.push({
          id: crypto.randomUUID(),
          userId: user.id,
          userName: user.name,
          title: taskTitle,
          time: taskTime,
          category,
          status: 'pending',
          originalText: rawLine,
        });
      }
    } else if (usersInLeft.length > 0 && usersInRight.length > 0) {
      // 양쪽에 이름이 있는 경우 → right를 이름 목록으로 처리
      // 예: "인솔(현준) : 정별하 - 임가은" (간혹 발생)
      let taskTitle = leftRaw
        .replace(/인원/g, '')
        .replace(/인솔/g, '')
        .trim();
      if (!taskTitle) taskTitle = '인솔';

      const category = detectCategory(taskTitle, leftRaw);

      for (const user of usersInRight) {
        tasks.push({
          id: crypto.randomUUID(),
          userId: user.id,
          userName: user.name,
          title: taskTitle,
          time: taskTime,
          category,
          status: 'pending',
          originalText: rawLine,
        });
      }
    }
  }

  return tasks;
};

/**
 * 업무 내용 기반 카테고리 자동 감지
 */
function detectCategory(left: string, right: string): string {
  const combined = (left + ' ' + right).toLowerCase();
  if (combined.includes('인솔') || combined.includes('안내')) return '인솔';
  if (combined.includes('점검') || combined.includes('확인') || combined.includes('체크')) return '점검';
  if (combined.includes('준비') || combined.includes('챙기') || combined.includes('설치')) return '준비';
  if (combined.includes('출발') || combined.includes('이동') || combined.includes('탑승')) return '이동';
  return '업무';
}
