// DOM 요소 가져오기
const canvas = document.getElementById('squadCanvas');
const ctx = canvas.getContext('2d');
const formationSelect = document.getElementById('formationSelect');
const downloadButton = document.getElementById('downloadButton');
const canvasContainer = document.getElementById('canvasContainer');
const quarterSelect = document.getElementById('quarterSelect');

// 새롭게 추가된 선수 명단 관리 요소들
const newPlayerNameInput = document.getElementById('newPlayerNameInput');
const addPlayerToRosterButton = document.getElementById('addPlayerToRosterButton');
const saveSquadButton = document.getElementById('saveSquadButton'); // 스쿼드 저장 버튼
const squadSummaryBody = document.getElementById('squadSummaryBody'); // 요약 테이블 본문
const squadSummaryTable = document.querySelector('#squadSummary table'); // 헤더 클릭을 위한 테이블 요소

// Fixed personnel specific elements
const refereeSelect = document.getElementById('refereeSelect');
const filmingSelect = document.getElementById('filmingSelect');
const fixedPersonnelBox = document.getElementById('fixedPersonnelBox');

// 캔버스 크기를 부모 컨테이너에 맞춰 동적으로 설정하는 함수
function setCanvasDimensions() {
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;

    // 고정 인원 박스 위치를 캔버스 크기에 맞춰 계산 및 설정
    const originalCanvasWidth = 1200;
    const originalCanvasHeight = 750;

    const scaledX = (fixedPersonnelData.x / originalCanvasWidth) * canvasContainer.clientWidth;
    const scaledY = (fixedPersonnelData.y / originalCanvasHeight) * canvasContainer.clientHeight;

    fixedPersonnelBox.style.left = `${scaledX - fixedPersonnelBox.offsetWidth / 2}px`;
    fixedPersonnelBox.style.top = `${scaledY - fixedPersonnelBox.offsetHeight / 2}px`;
}

let players = []; // 선수 데이터 배열: { id, position, name, x, y, inputElement }
let selectedPlayer = null; // 드래그 중인 선수를 추적하는 변수
let offsetX, offsetY; // 드래그 시작 시 마우스와 요소 간의 오프셋

// 쿼터별 저장된 스쿼드를 담는 객체
// 데이터는 메모리에 저장되며, 페이지를 새로고침하면 사라집니다.
let savedSquads = {};

// 쿼터별 저장된 URL을 담는 객체
let savedUrls = {};

// 미리 정의된 선수 이름 목록 (초기값: '선택'만 포함)
const playerNames = ["선택"];

// 스쿼드 요약 테이블 정렬 상태
let currentSortColumn = 'name'; // 기본 정렬 기준은 이름
let currentSortDirection = 'asc'; // 기본 정렬 방향은 오름차순

// 고정 인원 박스의 현재 위치 데이터 (원본 캔버스 기준)
let fixedPersonnelData = {
    id: 'fixedBox', // 고유 ID
    x: 1200 * 0.85, // 우측 상단 X (중앙 기준)
    y: 750 * 0.1, // 우측 상단 Y (중앙 기준)
    element: fixedPersonnelBox // 실제 DOM 요소 참조
};

// 전술별 포지션 기본 위치 (원본 1200x750 캔버스 기준 비율)
// 이 좌표는 캔버스 컨테이너 크기에 따라 자동으로 스케일링됩니다.
const formations = {
    '4-2-3-1': { GK: { x: 0.5, y: 0.9 }, DF: [{ x: 0.12, y: 0.7 }, { x: 0.32, y: 0.75 }, { x: 0.68, y: 0.75 }, { x: 0.88, y: 0.7 }], DM: [{ x: 0.35, y: 0.55 }, { x: 0.65, y: 0.55 }], LW: { x: 0.25, y: 0.35 }, AM: { x: 0.5, y: 0.3 }, RW: { x: 0.75, y: 0.35 }, ST: { x: 0.5, y: 0.1 } },
    '4-3-3': { GK: { x: 0.5, y: 0.9 }, DF: [{ x: 0.12, y: 0.7 }, { x: 0.32, y: 0.75 }, { x: 0.68, y: 0.75 }, { x: 0.88, y: 0.7 }], CM: [{ x: 0.25, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: 0.75, y: 0.45 }], LW: { x: 0.15, y: 0.25 }, ST: { x: 0.5, y: 0.15 }, RW: { x: 0.85, y: 0.25 } },
    '3-5-2': { GK: { x: 0.5, y: 0.9 }, CB: [{ x: 0.25, y: 0.7 }, { x: 0.5, y: 0.75 }, { x: 0.75, y: 0.7 }], LM: { x: 0.15, y: 0.45 }, CM: [{ x: 0.35, y: 0.55 }, { x: 0.5, y: 0.4 }, { x: 0.65, y: 0.55 }], RM: { x: 0.85, y: 0.45 }, ST: [{ x: 0.4, y: 0.2 }, { x: 0.6, y: 0.2 }] },
    '5-3-2': { GK: { x: 0.5, y: 0.93 }, CB: [{ x: 0.1, y: 0.7 }, { x: 0.3, y: 0.72 }, { x: 0.5, y: 0.75 }, { x: 0.7, y: 0.72 }, { x: 0.9, y: 0.7 }], CM: [{ x: 0.25, y: 0.45 }, { x: 0.5, y: 0.50 }, { x: 0.75, y: 0.45 }], ST: [{ x: 0.4, y: 0.2 }, { x: 0.6, y: 0.2 }] },
    '4-4-2': { GK: { x: 0.5, y: 0.9 }, DF: [{ x: 0.12, y: 0.7 }, { x: 0.32, y: 0.75 }, { x: 0.68, y: 0.75 }, { x: 0.88, y: 0.7 }], MF: [{ x: 0.15, y: 0.45 }, { x: 0.35, y: 0.5 }, { x: 0.65, y: 0.5 }, { x: 0.85, y: 0.45 }], ST: [{ x: 0.35, y: 0.2 }, { x: 0.65, y: 0.2 }] },
    '4-1-2-3': { GK: { x: 0.5, y: 0.9 }, DF: [{ x: 0.12, y: 0.7 }, { x: 0.32, y: 0.75 }, { x: 0.68, y: 0.75 }, { x: 0.88, y: 0.7 }], DM: { x: 0.5, y: 0.55 }, CM: [{ x: 0.35, y: 0.4 }, { x: 0.65, y: 0.4 }], LW: { x: 0.15, y: 0.25 }, RW: { x: 0.85, y: 0.25 }, ST: { x: 0.5, y: 0.15 } }
};

/**
 * 축구장 필드를 캔버스에 그리는 함수
 * @param {CanvasRenderingContext2D} targetCtx - 그림을 그릴 캔버스의 2D 컨텍스트
 * @param {string} quarterText - 표시할 쿼터 텍스트 (예: "1 쿼터")
 */
function drawField(targetCtx, quarterText) {
    targetCtx.clearRect(0, 0, canvas.width, canvas.height);

    const canvasWidth = targetCtx.canvas.width;
    const canvasHeight = targetCtx.canvas.height;

    // 녹색 배경 그리기
    targetCtx.fillStyle = '#0f8017'; /* 잔디밭 색상 */
    targetCtx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 축구장 잔디 띠라인 (반투명 검은색)
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    const sidebarHeight = canvasHeight * 0.1; // 캔버스 너비의 10%
    targetCtx.fillRect(0, 0, canvasWidth, sidebarHeight);
    targetCtx.fillRect(0, (canvasHeight/6)*1, canvasWidth, sidebarHeight);
    targetCtx.fillRect(0, (canvasHeight/6)*2, canvasWidth, sidebarHeight);
    targetCtx.fillRect(0, (canvasHeight/6)*3, canvasWidth, sidebarHeight);
    targetCtx.fillRect(0, (canvasHeight/6)*4, canvasWidth, sidebarHeight);
    targetCtx.fillRect(0, (canvasHeight/6)*5, canvasWidth, sidebarHeight);
    targetCtx.fillRect(0, (canvasHeight/6)*6, canvasWidth, sidebarHeight);

    targetCtx.strokeStyle = 'white'; /* 라인 색상 */
    targetCtx.lineWidth = 6; /* 라인 두께 */
    targetCtx.beginPath();

     // 상단 아크 (센터 서클 일부) - 캔버스 크기에 비례하여 스케일링
    targetCtx.arc(canvasWidth / 2, 0, canvasWidth * 0.083, 0, Math.PI, false);

    // 페널티 박스 - 캔버스 크기에 비례하여 스케일링 및 중앙 정렬
    const pBoxWidth = canvasWidth * (500 / 1200);
    const pBoxHeight = canvasHeight * (200 / 750);
    const pBoxX = (canvasWidth - pBoxWidth) / 2;
    const pBoxY = canvasHeight * (550 / 750);
    targetCtx.strokeRect(pBoxX, pBoxY, pBoxWidth, pBoxHeight);

    // 골 에어리어 - 캔버스 크기에 비례하여 스케일링 및 중앙 정렬
    const gBoxWidth = canvasWidth * (220 / 1200);
    const gBoxHeight = canvasHeight * (80 / 750);
    const gBoxX = (canvasWidth - gBoxWidth) / 2;
    const gBoxY = canvasHeight * (670 / 750);
    targetCtx.strokeRect(gBoxX, gBoxY, gBoxWidth, gBoxHeight);

    // 페널티 아크 - 캔버스 크기에 비례하여 스케일링
    const pArcRadius = canvasWidth * (70 / 1200);
    targetCtx.moveTo(canvasWidth / 2 + pArcRadius, pBoxY); // 아크 시작점으로 이동
    targetCtx.arc(canvasWidth / 2, pBoxY, pArcRadius, 0, Math.PI, true);

    targetCtx.stroke(); /* 경로 그리기 */

    // 쿼터 텍스트 그리기
    if (quarterText) {
        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.9)'; /* 흰색, 반투명 */
        targetCtx.font = `bold ${canvasHeight * 0.04}px Arial`; /* 폰트 크기 캔버스 높이에 비례하여 스케일링 */
        targetCtx.textAlign = 'left';
        targetCtx.textBaseline = 'top';
        targetCtx.fillText(quarterText, canvasWidth * 0.016, canvasHeight * 0.026); /* 위치도 캔버스 크기에 비례 */
    }
}

// 캔버스 배경 (축구장 필드)을 다시 그리는 메인 함수
function drawBackground() {
    setCanvasDimensions(); // 캔버스 크기 업데이트
    const selectedQuarter = quarterSelect.value;
    drawField(ctx, selectedQuarter);
}

/**
 * 캔버스에 표시될 모든 선택된 이름 목록을 가져오는 헬퍼 함수입니다.
 * (자기 자신은 제외하고, 다른 드롭다운에서 선택된 이름을 확인하기 위함)
 * @param {number|string|null} excludeId - 현재 이름이 선택되고 있는 요소의 ID (플레이어 ID 또는 'refereeSelect'/'filmingSelect' 문자열)
 * @returns {string[]} 현재 캔버스에서 사용 중인 이름 목록
 */
function getAllSelectedNamesOnCanvas(excludeId = null) {
    const usedNames = new Set();

    // 필드 플레이어의 이름 추가
    players.filter(p => p.id !== excludeId && p.name !== "선택")
           .forEach(p => usedNames.add(p.name));

    // 심판 및 촬영 인원의 이름 추가 (excludeId에 따라 현재 드롭다운 제외)
    if (refereeSelect.value !== "선택" && excludeId !== 'refereeSelect') usedNames.add(refereeSelect.value);
    if (filmingSelect.value !== "선택" && excludeId !== 'filmingSelect') usedNames.add(filmingSelect.value);

    return Array.from(usedNames);
}

/**
 * 선수 이름 입력 필드 (DIV 요소)를 생성하고 컨테이너에 추가하는 함수
 * @param {object} player - 선수 데이터 객체 { id, position, name, x, y }
 */
function createPlayerInput(player) {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player-input';
    playerDiv.id = `player-${player.id}`;

    const label = document.createElement('label');
    label.textContent = player.position;
    playerDiv.appendChild(label);

    const select = document.createElement('select');
    select.className = 'player-name-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = "선택";
    defaultOption.textContent = "선택";
    select.appendChild(defaultOption);

    // 드롭다운 옵션 생성 시 현재 캔버스에서만 사용되지 않는 이름만 포함
    const selectedNamesOnCanvas = getAllSelectedNamesOnCanvas(player.id);
    playerNames
        .filter(n => n !== "선택")
        .sort((a, b) => a.localeCompare(b))
        .forEach(playerName => {
            if (!selectedNamesOnCanvas.includes(playerName) || playerName === player.name) {
                const option = document.createElement('option');
                option.value = playerName;
                option.textContent = playerName;
                select.appendChild(option);
            }
        });

    select.value = player.name || "선택";

    select.addEventListener('change', (e) => {
        player.name = e.target.value;
        renderPlayers(); // 이름 변경 후 필드 플레이어 드롭다운 목록 갱신
        populateFixedPersonnelSelects(); // 고정 인원 드롭다운도 갱신
        updateSquadSummaryTable();
    });
    playerDiv.appendChild(select);

    canvasContainer.appendChild(playerDiv);

    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    const originalCanvasWidth = 1200;
    const originalCanvasHeight = 750;

    const scaledX = (player.x / originalCanvasWidth) * containerWidth;
    const scaledY = (player.y / originalCanvasHeight) * containerHeight;

    playerDiv.style.left = `${scaledX - playerDiv.offsetWidth / 2}px`;
    playerDiv.style.top = `${scaledY - playerDiv.offsetHeight / 2}px`;

    // player 객체에 HTML 요소 참조를 저장
    player.inputElement = playerDiv;

    playerDiv.addEventListener('mousedown', (e) => {
        // 드롭다운 클릭 시에는 드래그 방지
        if (e.target.tagName === 'SELECT') {
            return;
        }
        selectedPlayer = player;
        offsetX = e.clientX - playerDiv.getBoundingClientRect().left;
        offsetY = e.clientY - playerDiv.getBoundingClientRect().top;
        playerDiv.style.cursor = 'grabbing';
        e.preventDefault();
    });

    return playerDiv;
}

// 모든 선수 이름 입력 필드를 다시 렌더링하는 함수
function renderPlayers() {
    // 필드 플레이어만 제거 및 렌더링 (고정 인원 박스는 HTML에 고정되어 있으므로 건드리지 않음)
    canvasContainer.querySelectorAll('.player-input').forEach(el => {
        if (el.id !== 'fixedPersonnelBox') { // 고정 박스 제외
            el.remove();
        }
    });
    // players 배열에서 심판/촬영 인원을 제외한 필드 플레이어만 렌더링
    players.filter(p => p.position !== '심판' && p.position !== '촬영').forEach(player => {
        createPlayerInput(player);
    });
}

/**
 * 선택된 전술에 따라 선수들을 재배치하는 함수
 * 이 함수는 이제 players 배열을 직접 수정하는 대신, 해당 전술의 플레이어 목록만 반환합니다.
 * @param {string} formation - 선택된 전술 문자열 (예: "4-2-3-1")
 * @returns {Array} 해당 전술의 기본 플레이어 목록
 */
function getFormationPlayers(formation) {
    const formationPlayers = [];
    const currentFormation = formations[formation];
    let idCounter = 0;

    const originalCanvasWidth = 1200;
    const originalCanvasHeight = 750;

    for (const positionType in currentFormation) {
        const positions = currentFormation[positionType];
        if (Array.isArray(positions)) {
            positions.forEach((pos) => {
                formationPlayers.push({ id: idCounter++, position: `${positionType}`, name: '선택', x: pos.x * originalCanvasWidth, y: pos.y * originalCanvasHeight, inputElement: null });
            });
        } else {
            formationPlayers.push({ id: idCounter++, position: positionType, name: '선택', x: positions.x * originalCanvasWidth, y: positions.y * originalCanvasHeight, inputElement: null });
        }
    }
    return formationPlayers;
}

/**
 * 심판과 촬영 인원 드롭다운 옵션을 업데이트하고 선택된 값을 설정하는 함수
 */
function populateFixedPersonnelSelects() {
    [
        { select: refereeSelect, id: 'refereeSelect' },
        { select: filmingSelect, id: 'filmingSelect' }
    ].forEach(({ select: selectElement, id: elementId }) => {
        const currentName = selectElement.value;
        const currentOptions = Array.from(selectElement.options).map(opt => opt.value);
        
        // 현재 선택된 값과 "선택" 옵션은 유지하고, 나머지 옵션만 다시 생성
        selectElement.innerHTML = '';
        selectElement.appendChild(new Option("선택", "선택"));

        // 현재 캔버스에서만 사용 중인 이름 확인 (다른 쿼터는 고려하지 않음)
        const selectedNamesOnCanvas = getAllSelectedNamesOnCanvas(elementId);

        playerNames.filter(n => n !== "선택")
            .sort((a, b) => a.localeCompare(b))
            .forEach(playerName => {
                // 현재 드롭다운의 이름이거나, 현재 캔버스에서 사용되지 않는 이름만 옵션에 포함
                if (!selectedNamesOnCanvas.includes(playerName) || playerName === currentName) {
                    selectElement.appendChild(new Option(playerName, playerName));
                }
            });
        
        // 현재 값이 "선택"이 아니고 옵션 목록에 없다면 강제로 추가
        if (currentName !== "선택" && !Array.from(selectElement.options).some(option => option.value === currentName)) {
            selectElement.appendChild(new Option(currentName, currentName));
        }
        
        selectElement.value = currentName; // Set selected value back
    });
}

/**
 * 선택된 쿼터에 따라 스쿼드를 불러오거나 기본 전술을 적용하는 통합 함수
 * @param {string} quarter - 불러오거나 적용할 쿼터 (예: "1 쿼터")
 * @param {boolean} applyCurrentFormation - true이면 현재 선택된 전술을 적용, false이면 저장된 스쿼드를 로드 (기본값)
 */
function loadOrApplySquad(quarter, applyCurrentFormation = false) {
    drawBackground();

    let newPlayersList = []; // 현재 쿼터의 필드 플레이어 목록 (심판/촬영 제외)
    let currentQuarterRefereeName = '선택'; // 현재 쿼터에 적용될 심판 이름
    let currentQuarterFilmingName = '선택'; // 현재 쿼터에 적용될 촬영 이름
    let currentFixedBoxX = fixedPersonnelData.x;
    let currentFixedBoxY = fixedPersonnelData.y;


    if (applyCurrentFormation) { // 전술 드롭다운 변경 시
        newPlayersList = getFormationPlayers(formationSelect.value);
        // 심판/촬영 이름은 현재 드롭다운에 선택된 상태를 유지
        currentQuarterRefereeName = refereeSelect.value;
        currentQuarterFilmingName = filmingSelect.value;
        // 고정 박스 위치도 현재 위치 유지
        // currentFixedBoxX, currentFixedBoxY는 이미 fixedPersonnelData에 최신 값이 있으므로 별도 할당 불필요
        console.log(`새 전술 '${formationSelect.value}'를 현재 쿼터 '${quarter}'에 적용합니다.`);

    } else if (savedSquads[quarter]) { // 쿼터 드롭다운 변경 또는 초기 로드 시 저장된 스쿼드가 있다면
        const loadedSquad = JSON.parse(JSON.stringify(savedSquads[quarter]));
        // 저장된 필드 플레이어 정보를 그대로 사용 (선수 이름과 위치 정보 모두 보존)
        newPlayersList = loadedSquad.filter(p => p.position !== '심판' && p.position !== '촬영' && p.id !== 'fixedBox');

        // 저장된 스쿼드에서 심판 및 촬영 이름 불러오기
        const loadedReferee = loadedSquad.find(p => p.position === '심판');
        const loadedFilming = loadedSquad.find(p => p.position === '촬영');
        currentQuarterRefereeName = loadedReferee ? loadedReferee.name : '선택';
        currentQuarterFilmingName = loadedFilming ? loadedFilming.name : '선택';
        
        console.log(`저장된 심판: ${currentQuarterRefereeName}, 저장된 촬영: ${currentQuarterFilmingName}`);

        // 저장된 고정 인원 박스 위치도 업데이트
        const savedFixedBoxData = loadedSquad.find(p => p.id === 'fixedBox');
        if (savedFixedBoxData) {
            currentFixedBoxX = savedFixedBoxData.x;
            currentFixedBoxY = savedFixedBoxData.y;
        }

        console.log(`'${quarter}' 스쿼드를 불러왔습니다.`);
    } else { // 저장된 스쿼드가 없고, 전술 변경이 아닌 경우 (기본 초기화)
        newPlayersList = getFormationPlayers(formationSelect.value);
        // 심판/촬영 이름은 기본값 '선택' 유지
        currentQuarterRefereeName = '선택';
        currentQuarterFilmingName = '선택';
        // 고정 박스 위치도 초기 위치로 리셋
        const originalCanvasWidth = 1200;
        const originalCanvasHeight = 750;
        currentFixedBoxX = originalCanvasWidth * 0.85;
        currentFixedBoxY = originalCanvasHeight * 0.1;
        console.log(`'${quarter}'에 저장된 스쿼드가 없어 기본 전술을 적용합니다.`);
    }

    players = newPlayersList; // 전역 players 배열 업데이트 (필드 플레이어만 포함)

    // 고정 인원 박스 데이터 업데이트 (URL 로드, 쿼터 변경, 전술 변경 등 모든 경우에 해당)
    fixedPersonnelData.x = currentFixedBoxX;
    fixedPersonnelData.y = currentFixedBoxY;

    // 드롭다운의 실제 값을 먼저 설정
    refereeSelect.value = currentQuarterRefereeName;
    filmingSelect.value = currentQuarterFilmingName;

    // 그 다음에 옵션을 다시 생성 (현재 선택된 값을 고려하여)
    populateFixedPersonnelSelects(); // 심판, 촬영 드롭다운 옵션 갱신
    renderPlayers(); // 필드 플레이어 드롭다운 (이 함수 내에서 createPlayerInput 호출)

    // 값 설정을 한 번 더 확실히 적용
    refereeSelect.value = currentQuarterRefereeName;
    filmingSelect.value = currentQuarterFilmingName;

    updateSquadSummaryTable(); // 요약 테이블 업데이트
    setCanvasDimensions(); // 고정 박스 위치 업데이트를 위해 다시 호출 (DOM에 반영)
    drawField(ctx, quarterSelect.value);
}

/**
 * 스쿼드 요약 테이블을 선수별 쿼터 포함 정보를 포함하여 업데이트하는 함수
 */
function updateSquadSummaryTable() {
    // 기존 테이블 본문 지우기
    squadSummaryBody.innerHTML = '';

    const playerSummaryData = [];
    // 모든 선수 명단을 기반으로 요약 데이터 초기화
    playerNames.forEach(name => {
        // '선택' 옵션은 요약 테이블에서 제외
        if (name !== "선택") {
            const quartersIncluded = [];
            for (const quarter in savedSquads) {
                const squad = savedSquads[quarter];
                // 스쿼드에 포함된 플레이어 중 심판/촬영 포지션이 아닌 플레이어만 카운트
                // 즉, savedSquads[quarter]에 있는 플레이어 중 name이 일치하고, 그 플레이어의 position이 '심판' 또는 '촬영'이 아닌 경우
                if (squad.some(p => p.name === name && p.position !== '심판' && p.position !== '촬영')) {
                    quartersIncluded.push(quarter);
                }
            }

            // 심판이나 촬영 인원에게 할당된 이름인지 확인
            // 이 정보는 현재 캔버스에 선택된 심판/촬영의 이름을 기준으로 판단
            const isRefereeName = (name === refereeSelect.value);
            const isFilmingName = (name === filmingSelect.value);

            // 모든 플레이어는 쿼터 정보를 포함하여 추가 (심판/촬영 역할과 관계없이)
            playerSummaryData.push({ name: name, quarters: quartersIncluded.sort(), quarterCount: quartersIncluded.length });
        }
    });

    // 현재 정렬 기준과 방향에 따라 데이터 정렬
    playerSummaryData.sort((a, b) => {
        let comparison = 0;
        if (currentSortColumn === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else if (currentSortColumn === 'quarters') {
            // 쿼터 이름 문자열로 정렬 (쿼터 수가 아닌 문자열 자체)
            comparison = a.quarters.join(', ').localeCompare(b.quarters.join(', '));
        } else if (currentSortColumn === 'quarterCount') {
            comparison = a.quarterCount - b.quarterCount;
        }
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    // 테이블 본문에 데이터 채우기
    playerSummaryData.forEach(player => {
        const row = squadSummaryBody.insertRow();
        const cellName = row.insertCell();
        const cellQuarters = row.insertCell();
        const cellQuarterCount = row.insertCell(); // 새로운 셀 추가
        const cellAction = row.insertCell(); // 작업 셀 추가

        cellName.textContent = player.name;
        cellQuarters.textContent = player.quarters.join(', '); // 쉼표로 구분하여 표시
        cellQuarterCount.textContent = player.quarterCount; // 쿼터 수 표시

        // 삭제 버튼 추가
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deletePlayerFromRoster(player.name);
        cellAction.appendChild(deleteButton);
    });
}

/**
 * 선수 명단에서 선수를 삭제하는 함수
 * @param {string} playerName - 삭제할 선수 이름
 */
function deletePlayerFromRoster(playerName) {
    // playerNames 배열에서 이름 제거
    const nameIndex = playerNames.indexOf(playerName);
    if (nameIndex > -1) {
        playerNames.splice(nameIndex, 1);
    }

    // 현재 캔버스에 있는 선수들 중 해당 이름을 가진 선수를 "선택"으로 변경
    players.forEach(p => {
        if (p.name === playerName) {
            p.name = "선택";
        }
    });

    // 저장된 모든 스쿼드에서 해당 이름을 가진 선수를 "선택"으로 변경
    for (const quarter in savedSquads) {
        savedSquads[quarter].forEach(p => {
            if (p.name === playerName) {
                p.name = "선택";
            }
        });
    }

    // 심판/촬영 드롭다운에서 해당 이름이 선택되어 있다면 "선택"으로 변경
    if (refereeSelect.value === playerName) {
        refereeSelect.value = "선택";
    }
    if (filmingSelect.value === playerName) {
        filmingSelect.value = "선택";
    }

    // UI 전체 갱신
    populateFixedPersonnelSelects(); // 고정 인원 드롭다운 갱신
    renderPlayers(); // 필드 플레이어 드롭다운 갱신
    updateSquadSummaryTable(); // 요약 테이블 갱신
    console.log(`${playerName} 선수가 명단에서 삭제되었습니다.`);
}

// 이벤트 리스너: 전술 선택 변경 시
formationSelect.addEventListener('change', (e) => {
    // 전술 변경 시에는 applyCurrentFormation을 true로 전달하여 현재 전술을 적용하도록 함
    loadOrApplySquad(quarterSelect.value, true);
});

// 이벤트 리스너: 쿼터 선택 변경 시 배경 다시 그리기 및 스쿼드 불러오기
quarterSelect.addEventListener('change', (e) => {
    // 쿼터 변경 시에는 applyCurrentFormation을 false로 전달하여 저장된 스쿼드를 로드하도록 함
    loadOrApplySquad(e.target.value, false);
});

// 이벤트 리스너: 선수 명단에 선수 추가 (새로운 선수 이름을 목록에 추가)
addPlayerToRosterButton.addEventListener('click', () => {
    const inputNames = newPlayerNameInput.value.trim();
    if (inputNames) {
        // 쉼표 또는 공백으로 분리하고 각 이름에서 공백 제거
        const namesToAdd = inputNames.split(/[, ]+/).map(name => name.trim()).filter(name => name !== '');
        let playersAdded = 0;
        let ignoredNames = [];

        namesToAdd.forEach(newName => {
            // '선택', '심판', '촬영'과 같은 특별한 이름은 명단에 추가하지 않음
            if (!playerNames.includes(newName) && newName !== '선택' && newName !== '심판' && newName !== '촬영') {
                playerNames.push(newName);
                playersAdded++;
            } else {
                ignoredNames.push(newName);
            }
        });

        // playerNames 배열 정렬 ("선택" 제외)
        const selectedOptionIndex = playerNames.indexOf("선택");
        let tempPlayerNames = [];
        if (selectedOptionIndex !== -1) {
            tempPlayerNames = playerNames.splice(selectedOptionIndex, 1); // "선택"을 일시적으로 제거
        }
        playerNames.sort((a, b) => a.localeCompare(b)); // 나머지 정렬
        if (tempPlayerNames.length > 0) {
            playerNames.unshift(tempPlayerNames[0]); // "선택"을 다시 맨 앞에 추가
        }

        newPlayerNameInput.value = ''; // 입력 필드 초기화

        // 사용자에게 추가 결과 피드백
        if (playersAdded > 0) {
            console.log(`${playersAdded}명의 선수가 명단에 추가되었습니다.`);
        }
        if (ignoredNames.length > 0) {
            console.log(`이미 명단에 있는 선수: ${ignoredNames.join(', ')} (추가되지 않음)`);
        }
        if (playersAdded === 0 && ignoredNames.length === 0) {
            console.log("추가할 유효한 선수 이름이 없습니다.");
        }

        populateFixedPersonnelSelects(); // 명단 변경 후 고정 인원 드롭다운 갱신
        renderPlayers(); // 명단 변경 후 필드 플레이어 드롭다운 갱신
        updateSquadSummaryTable(); // 명단 변경 후 요약 테이블 업데이트
    } else {
        console.log("선수 이름을 입력해주세요.");
    }
});

// 이벤트 리스너: "스쿼드 저장" 버튼
saveSquadButton.addEventListener('click', () => {
    const currentQuarter = quarterSelect.value;
    // 현재 플레이어 목록에 심판과 촬영 인원 정보를 추가하여 저장
    const squadToSave = JSON.parse(JSON.stringify(players));
    squadToSave.push({ position: '심판', name: refereeSelect.value, id: 'refereeSelect' });
    squadToSave.push({ position: '촬영', name: filmingSelect.value, id: 'filmingSelect' });
    squadToSave.push({ id: fixedPersonnelData.id, x: fixedPersonnelData.x, y: fixedPersonnelData.y, position: 'FixedBox' });

    savedSquads[currentQuarter] = squadToSave;

    // URL 생성 및 클립보드에 복사 - 모든 저장된 스쿼드 포함
    const allSquadsDataForUrl = {
        fullRoster: playerNames.filter(name => name !== "선택"), // "선택"을 제외한 전체 명단
        savedSquads: savedSquads, // 모든 저장된 스쿼드들
        selectedFormation: formationSelect.value,
        selectedQuarter: quarterSelect.value
    };
    const encodedData = encodeURIComponent(JSON.stringify(allSquadsDataForUrl));
    const shareableUrl = `${window.location.origin}${window.location.pathname}#allsquads=${encodedData}`;

    // 각 저장된 쿼터별로 해당 쿼터가 선택되는 개별 URL 생성
    Object.keys(savedSquads).forEach(quarter => {
        const quarterSpecificData = {
            fullRoster: playerNames.filter(name => name !== "선택"),
            savedSquads: savedSquads,
            selectedFormation: formationSelect.value,
            selectedQuarter: quarter // 각 쿼터별로 다른 selectedQuarter 설정
        };
        const quarterEncodedData = encodeURIComponent(JSON.stringify(quarterSpecificData));
        const quarterSpecificUrl = `${window.location.origin}${window.location.pathname}#allsquads=${quarterEncodedData}`;
        savedUrls[quarter] = quarterSpecificUrl;
    });

    try {
        const textarea = document.createElement('textarea');
        textarea.value = savedUrls[currentQuarter]; // 현재 쿼터의 URL 사용
        textarea.style.position = 'fixed'; // Avoid scrolling to bottom
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        console.log('스쿼드 URL이 클립보드에 복사되었습니다:', savedUrls[currentQuarter]);
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        // Fallback for systems where execCommand is not allowed either
        prompt('스쿼드 URL을 복사하세요 (Ctrl+C):', savedUrls[currentQuarter]);
    }

    // "저장된 쿼터" 영역 업데이트
    const quarterNumber = currentQuarter.split(' ')[0];
    const quarterStatus = document.querySelector(`.quarter-status[data-quarter="${quarterNumber}"]`);
    const quarterButtons = document.querySelector(`.quarter-buttons[data-quarter="${quarterNumber}"]`);
    
    if (quarterStatus && quarterButtons) {
        quarterStatus.textContent = '저장됨';
        quarterStatus.style.color = '#28a745';
        quarterStatus.style.fontWeight = 'bold';
        quarterButtons.style.display = 'flex';
        
        // 기존 이벤트 리스너 제거를 위해 버튼들을 다시 생성
        const openBtn = quarterButtons.querySelector('.quarter-open-btn');
        const downloadBtn = quarterButtons.querySelector('.quarter-download-btn');
        
        // 열기 버튼 이벤트
        openBtn.onclick = () => {
            window.open(shareableUrl, '_blank');
        };
        
        // 바로가기 다운로드 버튼 이벤트
        downloadBtn.onclick = () => {
            // 현재 도메인이 GitHub Pages인지 확인
            const isGitHubPages = window.location.hostname.includes('github.io');
            const actualUrl = isGitHubPages ? shareableUrl : shareableUrl.replace('file:///', 'https://free8011.github.io/');
            
            // HTML 바로가기 파일 생성
            const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=${actualUrl}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentQuarter} 스쿼드 바로가기</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background-color: #f0f0f0; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            max-width: 400px; 
            margin: 0 auto; 
        }
        a { 
            color: #007bff; 
            text-decoration: none; 
            font-size: 18px; 
            font-weight: bold; 
        }
        a:hover { 
            text-decoration: underline; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>${currentQuarter} 스쿼드</h2>
        <p>자동으로 이동하지 않으면 아래 링크를 클릭하세요:</p>
        <a href="${actualUrl}">스쿼드로 이동</a>
    </div>
</body>
</html>`;
            
            // HTML 파일 다운로드
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlFileUrl = URL.createObjectURL(htmlBlob);
            
            const link = document.createElement('a');
            link.href = htmlFileUrl;
            link.download = `${currentQuarter.replace(/\s/g, '-')}-스쿼드-바로가기.html`;
            link.click();
            
            URL.revokeObjectURL(htmlFileUrl);
            
            // 사용자에게 안내 메시지
            console.log(`${currentQuarter} 스쿼드 바로가기 HTML 파일이 다운로드되었습니다.`);
        };
    }
    updateSquadSummaryTable(); // 스쿼드 저장 후 요약 테이블 업데이트
    updateSavedQuartersUI(); // 저장된 쿼터 UI 업데이트
    // 필요에 따라 사용자에게 시각적 피드백 제공 (예: 임시 성공 메시지)
});

// 테이블 헤더 클릭 이벤트 리스너 (정렬용)
squadSummaryTable.querySelectorAll('th').forEach(header => {
    header.addEventListener('click', () => {
        const sortKey = header.dataset.sortKey;
        if (sortKey) {
            if (currentSortColumn === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortKey;
                currentSortDirection = 'asc'; // 새 열에 대해서는 기본적으로 오름차순 정렬
            }
            updateSquadSummaryTable(); // 새 정렬 기준으로 테이블 다시 렌더링
        }
    });
});

// 드래그 로직 (플레이어 박스 및 고정 박스)
document.addEventListener('mousemove', (e) => {
    if (selectedPlayer && selectedPlayer.id === 'fixedBox') {
        const containerRect = canvasContainer.getBoundingClientRect();
        const element = selectedPlayer.element;

        const originalCanvasWidth = 1200;
        const originalCanvasHeight = 750;

        const currentScaleX = containerRect.width / originalCanvasWidth;
        const currentScaleY = containerRect.height / originalCanvasHeight;

        let newX = e.clientX - containerRect.left - offsetX;
        let newY = e.clientY - containerRect.top - offsetY;

        newX = Math.max(0, Math.min(newX, containerRect.width - element.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - element.offsetHeight));

        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;

        // Update fixedPersonnelData's x and y based on current scaled position
        fixedPersonnelData.x = (newX + element.offsetWidth / 2) / currentScaleX;
        fixedPersonnelData.y = (newY + element.offsetHeight / 2) / currentScaleY;

    } else if (selectedPlayer && selectedPlayer.inputElement) { // 일반 플레이어 드래그 로직
         const containerRect = canvasContainer.getBoundingClientRect();
        const playerElement = selectedPlayer.inputElement;

        const originalCanvasWidth = 1200;
        const originalCanvasHeight = 750;

        const currentScaleX = containerRect.width / originalCanvasWidth;
        const currentScaleY = containerRect.height / originalCanvasHeight;

        let newX = e.clientX - containerRect.left - offsetX;
        let newY = e.clientY - containerRect.top - offsetY;

        newX = Math.max(0, Math.min(newX, containerRect.width - playerElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - playerElement.offsetHeight));

        playerElement.style.left = `${newX}px`;
        playerElement.style.top = `${newY}px`;

        selectedPlayer.x = (newX + playerElement.offsetWidth / 2) / currentScaleX;
        selectedPlayer.y = (newY + playerElement.offsetHeight / 2) / currentScaleY;
    }
});

document.addEventListener('mouseup', () => {
    if (selectedPlayer) {
        if (selectedPlayer.id === 'fixedBox') {
            selectedPlayer.element.style.cursor = 'grab';
        } else {
            selectedPlayer.inputElement.style.cursor = 'grab'; // 커서 원래대로
        }
    }
    selectedPlayer = null;
});

// 고정 인원 박스 자체에 드래그 이벤트 리스너 추가
fixedPersonnelBox.addEventListener('mousedown', (e) => {
    // 드롭다운 클릭 시에는 드래그 방지
    if (e.target.tagName === 'SELECT') {
        return;
    }
    selectedPlayer = fixedPersonnelData; // selectedPlayer를 fixedPersonnelData 객체로 설정
    offsetX = e.clientX - fixedPersonnelBox.getBoundingClientRect().left;
    offsetY = e.clientY - fixedPersonnelBox.getBoundingClientRect().top;
    fixedPersonnelBox.style.cursor = 'grabbing';
    e.preventDefault();
});

// 심판/촬영 드롭다운 변경 시 UI 업데이트
refereeSelect.addEventListener('change', () => {
    // 상대방(촬영) 드롭다운부터 먼저 업데이트
    setTimeout(() => {
        populateFixedPersonnelSelects();
        renderPlayers();
        updateSquadSummaryTable();
    }, 0);
});

filmingSelect.addEventListener('change', () => {
    // 상대방(심판) 드롭다운부터 먼저 업데이트  
    setTimeout(() => {
        populateFixedPersonnelSelects();
        renderPlayers();
        updateSquadSummaryTable();
    }, 0);
});

// 창 크기 변경 시
window.addEventListener('resize', () => {
    setCanvasDimensions(); // 캔버스 크기 먼저 설정
    const selectedQuarter = quarterSelect.value;
    drawField(ctx, selectedQuarter); // 축구장 다시 그리기
    renderPlayers(); // 필드 플레이어만 재렌더링하여 위치 업데이트
    populateFixedPersonnelSelects(); // 드롭다운 옵션도 갱신
    updateSquadSummaryTable();
});

// PNG 다운로드 버튼 클릭 시
downloadButton.addEventListener('click', () => {
    html2canvas(canvasContainer, {
        useCORS: true,
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        const fileName = `${quarterSelect.value.replace(/\s/g, '-')}.png`;
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(error => {
        console.error("캔버스 캡처 중 오류 발생:", error);
    });
});

/**
 * URL에서 스쿼드 데이터를 로드하는 함수
 * @returns {boolean} 데이터 로드 성공 여부
 */
function loadSquadFromUrl() {
    try {
        const hash = window.location.hash;
        
        // 새로운 형식: 모든 스쿼드 포함
        if (hash.startsWith('#allsquads=')) {
            const encodedData = hash.substring('#allsquads='.length);
            const allSquadsData = JSON.parse(decodeURIComponent(encodedData));

            // 1. 전체 명단 복원
            if (allSquadsData.fullRoster && Array.isArray(allSquadsData.fullRoster)) {
                playerNames.length = 0;
                playerNames.push("선택");
                allSquadsData.fullRoster.forEach(name => {
                    if (!playerNames.includes(name)) {
                        playerNames.push(name);
                    }
                });
                // '선택'을 제외하고 나머지 이름을 정렬
                const selectOption = playerNames.shift();
                playerNames.sort((a, b) => a.localeCompare(b));
                playerNames.unshift(selectOption);
            }

            // 2. 모든 저장된 스쿼드들 복원
            if (allSquadsData.savedSquads) {
                Object.assign(savedSquads, allSquadsData.savedSquads);
            }

            // 3. 각 저장된 쿼터별로 해당 쿼터가 선택되는 개별 URL 생성
            Object.keys(savedSquads).forEach(quarter => {
                const quarterSpecificData = {
                    fullRoster: allSquadsData.fullRoster,
                    savedSquads: savedSquads,
                    selectedFormation: allSquadsData.selectedFormation,
                    selectedQuarter: quarter // 각 쿼터별로 다른 selectedQuarter 설정
                };
                const quarterEncodedData = encodeURIComponent(JSON.stringify(quarterSpecificData));
                const quarterSpecificUrl = `${window.location.origin}${window.location.pathname}#allsquads=${quarterEncodedData}`;
                savedUrls[quarter] = quarterSpecificUrl;
            });

            // 4. 선택된 쿼터로 이동
            const selectedQuarter = allSquadsData.selectedQuarter || quarterSelect.options[0].value;
            quarterSelect.value = selectedQuarter;
            formationSelect.value = allSquadsData.selectedFormation || formationSelect.options[0].value;

            // 5. 선택된 쿼터의 스쿼드 로드
            loadOrApplySquad(selectedQuarter, false);

            console.log('URL에서 모든 스쿼드 데이터를 성공적으로 불러왔습니다.');
            return true;
        }
        // 기존 형식: 단일 스쿼드 (하위 호환성)
        else if (hash.startsWith('#squad=')) {
            const encodedData = hash.substring('#squad='.length);
            const squadData = JSON.parse(decodeURIComponent(encodedData));

            // 1. URL의 fullRoster로 playerNames 배열을 먼저 채웁니다.
            if (squadData.fullRoster && Array.isArray(squadData.fullRoster)) {
                playerNames.length = 0;
                playerNames.push("선택");
                squadData.fullRoster.forEach(name => {
                    if (!playerNames.includes(name)) {
                        playerNames.push(name);
                    }
                });
                // '선택'을 제외하고 나머지 이름을 정렬합니다.
                const selectOption = playerNames.shift();
                playerNames.sort((a, b) => a.localeCompare(b));
                playerNames.unshift(selectOption);
            } else {
                // 이전 버전 URL과의 호환성을 위한 폴백(fallback) 로직
                const newNamesFromUrl = new Set(squadData.fieldPlayers.map(p => p.name).filter(n => n !== '선택'));
                if (squadData.referee && squadData.referee.name && squadData.referee.name !== '선택') newNamesFromUrl.add(squadData.referee.name);
                if (squadData.filming && squadData.filming.name && squadData.filming.name !== '선택') newNamesFromUrl.add(squadData.filming.name);
                newNamesFromUrl.forEach(name => {
                    if (!playerNames.includes(name)) {
                        playerNames.push(name);
                    }
                });
            }

            // 2. JS 변수에 스쿼드 데이터를 설정합니다.
            players = squadData.fieldPlayers;
            formationSelect.value = squadData.selectedFormation || formationSelect.options[0].value;
            quarterSelect.value = squadData.selectedQuarter || quarterSelect.options[0].value;
            if (squadData.fixedBox) {
                fixedPersonnelData.x = squadData.fixedBox.x;
                fixedPersonnelData.y = squadData.fixedBox.y;
            }

            // 3. 데이터를 바탕으로 화면의 드롭다운 UI를 먼저 생성합니다.
            populateFixedPersonnelSelects();
            renderPlayers();

            // 4. 드롭다운 UI가 준비된 후, 저장된 값으로 설정합니다.
            refereeSelect.value = squadData.referee ? squadData.referee.name : '선택';
            filmingSelect.value = squadData.filming ? squadData.filming.name : '선택';

            // 5. 나머지 UI를 업데이트합니다.
            updateSquadSummaryTable();
            setCanvasDimensions();

            // 6. 불러온 스쿼드를 현재 세션을 위해 savedSquads에 저장합니다.
            const currentQuarter = quarterSelect.value;
            const squadToSaveToMemory = JSON.parse(JSON.stringify(squadData.fieldPlayers));
            squadToSaveToMemory.push({ position: '심판', name: squadData.referee.name, id: 'refereeSelect' });
            squadToSaveToMemory.push({ position: '촬영', name: squadData.filming.name, id: 'filmingSelect' });
            squadToSaveToMemory.push({ id: 'fixedBox', x: fixedPersonnelData.x, y: fixedPersonnelData.y, position: 'FixedBox' });
            savedSquads[currentQuarter] = squadToSaveToMemory;

            console.log('URL에서 스쿼드 데이터를 성공적으로 불러왔습니다.');
            return true;
        }
    } catch (error) {
        console.error('URL에서 스쿼드 데이터 로드/파싱 실패:', error);
    }
    return false;
}

// 초기 앱 로드 시 실행되는 함수들
drawBackground(); // 캔버스 배경 먼저 그리기
setCanvasDimensions(); // 캔버스 크기 먼저 설정

// 저장된 쿼터 UI 업데이트 함수
function updateSavedQuartersUI() {
    Object.keys(savedUrls).forEach(quarter => {
        const quarterNumber = quarter.split(' ')[0];
        const quarterStatus = document.querySelector(`.quarter-status[data-quarter="${quarterNumber}"]`);
        const quarterButtons = document.querySelector(`.quarter-buttons[data-quarter="${quarterNumber}"]`);
        
        if (quarterStatus && quarterButtons && savedUrls[quarter]) {
            quarterStatus.textContent = '저장됨';
            quarterStatus.style.color = '#28a745';
            quarterStatus.style.fontWeight = 'bold';
            quarterButtons.style.display = 'flex';
            
            const openBtn = quarterButtons.querySelector('.quarter-open-btn');
            const downloadBtn = quarterButtons.querySelector('.quarter-download-btn');
            
            openBtn.onclick = () => {
                window.open(savedUrls[quarter], '_blank');
            };
            
            downloadBtn.onclick = () => {
                // 현재 도메인이 GitHub Pages인지 확인
                const isGitHubPages = window.location.hostname.includes('github.io');
                const actualUrl = isGitHubPages ? savedUrls[quarter] : savedUrls[quarter].replace('file:///', 'https://free8011.github.io/');
                
                // HTML 바로가기 파일 생성
                const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=${actualUrl}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${quarter} 스쿼드 바로가기</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background-color: #f0f0f0; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            max-width: 400px; 
            margin: 0 auto; 
        }
        a { 
            color: #007bff; 
            text-decoration: none; 
            font-size: 18px; 
            font-weight: bold; 
        }
        a:hover { 
            text-decoration: underline; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>${quarter} 스쿼드</h2>
        <p>자동으로 이동하지 않으면 아래 링크를 클릭하세요:</p>
        <a href="${actualUrl}">스쿼드로 이동</a>
    </div>
</body>
</html>`;
                
                // HTML 파일 다운로드
                const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                const htmlFileUrl = URL.createObjectURL(htmlBlob);
                
                const link = document.createElement('a');
                link.href = htmlFileUrl;
                link.download = `${quarter.replace(/\s/g, '-')}-스쿼드-바로가기.html`;
                link.click();
                
                URL.revokeObjectURL(htmlFileUrl);
                
                // 사용자에게 안내 메시지
                console.log(`${quarter} 스쿼드 바로가기 HTML 파일이 다운로드되었습니다.`);
            };
        }
    });
}

// URL에서 스쿼드 데이터 로드 시도
const loadedFromUrl = loadSquadFromUrl();

// URL에서 로드되지 않았다면, 현재 쿼터의 기본 전술을 적용
if (!loadedFromUrl) {
    loadOrApplySquad(quarterSelect.value);
} else {
    // URL에서 로드되었다면, UI를 다시 렌더링하고 요약 테이블 업데이트
    // loadSquadFromUrl에서 이미 값을 설정했으므로 여기서 다시 로드할 필요 없음.
    // 대신 UI 업데이트 함수들을 직접 호출
    populateFixedPersonnelSelects();
    renderPlayers();
    updateSquadSummaryTable();
    setCanvasDimensions(); // 위치 재설정
    drawBackground();
}

// 저장된 쿼터 UI 업데이트 (URL 로드 여부와 관계없이 항상 마지막에 실행)
updateSavedQuartersUI();
