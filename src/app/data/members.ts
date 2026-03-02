export interface Member {
  id: string;
  fullName: string;   // 성명 (예: 이도윤)
  shortName: string;  // 단명 (예: 도윤)
}

// 전체 명단 - 성명과 단명(호칭) 모두 포함
export const MEMBERS: Member[] = [
  { id: 'm01', fullName: '장현준', shortName: '현준' },
  { id: 'm02', fullName: '최유환', shortName: '유환' },
  { id: 'm03', fullName: '최정윤', shortName: '정윤' },
  { id: 'm04', fullName: '서원경', shortName: '원경' },
  { id: 'm05', fullName: '엄지웅', shortName: '지웅' },
  { id: 'm06', fullName: '김도훈', shortName: '도훈' },
  { id: 'm07', fullName: '조혜영', shortName: '혜영' },
  { id: 'm08', fullName: '김연준', shortName: '연준' },
  { id: 'm09', fullName: '이승배', shortName: '승배' },
  { id: 'm10', fullName: '류가희', shortName: '가희' },
  { id: 'm11', fullName: '박서연', shortName: '서연' },
  { id: 'm12', fullName: '임가은', shortName: '가은' },
  { id: 'm13', fullName: '정태성', shortName: '태성' },
  { id: 'm14', fullName: '김범석', shortName: '범석' },
  { id: 'm15', fullName: '김민건', shortName: '민건' },
  { id: 'm16', fullName: '이현석', shortName: '현석' },
  { id: 'm17', fullName: '김나래', shortName: '나래' },
  { id: 'm18', fullName: '고승민', shortName: '승민' },
  { id: 'm19', fullName: '손우석', shortName: '우석' },
  { id: 'm20', fullName: '정별하', shortName: '별하' },
  { id: 'm21', fullName: '장현서', shortName: '현서' },
  { id: 'm22', fullName: '강인',   shortName: '인' },
  { id: 'm23', fullName: '지민승', shortName: '민승' },
  { id: 'm24', fullName: '강동혁', shortName: '동혁' },
  { id: 'm25', fullName: '이승윤', shortName: '승윤' },
  { id: 'm26', fullName: '이도윤', shortName: '도윤' },
  { id: 'm27', fullName: '제민재', shortName: '민재' },
  { id: 'm28', fullName: '남희석', shortName: '희석' },
  { id: 'm29', fullName: '정다은', shortName: '다은' },
  { id: 'm30', fullName: '송채연', shortName: '채연' },
  { id: 'm31', fullName: '이명은', shortName: '명은' },
  { id: 'm32', fullName: '민홍기', shortName: '홍기' },
  { id: 'm33', fullName: '정우현', shortName: '우현' },
];
