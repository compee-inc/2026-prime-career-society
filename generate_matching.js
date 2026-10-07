'use strict';
// PRIME CAREER SOCIETY — 7x7 매칭 관리 파일 생성기

const ExcelJS = require('exceljs');
const path = require('path');

// ============================================================
// 색상 팔레트 (ARGB)
// ============================================================
const C = {
  IVORY:      'FFFFFFF0',
  IVORY_SOFT: 'FFFDFDF5',
  IVORY_INP:  'FFFEFEF2',
  BLACK:      'FF1A1A1A',
  CHARCOAL:   'FF2C2C2C',
  CHAR_MID:   'FF484848',
  CHAR_LT:    'FF6A6A6A',
  GOLD:       'FFC9A84C',
  GOLD_DARK:  'FFA8882A',
  GOLD_LT:    'FFF5E6C8',
  GOLD_VLT:   'FFFBF3E4',
  WHITE:      'FFFFFFFF',
  M_GREEN:    'FFE8F5E9',
  M_GREEN_D:  'FFA5D6A7',
  ADMIN:      'FFFFF8F0',
  CALC:       'FFF5F5F5',
  NO_MATCH:   'FFEEEEEE',
  PENDING:    'FFFFF9E6',
  DECLINED:   'FFFAFAFA',
  SHARED:     'FFE3F2FD',
  RED_L:      'FFFFEBEE',
  WARN:       'FFFFF3E0',
};

// ============================================================
// 스타일 헬퍼
// ============================================================
const mkFill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const mkFont = (o = {}) => ({ name: 'Calibri', size: o.size||11, bold: o.bold||false, italic: o.italic||false, color: { argb: o.color||C.BLACK } });
const mkAlign = (h='left', v='middle', wrap=false) => ({ horizontal: h, vertical: v, wrapText: wrap });
const mkBorder = (style='thin', argb=C.CHAR_MID) => {
  const s = { style, color: { argb } };
  return { top: s, left: s, bottom: s, right: s };
};
const mkBorderMed = () => mkBorder('medium', C.CHARCOAL);
const mkBorderBot = (style='thin', argb=C.CHAR_MID) => ({ bottom: { style, color: { argb } } });

function sc(ws, row, col, val, o={}) {
  const cell = ws.getCell(row, col);
  cell.value = val;
  cell.fill = mkFill(o.fill || C.IVORY);
  cell.font = mkFont(o);
  cell.alignment = mkAlign(o.h||'left', o.v||'middle', o.wrap||false);
  if (o.border !== false) cell.border = o.thick ? mkBorderMed() : mkBorder();
  if (o.numFmt) cell.numFmt = o.numFmt;
  return cell;
}

function hdr(ws, row, col, val, o={}) {
  return sc(ws, row, col, val, { bold:true, size:11, color:C.WHITE, fill:C.CHARCOAL, h:'center', ...o });
}

function sec(ws, row, sc_, ec_, val, o={}) {
  ws.mergeCells(row, sc_, row, ec_);
  const cell = ws.getCell(row, sc_);
  cell.value = val;
  cell.fill = mkFill(o.fill || C.GOLD_LT);
  cell.font = mkFont({ bold:true, size:12, color:C.CHARCOAL, ...o });
  cell.alignment = mkAlign('left', 'middle');
  return cell;
}

function mset(ws, r1, c1, r2, c2, val, o={}) {
  ws.mergeCells(r1, c1, r2, c2);
  const cell = ws.getCell(r1, c1);
  cell.value = val;
  cell.fill = mkFill(o.fill || C.IVORY);
  cell.font = mkFont(o);
  cell.alignment = mkAlign(o.h||'left', o.v||'middle', o.wrap||false);
  if (o.border !== false) {
    for (let r=r1; r<=r2; r++) for (let c=c1; c<=c2; c++) {
      ws.getCell(r, c).border = mkBorder();
    }
  }
  return cell;
}

function goldLine(ws, row, c1, c2) {
  ws.getRow(row).height = 4;
  for (let c=c1; c<=c2; c++) ws.getCell(row, c).fill = mkFill(C.GOLD);
}

function rowFill(ws, row, c1, c2, argb) {
  for (let c=c1; c<=c2; c++) ws.getCell(row, c).fill = mkFill(argb);
}

function blankRow(ws, row, h=10) { ws.getRow(row).height = h; }

// ============================================================
// 테스트 데이터
// ============================================================
const males = [
  { id:'M1', name:'김준혁', age:32, job:'금융권' },
  { id:'M2', name:'이승민', age:35, job:'대기업' },
  { id:'M3', name:'박지호', age:30, job:'IT개발' },
  { id:'M4', name:'정우진', age:33, job:'의사' },
  { id:'M5', name:'최현수', age:31, job:'스타트업' },
  { id:'M6', name:'강도현', age:34, job:'변호사' },
  { id:'M7', name:'윤재원', age:29, job:'연구원' },
];
const females = [
  { id:'W1', name:'김서연', age:28, job:'마케팅' },
  { id:'W2', name:'이지현', age:30, job:'디자이너' },
  { id:'W3', name:'박민지', age:27, job:'회계사' },
  { id:'W4', name:'정수아', age:29, job:'IT기획' },
  { id:'W5', name:'최예린', age:31, job:'교사' },
  { id:'W6', name:'강하은', age:28, job:'간호사' },
  { id:'W7', name:'윤채원', age:26, job:'대학원생' },
];
const MC = {
  M1:['W1','W2','W3'], M2:['W1','W4','W5'], M3:['W2','W5','W6'],
  M4:['W3','W6','W7'], M5:['W4','W7','W2'], M6:['W5','W1','W3'],
  M7:['W6','W7','W4'],
};
const FC = {
  W1:['M2','M1','M6'], W2:['M1','M3','M5'], W3:['M4','M1','M6'],
  W4:['M5','M7','M2'], W5:['M3','M6','M2'], W6:['M7','M3','M4'],
  W7:['M4','M5','M7'],
};

// ============================================================
// 매칭 알고리즘
// ============================================================
function rankScore(rank) { return rank ? 4-rank : 0; }
function rankTxt(rank) { return rank ? `${rank}순위` : '-'; }

function calcAllPairs() {
  const res = [];
  for (const m of males) {
    const mc = MC[m.id]||[];
    for (const w of females) {
      const wc = FC[w.id]||[];
      const rm = mc.indexOf(w.id)>=0 ? mc.indexOf(w.id)+1 : null;
      const rw = wc.indexOf(m.id)>=0 ? wc.indexOf(m.id)+1 : null;
      const mutual = rm!==null && rw!==null;
      res.push({ mId:m.id, wId:w.id, rm, rw,
        sm: rm?rankScore(rm):null, sw: rw?rankScore(rw):null,
        total: mutual? rankScore(rm)+rankScore(rw) : null, mutual });
    }
  }
  return res;
}

function getMutual(all) {
  return all.filter(p=>p.mutual).sort((a,b)=>b.total-a.total||a.mId.localeCompare(b.mId));
}

function greedyMatch(mutual, max=2) {
  const mc={}; const wc={};
  males.forEach(m=>mc[m.id]=0); females.forEach(w=>wc[w.id]=0);
  const matched=[];
  for (const p of mutual) {
    if (mc[p.mId]<max && wc[p.wId]<max) {
      matched.push(p); mc[p.mId]++; wc[p.wId]++;
    }
  }
  return { matched, mc, wc };
}

// ============================================================
// 계산 실행
// ============================================================
const allPairs  = calcAllPairs();
const mutual    = getMutual(allPairs);
const { matched, mc: mMatchCnt, wc: wMatchCnt } = greedyMatch(mutual);

console.log('\n▶ 상호선택 쌍 목록 (' + mutual.length + '쌍):');
mutual.forEach(p=>{
  console.log(`  ${p.mId}↔${p.wId}  남(${rankTxt(p.rm)})  여(${rankTxt(p.rw)})  총${p.total}점`);
});
console.log('\n▶ 최종 매칭 결과 (' + matched.length + '쌍):');
matched.forEach(p=>{
  console.log(`  ★ ${p.mId}↔${p.wId}  ${rankTxt(p.rm)}↔${rankTxt(p.rw)}  ${p.total}점`);
});
console.log('\n▶ 참가자별 최종 매칭 수:');
males.forEach(m=>  console.log(`  ${m.id}: ${mMatchCnt[m.id]}명`));
females.forEach(w=>console.log(`  ${w.id}: ${wMatchCnt[w.id]}명`));

// ============================================================
// [1] START 시트
// ============================================================
function makeStart(wb) {
  const ws = wb.addWorksheet('START', { views:[{ showGridLines:false }] });
  ws.getColumn(1).width=3; ws.getColumn(2).width=28; ws.getColumn(3).width=38;
  for (let c=4;c<=8;c++) ws.getColumn(c).width=14;

  // 배경 아이보리
  for (let r=1;r<=45;r++) for (let c=1;c<=9;c++) ws.getCell(r,c).fill=mkFill(C.IVORY);

  blankRow(ws, 1, 15);

  // 제목 블록
  ws.getRow(2).height = 55;
  ws.mergeCells(2,2,2,7);
  Object.assign(ws.getCell(2,2), {
    value:'PRIME CAREER SOCIETY',
    fill:mkFill(C.CHARCOAL),
    font:mkFont({bold:true,size:22,color:C.GOLD_DARK}),
    alignment:mkAlign('center','middle'),
  });
  for (let c=2;c<=7;c++) ws.getCell(2,c).fill=mkFill(C.CHARCOAL);

  ws.getRow(3).height = 28;
  ws.mergeCells(3,2,3,7);
  Object.assign(ws.getCell(3,2), {
    value:'7 : 7  MATCHING MANAGEMENT',
    fill:mkFill(C.CHARCOAL),
    font:mkFont({bold:true,size:14,color:C.GOLD_LT}),
    alignment:mkAlign('center','middle'),
  });
  for (let c=2;c<=7;c++) ws.getCell(3,c).fill=mkFill(C.CHARCOAL);

  goldLine(ws, 4, 2, 7);
  blankRow(ws, 5, 10);

  // 사용 순서
  ws.getRow(6).height = 26;
  sec(ws, 6, 2, 7, '■  사용 순서');

  const steps = [
    '①  [참가자입력] 시트에 참가자 이름, 나이, 직업을 입력합니다.',
    '②  각 참가자의 1순위 / 2순위 / 3순위 선택을 입력합니다.',
    '③  [상호선택] 시트에서 상호 선택 관계를 확인합니다. (자동 계산)',
    '④  [매칭계산] 시트에서 전체 최적화 매칭 추천 결과를 확인합니다.',
    '⑤  [최종결과] 시트에서 참가자별 최종 매칭 현황을 확인합니다.',
    '⑥  [운영자최종검토] 시트에서 승인 및 연락처 공유 동의를 관리합니다.',
  ];
  steps.forEach((s,i)=>{
    const row=7+i;
    ws.getRow(row).height=22;
    ws.mergeCells(row,2,row,7);
    const cell=ws.getCell(row,2);
    cell.value='  '+s;
    cell.fill=mkFill(C.IVORY_SOFT);
    cell.font=mkFont({size:11,color:C.BLACK});
    cell.alignment=mkAlign('left','middle');
    for (let c=2;c<=7;c++) {
      ws.getCell(row,c).fill=mkFill(C.IVORY_SOFT);
      ws.getCell(row,c).border=mkBorderBot();
    }
  });

  blankRow(ws,13,10);

  // 운영 원칙
  ws.getRow(14).height=26;
  sec(ws,14,2,7,'■  운영 원칙');

  const rules=[
    ['1인 최대 3명 선택','참가자는 이성 중 최대 3명(1/2/3순위)을 선택합니다.'],
    ['1인 최대 2명 매칭','최종 매칭은 1인당 최대 2명으로 제한됩니다.'],
    ['상호 선택만 매칭','한쪽만 선택한 경우 매칭 후보에서 제외됩니다.'],
    ['순위 기반 점수','1순위=3점 / 2순위=2점 / 3순위=1점 — 쌍방 합산'],
    ['운영자 최종 검토 필수','자동 계산 결과는 반드시 운영자가 확인 후 확정합니다.'],
    ['연락처 별도 동의','매칭 확정 후 양측 동의 확인 후에만 연락처를 공유합니다.'],
  ];
  rules.forEach(([title,desc],i)=>{
    const row=15+i;
    ws.getRow(row).height=22;
    const cell1=ws.getCell(row,2);
    cell1.value=`  •  ${title}`;
    cell1.fill=mkFill(C.IVORY_SOFT);
    cell1.font=mkFont({bold:true,size:10,color:C.GOLD_DARK});
    cell1.alignment=mkAlign('left','middle');
    ws.mergeCells(row,3,row,7);
    const cell2=ws.getCell(row,3);
    cell2.value=desc;
    cell2.fill=mkFill(C.IVORY_SOFT);
    cell2.font=mkFont({size:10,color:C.BLACK});
    cell2.alignment=mkAlign('left','middle');
    for (let c=2;c<=7;c++) {
      ws.getCell(row,c).fill=mkFill(C.IVORY_SOFT);
      ws.getCell(row,c).border=mkBorderBot();
    }
  });

  blankRow(ws,21,10);

  // 상태 코드
  ws.getRow(22).height=26;
  sec(ws,22,2,7,'■  연락처 공유 상태 코드');

  const statuses=[
    ['MATCHED',          C.M_GREEN_D, '상호 선택 확인 완료 — 운영자 검토 대기'],
    ['PENDING CONSENT',  C.PENDING,   '운영자 승인 완료 — 연락처 공유 동의 확인 중'],
    ['BOTH CONSENTED',   C.M_GREEN,   '양측 모두 연락처 공유 동의 완료'],
    ['ONE SIDE DECLINED',C.RED_L,     '한쪽 연락처 공유 거절'],
    ['CONTACT SHARED',   C.SHARED,    '연락처 공유 완료'],
  ];
  statuses.forEach(([code,bg,desc],i)=>{
    const row=23+i;
    ws.getRow(row).height=22;
    const cell1=ws.getCell(row,2);
    cell1.value=code;
    cell1.fill=mkFill(bg);
    cell1.font=mkFont({bold:true,size:10,color:C.BLACK});
    cell1.alignment=mkAlign('center','middle');
    cell1.border=mkBorder();
    ws.mergeCells(row,3,row,7);
    const cell2=ws.getCell(row,3);
    cell2.value=desc;
    cell2.fill=mkFill(C.IVORY_SOFT);
    cell2.font=mkFont({size:10,color:C.BLACK});
    cell2.alignment=mkAlign('left','middle');
    for (let c=3;c<=7;c++) {
      ws.getCell(row,c).fill=mkFill(C.IVORY_SOFT);
      ws.getCell(row,c).border=mkBorderBot();
    }
  });

  goldLine(ws,29,2,7);
  blankRow(ws,30,14);
  ws.mergeCells(30,2,30,7);
  const footer=ws.getCell(30,2);
  footer.value='© PRIME CAREER SOCIETY  |  CONFIDENTIAL  |  운영 전용 문서';
  footer.fill=mkFill(C.IVORY);
  footer.font=mkFont({size:9,italic:true,color:C.CHAR_LT});
  footer.alignment=mkAlign('center','middle');
  for (let c=2;c<=7;c++) ws.getCell(30,c).fill=mkFill(C.IVORY);
}

// ============================================================
// [2] 참가자입력 시트
// ============================================================
function makeParticipants(wb) {
  const ws = wb.addWorksheet('참가자입력', { views:[{ showGridLines:false }] });

  // 열 너비
  ws.getColumn(1).width=4;   // 여백
  ws.getColumn(2).width=6;   // 성별
  ws.getColumn(3).width=8;   // ID
  ws.getColumn(4).width=12;  // 이름
  ws.getColumn(5).width=6;   // 나이
  ws.getColumn(6).width=14;  // 직업
  ws.getColumn(7).width=10;  // 1순위
  ws.getColumn(8).width=10;  // 2순위
  ws.getColumn(9).width=10;  // 3순위
  ws.getColumn(10).width=22; // 오류체크

  // 배경 아이보리
  for (let r=1;r<=30;r++) for (let c=1;c<=11;c++) ws.getCell(r,c).fill=mkFill(C.IVORY);

  blankRow(ws,1,12);

  // 타이틀
  ws.getRow(2).height=40;
  ws.mergeCells(2,2,2,10);
  const tCell=ws.getCell(2,2);
  tCell.value='PRIME CAREER SOCIETY  —  참가자 정보 입력';
  tCell.fill=mkFill(C.CHARCOAL);
  tCell.font=mkFont({bold:true,size:16,color:C.GOLD_LT});
  tCell.alignment=mkAlign('center','middle');
  for (let c=2;c<=10;c++) ws.getCell(2,c).fill=mkFill(C.CHARCOAL);

  goldLine(ws,3,2,10);
  blankRow(ws,4,8);

  // 입력 안내
  ws.getRow(5).height=20;
  ws.mergeCells(5,2,5,10);
  const noteCell=ws.getCell(5,2);
  noteCell.value='  ※ 노란색 셀 = 직접 입력  |  회색 셀 = 자동 생성  |  1순위→2순위→3순위 순서로 입력 (빈칸 가능)';
  noteCell.fill=mkFill(C.GOLD_VLT);
  noteCell.font=mkFont({size:9,color:C.CHAR_MID});
  noteCell.alignment=mkAlign('left','middle');
  for (let c=2;c<=10;c++) ws.getCell(5,c).fill=mkFill(C.GOLD_VLT);

  blankRow(ws,6,8);

  // ── 남자 섹션 ──
  ws.getRow(7).height=24;
  ws.mergeCells(7,2,7,10);
  const mSecCell=ws.getCell(7,2);
  mSecCell.value='  ▶  남자 참가자 (M1 ~ M7)';
  mSecCell.fill=mkFill(C.CHARCOAL);
  mSecCell.font=mkFont({bold:true,size:11,color:C.GOLD_LT});
  mSecCell.alignment=mkAlign('left','middle');
  for (let c=2;c<=10;c++) ws.getCell(7,c).fill=mkFill(C.CHARCOAL);

  // 헤더
  ws.getRow(8).height=22;
  const hdrs=['성별','ID','이름','나이','직업','1순위','2순위','3순위','오류 체크'];
  hdrs.forEach((h,i)=>{
    const cell=ws.getCell(8,i+2);
    cell.value=h;
    cell.fill=mkFill(C.CHAR_MID);
    cell.font=mkFont({bold:true,size:10,color:C.WHITE});
    cell.alignment=mkAlign('center','middle');
    cell.border=mkBorder();
  });

  // 남자 데이터
  const wIds=['"W1,W2,W3,W4,W5,W6,W7"'];
  males.forEach((m,i)=>{
    const row=9+i;
    ws.getRow(row).height=22;
    const choices=MC[m.id]||[];

    sc(ws,row,2,m.id.startsWith('M')?'남':'여', {fill:C.CALC,h:'center',size:10,color:C.CHAR_LT,bold:false});
    sc(ws,row,3,m.id,  {fill:C.CALC,h:'center',size:11,bold:true,color:C.CHARCOAL});
    sc(ws,row,4,m.name,{fill:C.IVORY_INP,h:'left',size:11,color:C.BLACK});
    sc(ws,row,5,m.age, {fill:C.IVORY_INP,h:'center',size:11,color:C.BLACK,numFmt:'0"세"'});
    sc(ws,row,6,m.job, {fill:C.IVORY_INP,h:'left',size:11,color:C.BLACK});
    sc(ws,row,7,choices[0]||'',{fill:C.IVORY_INP,h:'center',size:11,bold:true,color:C.CHARCOAL});
    sc(ws,row,8,choices[1]||'',{fill:C.IVORY_INP,h:'center',size:11,color:C.BLACK});
    sc(ws,row,9,choices[2]||'',{fill:C.IVORY_INP,h:'center',size:11,color:C.CHAR_MID});

    // 오류 체크 수식 (중복 체크)
    const f=`=IF(AND(G${row}<>"",G${row}=H${row}),"⚠ 2순위=3순위 중복",IF(AND(G${row}<>"",G${row}=I${row}),"⚠ 2순위=3순위 중복",IF(AND(H${row}<>"",H${row}=I${row}),"⚠ 2순위=3순위 중복",IF(AND(H${row}<>"",G${row}=""),"⚠ 1순위 없이 2순위 입력",IF(AND(I${row}<>"",H${row}=""),"⚠ 2순위 없이 3순위 입력","✓ 정상")))))`;
    const errCell=ws.getCell(row,10);
    errCell.value={formula:f};
    errCell.fill=mkFill(C.IVORY_SOFT);
    errCell.font=mkFont({size:9,color:C.CHAR_LT});
    errCell.alignment=mkAlign('left','middle');
    errCell.border=mkBorder();

    // 데이터 유효성 검사 (순위 선택)
    for (let c=7;c<=9;c++) {
      ws.getCell(row,c).dataValidation={
        type:'list', allowBlank:true, formulae:wIds,
        showErrorMessage:true,
        errorTitle:'입력 오류',
        error:`여자 참가자 ID(W1~W7)만 선택 가능합니다.`
      };
    }
  });

  blankRow(ws,16,10);

  // ── 여자 섹션 ──
  ws.getRow(17).height=24;
  ws.mergeCells(17,2,17,10);
  const wSecCell=ws.getCell(17,2);
  wSecCell.value='  ▶  여자 참가자 (W1 ~ W7)';
  wSecCell.fill=mkFill(C.CHARCOAL);
  wSecCell.font=mkFont({bold:true,size:11,color:C.GOLD_LT});
  wSecCell.alignment=mkAlign('left','middle');
  for (let c=2;c<=10;c++) ws.getCell(17,c).fill=mkFill(C.CHARCOAL);

  // 헤더
  ws.getRow(18).height=22;
  hdrs.forEach((h,i)=>{
    const cell=ws.getCell(18,i+2);
    cell.value=h;
    cell.fill=mkFill(C.CHAR_MID);
    cell.font=mkFont({bold:true,size:10,color:C.WHITE});
    cell.alignment=mkAlign('center','middle');
    cell.border=mkBorder();
  });

  const mIds=['"M1,M2,M3,M4,M5,M6,M7"'];
  females.forEach((w,i)=>{
    const row=19+i;
    ws.getRow(row).height=22;
    const choices=FC[w.id]||[];

    sc(ws,row,2,'여',         {fill:C.CALC,h:'center',size:10,color:C.CHAR_LT});
    sc(ws,row,3,w.id,         {fill:C.CALC,h:'center',size:11,bold:true,color:C.CHARCOAL});
    sc(ws,row,4,w.name,       {fill:C.IVORY_INP,h:'left',size:11,color:C.BLACK});
    sc(ws,row,5,w.age,        {fill:C.IVORY_INP,h:'center',size:11,color:C.BLACK,numFmt:'0"세"'});
    sc(ws,row,6,w.job,        {fill:C.IVORY_INP,h:'left',size:11,color:C.BLACK});
    sc(ws,row,7,choices[0]||'',{fill:C.IVORY_INP,h:'center',size:11,bold:true,color:C.CHARCOAL});
    sc(ws,row,8,choices[1]||'',{fill:C.IVORY_INP,h:'center',size:11,color:C.BLACK});
    sc(ws,row,9,choices[2]||'',{fill:C.IVORY_INP,h:'center',size:11,color:C.CHAR_MID});

    const f=`=IF(AND(G${row}<>"",G${row}=H${row}),"⚠ 2순위=3순위 중복",IF(AND(G${row}<>"",G${row}=I${row}),"⚠ 2순위=3순위 중복",IF(AND(H${row}<>"",H${row}=I${row}),"⚠ 2순위=3순위 중복",IF(AND(H${row}<>"",G${row}=""),"⚠ 1순위 없이 2순위 입력",IF(AND(I${row}<>"",H${row}=""),"⚠ 2순위 없이 3순위 입력","✓ 정상")))))`;
    const errCell=ws.getCell(row,10);
    errCell.value={formula:f};
    errCell.fill=mkFill(C.IVORY_SOFT);
    errCell.font=mkFont({size:9,color:C.CHAR_LT});
    errCell.alignment=mkAlign('left','middle');
    errCell.border=mkBorder();

    for (let c=7;c<=9;c++) {
      ws.getCell(row,c).dataValidation={
        type:'list', allowBlank:true, formulae:mIds,
        showErrorMessage:true,
        errorTitle:'입력 오류',
        error:'남자 참가자 ID(M1~M7)만 선택 가능합니다.'
      };
    }
  });

  goldLine(ws,26,2,10);
  blankRow(ws,27,12);
  ws.mergeCells(27,2,27,10);
  const noteBottom=ws.getCell(27,2);
  noteBottom.value='  ※ 이 파일의 테스트 데이터는 실제 운영 전에 삭제하세요.  (이름·나이·직업·순위 모두 교체)';
  noteBottom.fill=mkFill(C.WARN);
  noteBottom.font=mkFont({size:9,color:C.CHAR_MID});
  noteBottom.alignment=mkAlign('left','middle');
  for (let c=2;c<=10;c++) ws.getCell(27,c).fill=mkFill(C.WARN);
}

// ============================================================
// [3] 상호선택 시트
// ============================================================
function makeMutualSheet(wb) {
  const ws = wb.addWorksheet('상호선택', { views:[{ showGridLines:false }] });
  ws.getColumn(1).width=4;
  ws.getColumn(2).width=8;  // 남자ID
  ws.getColumn(3).width=8;  // 여자ID
  ws.getColumn(4).width=14; // 남→여 순위
  ws.getColumn(5).width=14; // 여→남 순위
  ws.getColumn(6).width=8;  // 남 점수
  ws.getColumn(7).width=8;  // 여 점수
  ws.getColumn(8).width=8;  // 총점
  ws.getColumn(9).width=12; // 상호선택 여부
  ws.getColumn(10).width=4;

  for (let r=1;r<=80;r++) for (let c=1;c<=11;c++) ws.getCell(r,c).fill=mkFill(C.IVORY);

  blankRow(ws,1,12);
  ws.getRow(2).height=40;
  ws.mergeCells(2,2,2,9);
  const t=ws.getCell(2,2);
  t.value='상호선택 분석';
  t.fill=mkFill(C.CHARCOAL);
  t.font=mkFont({bold:true,size:16,color:C.GOLD_LT});
  t.alignment=mkAlign('center','middle');
  for (let c=2;c<=9;c++) ws.getCell(2,c).fill=mkFill(C.CHARCOAL);

  goldLine(ws,3,2,9);
  blankRow(ws,4,8);

  // ── 섹션 A: 상호선택 후보 목록 ──
  ws.getRow(5).height=24;
  sec(ws,5,2,9,'■  상호선택 후보  (서로 선택한 쌍만 표시 — 점수 높은 순)');

  ws.getRow(6).height=22;
  const h6=['남자 ID','여자 ID','남 → 여 순위','여 → 남 순위','남 점수','여 점수','총 점수','상호선택'];
  h6.forEach((v,i)=>{ const cell=ws.getCell(6,i+2); cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE}); cell.alignment=mkAlign('center','middle'); cell.border=mkBorder(); });

  mutual.forEach((p,i)=>{
    const row=7+i;
    ws.getRow(row).height=22;
    const rowFg=C.M_GREEN;
    sc(ws,row,2,p.mId,{fill:rowFg,h:'center',bold:true,size:11,color:C.CHARCOAL});
    sc(ws,row,3,p.wId,{fill:rowFg,h:'center',bold:true,size:11,color:C.CHARCOAL});
    sc(ws,row,4,rankTxt(p.rm),{fill:rowFg,h:'center',size:11,color:C.BLACK});
    sc(ws,row,5,rankTxt(p.rw),{fill:rowFg,h:'center',size:11,color:C.BLACK});
    sc(ws,row,6,p.sm,{fill:rowFg,h:'center',size:11,bold:true,color:C.GOLD_DARK});
    sc(ws,row,7,p.sw,{fill:rowFg,h:'center',size:11,bold:true,color:C.GOLD_DARK});
    const totalCell=ws.getCell(row,8);
    totalCell.value=p.total;
    totalCell.fill=mkFill(p.total>=5?C.M_GREEN_D:rowFg);
    totalCell.font=mkFont({bold:true,size:12,color:p.total>=5?C.CHARCOAL:C.BLACK});
    totalCell.alignment=mkAlign('center','middle');
    totalCell.border=mkBorder();
    sc(ws,row,9,'✓ YES',{fill:C.M_GREEN_D,h:'center',bold:true,size:10,color:C.CHARCOAL});
  });

  const mutualEnd=7+mutual.length;
  blankRow(ws,mutualEnd,10);

  // ── 섹션 B: 전체 49 조합 분석 ──
  const secBRow=mutualEnd+1;
  ws.getRow(secBRow).height=24;
  sec(ws,secBRow,2,9,'■  전체 선택 현황  (모든 조합 — 상호선택 아닌 쌍 포함)');

  ws.getRow(secBRow+1).height=22;
  const h2=['남자 ID','여자 ID','남 → 여 순위','여 → 남 순위','남 점수','여 점수','총 점수','상호선택'];
  h2.forEach((v,i)=>{ const cell=ws.getCell(secBRow+1,i+2); cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE}); cell.alignment=mkAlign('center','middle'); cell.border=mkBorder(); });

  allPairs.forEach((p,i)=>{
    const row=secBRow+2+i;
    ws.getRow(row).height=20;
    const bg=p.mutual?C.M_GREEN:C.CALC;
    sc(ws,row,2,p.mId,{fill:bg,h:'center',size:10,bold:p.mutual,color:C.CHARCOAL});
    sc(ws,row,3,p.wId,{fill:bg,h:'center',size:10,bold:p.mutual,color:C.CHARCOAL});
    sc(ws,row,4,rankTxt(p.rm),{fill:bg,h:'center',size:10,color:p.rm?C.BLACK:C.CHAR_LT});
    sc(ws,row,5,rankTxt(p.rw),{fill:bg,h:'center',size:10,color:p.rw?C.BLACK:C.CHAR_LT});
    sc(ws,row,6,p.sm!==null?p.sm:'-',{fill:bg,h:'center',size:10,color:C.CHAR_MID});
    sc(ws,row,7,p.sw!==null?p.sw:'-',{fill:bg,h:'center',size:10,color:C.CHAR_MID});
    sc(ws,row,8,p.total!==null?p.total:'-',{fill:bg,h:'center',size:10,bold:p.mutual});
    sc(ws,row,9,p.mutual?'✓ YES':'—',{fill:p.mutual?C.M_GREEN_D:C.CALC,h:'center',size:10,bold:p.mutual,color:p.mutual?C.CHARCOAL:C.CHAR_LT});
  });
}

// ============================================================
// [4] 매칭계산 시트
// ============================================================
function makeMatchingSheet(wb) {
  const ws = wb.addWorksheet('매칭계산', { views:[{ showGridLines:false }] });
  ws.getColumn(1).width=4;
  ws.getColumn(2).width=8;
  ws.getColumn(3).width=8;
  ws.getColumn(4).width=14;
  ws.getColumn(5).width=14;
  ws.getColumn(6).width=8;
  ws.getColumn(7).width=8;
  ws.getColumn(8).width=8;
  ws.getColumn(9).width=14;
  ws.getColumn(10).width=4;

  for (let r=1;r<=60;r++) for (let c=1;c<=11;c++) ws.getCell(r,c).fill=mkFill(C.IVORY);

  blankRow(ws,1,12);
  ws.getRow(2).height=40;
  ws.mergeCells(2,2,2,9);
  const t=ws.getCell(2,2);
  t.value='최적 매칭 계산';
  t.fill=mkFill(C.CHARCOAL);
  t.font=mkFont({bold:true,size:16,color:C.GOLD_LT});
  t.alignment=mkAlign('center','middle');
  for (let c=2;c<=9;c++) ws.getCell(2,c).fill=mkFill(C.CHARCOAL);

  goldLine(ws,3,2,9);
  blankRow(ws,4,8);

  // 알고리즘 설명
  ws.getRow(5).height=20;
  ws.mergeCells(5,2,5,9);
  const algo=ws.getCell(5,2);
  algo.value='  ※ 알고리즘: 그리디 b-매칭 (상호선택 쌍을 점수 내림차순 정렬 후, 양쪽 모두 2명 미만인 경우에만 배정)';
  algo.fill=mkFill(C.GOLD_VLT);
  algo.font=mkFont({size:9,color:C.CHAR_MID});
  algo.alignment=mkAlign('left','middle');
  for (let c=2;c<=9;c++) ws.getCell(5,c).fill=mkFill(C.GOLD_VLT);

  blankRow(ws,6,8);

  // ── 섹션 A: 상호선택 후보 (점수순) ──
  ws.getRow(7).height=24;
  sec(ws,7,2,9,`■  상호선택 후보 목록  (총 ${mutual.length}쌍 — 점수 내림차순)`);

  ws.getRow(8).height=22;
  ['남자 ID','여자 ID','남 순위','여 순위','남 점수','여 점수','총 점수','매칭 배정'].forEach((v,i)=>{
    const cell=ws.getCell(8,i+2);
    cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE});
    cell.alignment=mkAlign('center','middle'); cell.border=mkBorder();
  });

  const matchedSet=new Set(matched.map(p=>`${p.mId}-${p.wId}`));
  mutual.forEach((p,i)=>{
    const row=9+i;
    ws.getRow(row).height=22;
    const isMatched=matchedSet.has(`${p.mId}-${p.wId}`);
    const bg=isMatched?C.M_GREEN_D:C.IVORY_SOFT;
    sc(ws,row,2,p.mId,{fill:bg,h:'center',bold:isMatched,size:11,color:C.CHARCOAL});
    sc(ws,row,3,p.wId,{fill:bg,h:'center',bold:isMatched,size:11,color:C.CHARCOAL});
    sc(ws,row,4,rankTxt(p.rm),{fill:bg,h:'center',size:11,color:C.BLACK});
    sc(ws,row,5,rankTxt(p.rw),{fill:bg,h:'center',size:11,color:C.BLACK});
    sc(ws,row,6,p.sm,{fill:bg,h:'center',size:11,bold:isMatched,color:C.GOLD_DARK});
    sc(ws,row,7,p.sw,{fill:bg,h:'center',size:11,bold:isMatched,color:C.GOLD_DARK});
    sc(ws,row,8,p.total,{fill:isMatched?C.M_GREEN_D:bg,h:'center',size:isMatched?12:11,bold:isMatched});
    sc(ws,row,9,isMatched?'★ 최종 매칭':'— 제외',{fill:isMatched?C.M_GREEN_D:C.CALC,h:'center',size:10,bold:isMatched,color:isMatched?C.CHARCOAL:C.CHAR_LT});
  });

  const mutualEndRow=9+mutual.length;
  blankRow(ws,mutualEndRow,10);

  // ── 섹션 B: 제외 이유 요약 ──
  const exRow=mutualEndRow+1;
  ws.getRow(exRow).height=24;
  sec(ws,exRow,2,9,'■  매칭 제외 사유  (배정 못 받은 상호선택 쌍)');

  const excluded=mutual.filter(p=>!matchedSet.has(`${p.mId}-${p.wId}`));
  if (excluded.length===0) {
    ws.getRow(exRow+1).height=22;
    ws.mergeCells(exRow+1,2,exRow+1,9);
    const none=ws.getCell(exRow+1,2);
    none.value='  모든 상호선택 쌍이 최종 매칭에 배정되었습니다.';
    none.fill=mkFill(C.M_GREEN);
    none.font=mkFont({size:10,color:C.CHARCOAL});
    none.alignment=mkAlign('left','middle');
    for (let c=2;c<=9;c++) ws.getCell(exRow+1,c).fill=mkFill(C.M_GREEN);
  } else {
    ws.getRow(exRow+1).height=22;
    ['남자 ID','여자 ID','남 순위','여 순위','총 점수','제외 이유'].forEach((v,i)=>{
      const cell=ws.getCell(exRow+1,i+2);
      cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE});
      cell.alignment=mkAlign('center','middle'); cell.border=mkBorder();
    });
    excluded.forEach((p,i)=>{
      const row=exRow+2+i;
      ws.getRow(row).height=22;
      const mFull = mMatchCnt[p.mId]>=2;
      const wFull = wMatchCnt[p.wId]>=2;
      const reason = mFull&&wFull?`${p.mId}, ${p.wId} 모두 2명 제한`:mFull?`${p.mId} 2명 제한 도달`:wFull?`${p.wId} 2명 제한 도달`:'순위 상 탈락';
      sc(ws,row,2,p.mId,{fill:C.CALC,h:'center',size:10,color:C.CHAR_MID});
      sc(ws,row,3,p.wId,{fill:C.CALC,h:'center',size:10,color:C.CHAR_MID});
      sc(ws,row,4,rankTxt(p.rm),{fill:C.CALC,h:'center',size:10,color:C.CHAR_MID});
      sc(ws,row,5,rankTxt(p.rw),{fill:C.CALC,h:'center',size:10,color:C.CHAR_MID});
      sc(ws,row,6,p.total,{fill:C.CALC,h:'center',size:10,color:C.CHAR_MID});
      ws.mergeCells(row,7,row,9);
      const rCell=ws.getCell(row,7);
      rCell.value=reason; rCell.fill=mkFill(C.WARN); rCell.font=mkFont({size:10,color:C.CHAR_MID});
      rCell.alignment=mkAlign('left','middle'); rCell.border=mkBorder();
      for (let c=7;c<=9;c++) { ws.getCell(row,c).fill=mkFill(C.WARN); ws.getCell(row,c).border=mkBorder(); }
    });
  }
}

// ============================================================
// [5] 최종결과 시트
// ============================================================
function makeFinalSheet(wb) {
  const ws = wb.addWorksheet('최종결과', { views:[{ showGridLines:false }] });
  ws.getColumn(1).width=4;
  ws.getColumn(2).width=8;
  ws.getColumn(3).width=8;
  ws.getColumn(4).width=16;
  ws.getColumn(5).width=8;
  ws.getColumn(6).width=8;
  ws.getColumn(7).width=10;

  for (let r=1;r<=60;r++) for (let c=1;c<=9;c++) ws.getCell(r,c).fill=mkFill(C.IVORY);

  blankRow(ws,1,12);
  ws.getRow(2).height=40;
  ws.mergeCells(2,2,2,7);
  const t=ws.getCell(2,2);
  t.value='최종 매칭 결과';
  t.fill=mkFill(C.CHARCOAL);
  t.font=mkFont({bold:true,size:16,color:C.GOLD_LT});
  t.alignment=mkAlign('center','middle');
  for (let c=2;c<=7;c++) ws.getCell(2,c).fill=mkFill(C.CHARCOAL);

  goldLine(ws,3,2,7);
  blankRow(ws,4,8);

  // ── 섹션 A: 최종 매칭 쌍 ──
  const totalScore=matched.reduce((s,p)=>s+p.total,0);
  ws.getRow(5).height=24;
  sec(ws,5,2,7,`■  최종 매칭 쌍  (${matched.length}쌍 / 총 점수 합계: ${totalScore}점)`);

  ws.getRow(6).height=22;
  ['남자 ID','여자 ID','순위 조합','남 점수','여 점수','총 점수'].forEach((v,i)=>{
    const cell=ws.getCell(6,i+2);
    cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE});
    cell.alignment=mkAlign('center','middle'); cell.border=mkBorder();
  });

  matched.forEach((p,i)=>{
    const row=7+i;
    ws.getRow(row).height=24;
    const bg=p.total>=5?C.M_GREEN_D:C.M_GREEN;
    sc(ws,row,2,p.mId,{fill:bg,h:'center',bold:true,size:13,color:C.CHARCOAL});
    sc(ws,row,3,p.wId,{fill:bg,h:'center',bold:true,size:13,color:C.CHARCOAL});
    sc(ws,row,4,`${p.rm}순위 ↔ ${p.rw}순위`,{fill:bg,h:'center',size:11,color:C.CHAR_MID});
    sc(ws,row,5,p.sm,{fill:bg,h:'center',size:11,bold:true,color:C.GOLD_DARK});
    sc(ws,row,6,p.sw,{fill:bg,h:'center',size:11,bold:true,color:C.GOLD_DARK});
    const tcell=ws.getCell(row,7);
    tcell.value=p.total; tcell.fill=mkFill(bg);
    tcell.font=mkFont({bold:true,size:14,color:p.total>=5?'FF006400':C.CHARCOAL});
    tcell.alignment=mkAlign('center','middle'); tcell.border=mkBorder();
  });

  const matchedEnd=7+matched.length;
  blankRow(ws,matchedEnd,10);

  // ── 섹션 B: 참가자별 매칭 요약 (남자) ──
  const sB=matchedEnd+1;
  ws.getRow(sB).height=24;
  sec(ws,sB,2,7,'■  참가자별 최종 매칭 수  — 남자');

  ws.getRow(sB+1).height=22;
  ['ID','이름','최종 매칭 수','매칭 상대'].forEach((v,i)=>{
    const cell=ws.getCell(sB+1,i+2);
    cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE});
    cell.alignment=mkAlign('center','middle'); cell.border=mkBorder();
  });

  males.forEach((m,i)=>{
    const row=sB+2+i;
    ws.getRow(row).height=22;
    const cnt=mMatchCnt[m.id];
    const partners=matched.filter(p=>p.mId===m.id).map(p=>p.wId).join(', ')||'—';
    const bg=cnt===2?C.M_GREEN_D:cnt===1?C.M_GREEN:C.IVORY_SOFT;
    sc(ws,row,2,m.id,{fill:bg,h:'center',bold:true,size:11,color:C.CHARCOAL});
    sc(ws,row,3,m.name,{fill:bg,h:'left',size:11,color:C.BLACK});
    sc(ws,row,4,`${cnt}명`,{fill:bg,h:'center',bold:cnt>0,size:12,color:cnt>0?'FF006400':C.CHAR_LT});
    ws.mergeCells(row,6,row,7);
    const pCell=ws.getCell(row,6);
    pCell.value=partners; pCell.fill=mkFill(bg); pCell.font=mkFont({size:11,bold:cnt>0,color:C.CHARCOAL});
    pCell.alignment=mkAlign('left','middle'); pCell.border=mkBorder();
    for (let c=6;c<=7;c++) { ws.getCell(row,c).fill=mkFill(bg); ws.getCell(row,c).border=mkBorder(); }
  });

  const sC=sB+2+males.length+1;
  ws.getRow(sC).height=24;
  sec(ws,sC,2,7,'■  참가자별 최종 매칭 수  — 여자');

  ws.getRow(sC+1).height=22;
  ['ID','이름','최종 매칭 수','매칭 상대'].forEach((v,i)=>{
    const cell=ws.getCell(sC+1,i+2);
    cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE});
    cell.alignment=mkAlign('center','middle'); cell.border=mkBorder();
  });

  females.forEach((w,i)=>{
    const row=sC+2+i;
    ws.getRow(row).height=22;
    const cnt=wMatchCnt[w.id];
    const partners=matched.filter(p=>p.wId===w.id).map(p=>p.mId).join(', ')||'—';
    const bg=cnt===2?C.M_GREEN_D:cnt===1?C.M_GREEN:C.IVORY_SOFT;
    sc(ws,row,2,w.id,{fill:bg,h:'center',bold:true,size:11,color:C.CHARCOAL});
    sc(ws,row,3,w.name,{fill:bg,h:'left',size:11,color:C.BLACK});
    sc(ws,row,4,`${cnt}명`,{fill:bg,h:'center',bold:cnt>0,size:12,color:cnt>0?'FF006400':C.CHAR_LT});
    ws.mergeCells(row,6,row,7);
    const pCell=ws.getCell(row,6);
    pCell.value=partners; pCell.fill=mkFill(bg); pCell.font=mkFont({size:11,bold:cnt>0,color:C.CHARCOAL});
    pCell.alignment=mkAlign('left','middle'); pCell.border=mkBorder();
    for (let c=6;c<=7;c++) { ws.getCell(row,c).fill=mkFill(bg); ws.getCell(row,c).border=mkBorder(); }
  });

  // 검증 요약
  const vRow=sC+2+females.length+2;
  ws.getRow(vRow).height=24;
  sec(ws,vRow,2,7,'■  알고리즘 검증');

  const allMutual=matched.every(p=>mutual.some(m=>m.mId===p.mId&&m.wId===p.wId));
  const maxOk=Object.values(mMatchCnt).every(v=>v<=2)&&Object.values(wMatchCnt).every(v=>v<=2);
  const checks=[
    ['모든 최종 매칭이 상호선택인가?', allMutual?'✓ 통과':'✗ 실패', allMutual?C.M_GREEN:C.RED_L],
    ['모든 참가자 최종 매칭 ≤ 2명인가?', maxOk?'✓ 통과':'✗ 실패', maxOk?C.M_GREEN:C.RED_L],
    ['총 매칭 쌍 수', `${matched.length}쌍`, C.IVORY_SOFT],
    ['총 매칭 점수 합계', `${totalScore}점`, C.IVORY_SOFT],
  ];
  checks.forEach(([label,val,bg],i)=>{
    const row=vRow+1+i;
    ws.getRow(row).height=22;
    sc(ws,row,2,label,{fill:C.IVORY_SOFT,h:'left',size:10,color:C.CHARCOAL});
    ws.mergeCells(row,3,row,7);
    const vCell=ws.getCell(row,3);
    vCell.value=val; vCell.fill=mkFill(bg); vCell.font=mkFont({bold:true,size:11,color:C.CHARCOAL});
    vCell.alignment=mkAlign('center','middle'); vCell.border=mkBorder();
    for (let c=3;c<=7;c++) { ws.getCell(row,c).fill=mkFill(bg); ws.getCell(row,c).border=mkBorder(); }
  });
}

// ============================================================
// [6] 운영자최종검토 시트
// ============================================================
function makeReviewSheet(wb) {
  const ws = wb.addWorksheet('운영자최종검토', { views:[{ showGridLines:false }] });
  ws.getColumn(1).width=3;
  ws.getColumn(2).width=8;   // 남자
  ws.getColumn(3).width=8;   // 여자
  ws.getColumn(4).width=10;  // 총점
  ws.getColumn(5).width=14;  // 순위조합
  ws.getColumn(6).width=14;  // 자동추천
  ws.getColumn(7).width=12;  // 운영자 승인
  ws.getColumn(8).width=14;  // 동의(남)
  ws.getColumn(9).width=14;  // 동의(여)
  ws.getColumn(10).width=16; // 최종 공유 상태
  ws.getColumn(11).width=24; // 메모
  ws.getColumn(12).width=3;

  for (let r=1;r<=60;r++) for (let c=1;c<=13;c++) ws.getCell(r,c).fill=mkFill(C.IVORY);

  blankRow(ws,1,12);
  ws.getRow(2).height=40;
  ws.mergeCells(2,2,2,11);
  const t=ws.getCell(2,2);
  t.value='운영자 최종 검토  &  연락처 공유 동의 관리';
  t.fill=mkFill(C.CHARCOAL);
  t.font=mkFont({bold:true,size:15,color:C.GOLD_LT});
  t.alignment=mkAlign('center','middle');
  for (let c=2;c<=11;c++) ws.getCell(2,c).fill=mkFill(C.CHARCOAL);

  goldLine(ws,3,2,11);
  blankRow(ws,4,8);

  ws.getRow(5).height=20;
  ws.mergeCells(5,2,5,11);
  const note=ws.getCell(5,2);
  note.value='  ※ 노란색 셀에만 직접 입력하세요.  운영자 승인 / 연락처 공유 동의 열에 YES 또는 NO를 입력합니다.';
  note.fill=mkFill(C.GOLD_VLT);
  note.font=mkFont({size:9,color:C.CHAR_MID});
  note.alignment=mkAlign('left','middle');
  for (let c=2;c<=11;c++) ws.getCell(5,c).fill=mkFill(C.GOLD_VLT);

  blankRow(ws,6,8);

  // 헤더
  ws.getRow(7).height=22;
  const hdrs=['남자','여자','총점','순위 조합','자동추천','운영자 승인\n(YES/NO)','연락처 동의\n남자','연락처 동의\n여자','최종 공유 상태','메모'];
  hdrs.forEach((v,i)=>{
    const cell=ws.getCell(7,i+2);
    cell.value=v; cell.fill=mkFill(C.CHAR_MID); cell.font=mkFont({bold:true,size:10,color:C.WHITE});
    cell.alignment=mkAlign('center','middle',true); cell.border=mkBorder();
  });

  matched.forEach((p,i)=>{
    const row=8+i;
    ws.getRow(row).height=26;
    sc(ws,row,2,p.mId,{fill:C.CALC,h:'center',bold:true,size:11,color:C.CHARCOAL});
    sc(ws,row,3,p.wId,{fill:C.CALC,h:'center',bold:true,size:11,color:C.CHARCOAL});
    sc(ws,row,4,p.total,{fill:C.CALC,h:'center',size:12,bold:true,color:C.GOLD_DARK});
    sc(ws,row,5,`${p.rm}순위 ↔ ${p.rw}순위`,{fill:C.CALC,h:'center',size:10,color:C.CHAR_MID});
    sc(ws,row,6,'MATCHED',{fill:C.M_GREEN_D,h:'center',bold:true,size:10,color:C.CHARCOAL});

    // 운영자 승인 (입력 셀)
    const approveCell=ws.getCell(row,7);
    approveCell.value='';
    approveCell.fill=mkFill(C.IVORY_INP);
    approveCell.font=mkFont({bold:true,size:11,color:C.CHARCOAL});
    approveCell.alignment=mkAlign('center','middle');
    approveCell.border=mkBorder('medium',C.GOLD);
    approveCell.dataValidation={type:'list',allowBlank:true,formulae:['"YES,NO"'],showDropDown:false};

    // 연락처 동의(남)
    const consMCell=ws.getCell(row,8);
    consMCell.value='';
    consMCell.fill=mkFill(C.IVORY_INP);
    consMCell.font=mkFont({bold:true,size:11,color:C.CHARCOAL});
    consMCell.alignment=mkAlign('center','middle');
    consMCell.border=mkBorder('medium',C.GOLD);
    consMCell.dataValidation={type:'list',allowBlank:true,formulae:['"YES,NO"'],showDropDown:false};

    // 연락처 동의(여)
    const consWCell=ws.getCell(row,9);
    consWCell.value='';
    consWCell.fill=mkFill(C.IVORY_INP);
    consWCell.font=mkFont({bold:true,size:11,color:C.CHARCOAL});
    consWCell.alignment=mkAlign('center','middle');
    consWCell.border=mkBorder('medium',C.GOLD);
    consWCell.dataValidation={type:'list',allowBlank:true,formulae:['"YES,NO"'],showDropDown:false};

    // 최종 공유 상태 (수식)
    const approveRef=`${colLetter(7)}${row}`;
    const mConsRef  =`${colLetter(8)}${row}`;
    const wConsRef  =`${colLetter(9)}${row}`;
    const statusF=`=IF(${approveRef}="NO","DECLINED BY OPERATOR",IF(AND(${approveRef}="YES",${mConsRef}="YES",${wConsRef}="YES"),"CONTACT SHARED",IF(AND(${approveRef}="YES",OR(${mConsRef}="NO",${wConsRef}="NO")),"ONE SIDE DECLINED",IF(${approveRef}="YES","PENDING CONSENT","MATCHED"))))`;
    const statusCell=ws.getCell(row,10);
    statusCell.value={formula:statusF};
    statusCell.fill=mkFill(C.PENDING);
    statusCell.font=mkFont({bold:true,size:10,color:C.CHARCOAL});
    statusCell.alignment=mkAlign('center','middle');
    statusCell.border=mkBorder();

    // 메모 (입력 셀)
    const memoCell=ws.getCell(row,11);
    memoCell.value='';
    memoCell.fill=mkFill(C.ADMIN);
    memoCell.font=mkFont({size:10,color:C.BLACK});
    memoCell.alignment=mkAlign('left','middle',true);
    memoCell.border=mkBorder();
  });

  const lastRow=8+matched.length;
  blankRow(ws,lastRow,10);

  // 집계 요약
  ws.getRow(lastRow+1).height=24;
  sec(ws,lastRow+1,2,11,'■  집계 요약  (아래 수치는 자동 갱신됨)');

  const summaryItems=[
    ['전체 추천 매칭 수',`${matched.length}쌍`],
    ['운영자 승인 수',{formula:`=COUNTIF(${colLetter(7)}8:${colLetter(7)}${lastRow-1},"YES")`}],
    ['양측 동의 완료',{formula:`=COUNTIFS(${colLetter(8)}8:${colLetter(8)}${lastRow-1},"YES",${colLetter(9)}8:${colLetter(9)}${lastRow-1},"YES")`}],
    ['한쪽 거절',{formula:`=COUNTIFS(${colLetter(7)}8:${colLetter(7)}${lastRow-1},"YES",OR(${colLetter(8)}8:${colLetter(8)}${lastRow-1}="NO",${colLetter(9)}8:${colLetter(9)}${lastRow-1}="NO"))`}],
  ];
  summaryItems.forEach(([label,val],i)=>{
    const row=lastRow+2+i;
    ws.getRow(row).height=22;
    sc(ws,row,2,label,{fill:C.IVORY_SOFT,h:'left',size:10,color:C.CHARCOAL});
    ws.mergeCells(row,3,row,5);
    const vCell=ws.getCell(row,3);
    vCell.value=val; vCell.fill=mkFill(C.M_GREEN); vCell.font=mkFont({bold:true,size:11,color:C.CHARCOAL});
    vCell.alignment=mkAlign('center','middle'); vCell.border=mkBorder();
    for (let c=3;c<=5;c++) { ws.getCell(row,c).fill=mkFill(C.M_GREEN); ws.getCell(row,c).border=mkBorder(); }
  });

  // 운영 지침
  const guidRow=lastRow+2+summaryItems.length+1;
  ws.getRow(guidRow).height=24;
  sec(ws,guidRow,2,11,'■  운영 지침');
  const guides=[
    '① 자동추천 결과를 검토한 후 [운영자 승인] 열에 YES 또는 NO를 입력합니다.',
    '② 운영자 승인이 YES인 쌍만 참가자에게 매칭 사실을 통보합니다.',
    '③ 참가자 양측이 연락처 공유에 동의한 경우에만 연락처를 전달합니다.',
    '④ [최종 공유 상태] 열은 자동으로 업데이트됩니다. 직접 수정하지 마세요.',
  ];
  guides.forEach((g,i)=>{
    const row=guidRow+1+i;
    ws.getRow(row).height=22;
    ws.mergeCells(row,2,row,11);
    const cell=ws.getCell(row,2);
    cell.value='  '+g; cell.fill=mkFill(C.IVORY_SOFT); cell.font=mkFont({size:10,color:C.BLACK});
    cell.alignment=mkAlign('left','middle');
    for (let c=2;c<=11;c++) { ws.getCell(row,c).fill=mkFill(C.IVORY_SOFT); ws.getCell(row,c).border=mkBorderBot(); }
  });
}

function colLetter(col) {
  return String.fromCharCode(64+col);
}

// ============================================================
// 메인: 파일 생성
// ============================================================
async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PRIME CAREER SOCIETY';
  wb.lastModifiedBy = 'Matching System';
  wb.created = new Date();
  wb.modified = new Date();

  console.log('\n시트 생성 중...');
  makeStart(wb);          console.log('  ✓ START');
  makeParticipants(wb);   console.log('  ✓ 참가자입력');
  makeMutualSheet(wb);    console.log('  ✓ 상호선택');
  makeMatchingSheet(wb);  console.log('  ✓ 매칭계산');
  makeFinalSheet(wb);     console.log('  ✓ 최종결과');
  makeReviewSheet(wb);    console.log('  ✓ 운영자최종검토');

  const outPath = path.join('D:\\2026', 'PRIME_CAREER_SOCIETY_7x7_매칭관리.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log(`\n✅ 파일 저장 완료: ${outPath}`);

  // 검증 출력
  console.log('\n============================================================');
  console.log('▶ 검증 결과');
  console.log('============================================================');
  const allMutual = matched.every(p => mutual.some(m => m.mId===p.mId && m.wId===p.wId));
  const maxOk = Object.values(mMatchCnt).every(v=>v<=2) && Object.values(wMatchCnt).every(v=>v<=2);
  console.log(`  모든 최종 매칭이 상호선택: ${allMutual ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  모든 참가자 매칭 수 ≤ 2:   ${maxOk ? '✓ PASS' : '✗ FAIL'}`);
  males.forEach(m  => console.log(`    ${m.id}(${m.name}): ${mMatchCnt[m.id]}명 → ${matched.filter(p=>p.mId===m.id).map(p=>p.wId).join(', ')||'없음'}`));
  females.forEach(w=> console.log(`    ${w.id}(${w.name}): ${wMatchCnt[w.id]}명 → ${matched.filter(p=>p.wId===w.id).map(p=>p.mId).join(', ')||'없음'}`));
  console.log(`  총 매칭 쌍: ${matched.length}쌍 / 총 점수: ${matched.reduce((s,p)=>s+p.total,0)}점`);
}

main().catch(err => { console.error('오류:', err); process.exit(1); });
