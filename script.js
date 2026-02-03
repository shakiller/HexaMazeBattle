const COST = {
    move: 1,
    placeAdjacent: 2,
    placeAnywhere: 4,
    replaceAdjacent: 5,
    replace: 6
};

const state = {
    board: [],
    rows: 9,
    cols: 9,
    hexSize: 55,
    hexGapH: -3,
    hexGapV: -19,
    players: [
        { row: 0, col: 0, hasFlag: false },
        { row: 0, col: 8, hasFlag: false }
    ],
    currentPlayer: 0,
    numPlayers: 1,
    points: 0,
    gameMode: 'simple',
    phase: 'roll',
    selectedAction: null,
    selectedCell: null,
    nextTileType: 0,
    nextTileRotation: 0,
    startPos: [{ row: 0, col: 0 }, { row: 0, col: 8 }],
    finishPos: [{ row: 8, col: 8 }, { row: 8, col: 0 }],
    lastTilePlacement: null,
    aiOpponent: false,
    aiDifficulty: 'medium',
    gameModeType: 'single' // 'single', 'bot', 'online'
};

// Цвета игроков
const PLAYER_COLORS = [
    { // Игрок 1
        primary: '#3b82f6',
        light: '#60a5fa',
        dark: '#1d4ed8',
        text: '#ffffff'
    },
    { // Игрок 2
        primary: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
        text: '#ffffff'
    }
];

// Tile types: each has edges array showing which sides have openings
// Edges: 0=top, 1=top-right, 2=bottom-right, 3=bottom, 4=bottom-left, 5=top-left
const TILE_TYPES = [
    [0, 3],       // Straight vertical
    [1, 4],       // Straight diagonal /
    [2, 5],       // Straight diagonal \
    [0, 1],       // Turn top to top-right
    [0, 2],       // Wide turn
    [1, 2],       // Turn right side
    [3, 4],       // Turn bottom
    [0, 1, 3],    // T-junction
    [0, 2, 4],    // Y-junction
];

function rotateEdges(edges, rotation) {
    const r = ((rotation % 6) + 6) % 6;
    return edges.map(edge => (edge + r) % 6);
}

// Функция для определения, какие ячейки нужно скрыть для симметричного поля
function shouldDisplayCell(row, col) {
    const lastRow = state.rows - 1;
    
    if (state.rows % 2 === 1) {
        if (row === lastRow && col % 2 === 1) {
            return false;
        }
    }
    
    if (state.rows % 2 === 0) {
        if (row === lastRow && col % 2 === 1) {
            return false;
        }
    }
    
    if (state.rows <= 3 && state.cols > 4) {
        if (row === 0 && (col === 0 || col === state.cols - 1)) return false;
        if (row === lastRow && (col === 0 || col === state.cols - 1)) return false;
    }
    
    return true;
}

// Находим угловые ячейки
function findCornerCells() {
    const corners = {
        topLeft: null,
        topRight: null,
        bottomLeft: null,
        bottomRight: null
    };

    for (let c = 0; c < state.cols; c++) {
        if (state.board[0][c].shouldDisplay) {
            corners.topLeft = { row: 0, col: c };
            break;
        }
    }

    for (let c = state.cols - 1; c >= 0; c--) {
        if (state.board[0][c].shouldDisplay) {
            corners.topRight = { row: 0, col: c };
            break;
        }
    }

    for (let c = 0; c < state.cols; c++) {
        if (state.board[state.rows - 1][c].shouldDisplay) {
            corners.bottomLeft = { row: state.rows - 1, col: c };
            break;
        }
    }

    for (let c = state.cols - 1; c >= 0; c--) {
        if (state.board[state.rows - 1][c].shouldDisplay) {
            corners.bottomRight = { row: state.rows - 1, col: c };
            break;
        }
    }

    return corners;
}

// Hex grid positioning - flat-top hexagon layout with separate horizontal and vertical gaps
function getHexPosition(row, col) {
    const size = state.hexSize;
    const gapH = state.hexGapH;
    const gapV = state.hexGapV;
    const w = size;
    const h = size * 1.1547;
    
    const horizDist = w * 0.75 + gapH;
    const vertDist = h + gapV;
    
    const x = col * horizDist;
    const y = row * vertDist + (col % 2 === 1 ? vertDist * 0.5 : 0);
    
    return { x, y };
}

// Get center point of an edge for drawing paths
function getEdgePoint(edge, radius = 38) {
    const angles = [
        -90,   // 0: top
        -30,   // 1: top-right
        30,    // 2: bottom-right
        90,    // 3: bottom
        150,   // 4: bottom-left
        210    // 5: top-left
    ];
    const angle = angles[edge] * Math.PI / 180;
    return {
        x: 50 + radius * Math.cos(angle),
        y: 57.7 + radius * Math.sin(angle)
    };
}

function createTileSVG(tileType, rotation, startForPlayer, finishForPlayer, isEmpty, row, col) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push(`${50 + 46 * Math.cos(angle)},${57.7 + 46 * Math.sin(angle)}`);
    }
    const hexPoints = points.join(' ');

    let fillColor = isEmpty ? '#1a2332' : '#1e3a5f';
    let strokeColor = isEmpty ? '#334155' : '#0ea5e9';
    let textColor = '#ffffff';

    const isStart = startForPlayer !== -1;
    const isFinish = finishForPlayer !== -1;

    if (isStart) {
        const playerColor = PLAYER_COLORS[startForPlayer];
        fillColor = playerColor.primary;
        strokeColor = playerColor.dark;
        textColor = playerColor.text;
    }
    if (isFinish) {
        const playerColor = PLAYER_COLORS[finishForPlayer];
        fillColor = playerColor.light;
        strokeColor = playerColor.dark;
        textColor = playerColor.text;
    }

    let svg = `<svg viewBox="0 0 100 115.4" xmlns="http://www.w3.org/2000/svg">
    <polygon points="${hexPoints}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5"/>`;

    if (!isEmpty && tileType !== null) {
        const edges = rotateEdges(TILE_TYPES[tileType], rotation);
        const cx = 50, cy = 57.7;
        
        const pathRadius = 38;
        const angles = [-90, -30, 30, 90, 150, 210].map(deg => deg * Math.PI / 180);
        
        edges.forEach(edge => {
            const angle = angles[edge];
            const startRadius = 12;
            const endRadius = pathRadius;
            
            const x1 = cx + startRadius * Math.cos(angle);
            const y1 = cy + startRadius * Math.sin(angle);
            const x2 = cx + endRadius * Math.cos(angle);
            const y2 = cy + endRadius * Math.sin(angle);
            
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                    stroke="#fbbf24" stroke-width="12" stroke-linecap="butt"/>`;
        });

        svg += `<circle cx="${cx}" cy="${cy}" r="8" fill="#fbbf24"/>`;
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#fef3c7"/>`;
        svg += `<circle cx="${cx}" cy="${cy}" r="2" fill="#ffffff" opacity="0.5"/>`;
    }

    if (isStart) {
        const playerNum = startForPlayer + 1;
        const playerColor = PLAYER_COLORS[startForPlayer];
        
        svg += `<circle cx="50" cy="57.7" r="20" fill="${playerColor.primary}" opacity="0.7"/>`;
        svg += `<text x="50" y="62" text-anchor="middle" fill="${playerColor.text}" font-size="10" font-weight="bold" font-family="sans-serif">СТАРТ${playerNum}</text>`;
        svg += `<circle cx="50" cy="45" r="6" fill="${playerColor.text}"/>`;
    }
    if (isFinish) {
        const playerNum = finishForPlayer + 1;
        const playerColor = PLAYER_COLORS[finishForPlayer];
        
        svg += `<circle cx="50" cy="57.7" r="20" fill="${playerColor.light}" opacity="0.7"/>`;
        svg += `<text x="50" y="55" text-anchor="middle" fill="${playerColor.text}" font-size="10" font-weight="bold" font-family="sans-serif">ФИНИШ${playerNum}</text>`;
        
        if (state.gameMode === 'flag') {
            svg += `<text x="50" y="78" text-anchor="middle" font-size="16">🚩</text>`;
        }
        
        svg += `<path d="M47,45 L53,45 L53,50 L50,48 L47,50 Z" fill="${playerColor.text}"/>`;
    }

    if (isStart && isFinish && startForPlayer === finishForPlayer) {
        const playerNum = startForPlayer + 1;
        const playerColor = PLAYER_COLORS[startForPlayer];
        
        svg += `<circle cx="50" cy="57.7" r="20" fill="${playerColor.primary}" opacity="0.7"/>`;
        svg += `<text x="50" y="55" text-anchor="middle" fill="${playerColor.text}" font-size="8" font-weight="bold" font-family="sans-serif">СТАРТ/ФИНИШ${playerNum}</text>`;
    }

    svg += '</svg>';
    return svg;
}

function initBoard() {
    document.documentElement.style.setProperty('--hex-size', state.hexSize + 'px');
    document.documentElement.style.setProperty('--hex-gap-h', state.hexGapH + 'px');
    document.documentElement.style.setProperty('--hex-gap-v', state.hexGapV + 'px');

    state.board = [];
    for (let r = 0; r < state.rows; r++) {
        const row = [];
        for (let c = 0; c < state.cols; c++) {
            const shouldDisplay = shouldDisplayCell(r, c);
            row.push({
                tileType: null,
                rotation: 0,
                isEmpty: true,
                startForPlayer: -1,
                finishForPlayer: -1,
                shouldDisplay
            });
        }
        state.board.push(row);
    }

    const corners = findCornerCells();

    if (state.numPlayers === 1) {
        state.startPos[0] = corners.topLeft || { row: 0, col: 0 };
        state.finishPos[0] = corners.bottomRight || { row: state.rows - 1, col: state.cols - 1 };
    } else {
        state.startPos[0] = corners.topLeft || { row: 0, col: 0 };
        state.finishPos[0] = corners.bottomRight || { row: state.rows - 1, col: state.cols - 1 };
        state.startPos[1] = corners.topRight || { row: 0, col: state.cols - 1 };
        state.finishPos[1] = corners.bottomLeft || { row: state.rows - 1, col: 0 };
    }

    for (let p = 0; p < state.numPlayers; p++) {
        const start = state.startPos[p];
        const finish = state.finishPos[p];
        
        if (start && state.board[start.row] && state.board[start.row][start.col]) {
            state.board[start.row][start.col].startForPlayer = p;
            state.board[start.row][start.col].isEmpty = false;
            state.board[start.row][start.col].tileType = 0;
        }
        
        if (finish && state.board[finish.row] && state.board[finish.row][finish.col]) {
            state.board[finish.row][finish.col].finishForPlayer = p;
            state.board[finish.row][finish.col].isEmpty = false;
            state.board[finish.row][finish.col].tileType = 0;
        }
    }

    state.players = [];
    for (let p = 0; p < state.numPlayers; p++) {
        state.players.push({
            row: state.startPos[p].row,
            col: state.startPos[p].col,
            hasFlag: false
        });
    }

    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;

    state.currentPlayer = 0;
    state.phase = 'roll';
    state.points = 0;
    state.selectedAction = null;
    state.selectedCell = null;
    state.lastTilePlacement = null;

    renderBoard();
    renderNextTile();
    updateUI();
    
    if (state.aiOpponent && state.currentPlayer === 1) {
        updateStatus('Ход ИИ...');
        // Проверяем, что функция aiTurn доступна
        if (typeof aiTurn === 'function') {
            setTimeout(aiTurn, 1000);
        } else if (typeof startAiTurn === 'function') {
            setTimeout(startAiTurn, 1000);
        } else {
            updateStatus('Ошибка: функции ИИ не загружены');
        }
    } else {
        updateStatus('Бросьте кубик, чтобы получить очки!');
    }
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    let maxX = 0, maxY = 0;
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (!state.board[r][c].shouldDisplay) continue;
            const pos = getHexPosition(r, c);
            maxX = Math.max(maxX, pos.x + state.hexSize + 10);
            maxY = Math.max(maxY, pos.y + state.hexSize * 1.1547 + 10);
        }
    }
    boardEl.style.width = maxX + 'px';
    boardEl.style.height = maxY + 'px';

    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const cell = state.board[r][c];
            
            if (!cell.shouldDisplay) continue;

            const pos = getHexPosition(r, c);

            const cellEl = document.createElement('div');
            cellEl.className = 'hex-cell';
            cellEl.style.left = pos.x + 'px';
            cellEl.style.top = pos.y + 'px';
            cellEl.dataset.row = r;
            cellEl.dataset.col = c;

            cellEl.innerHTML = createTileSVG(
                cell.tileType,
                cell.rotation,
                cell.startForPlayer,
                cell.finishForPlayer,
                cell.isEmpty,
                r, c
            );

            const labelEl = document.createElement('div');
            labelEl.className = 'hex-cell-label';
            labelEl.textContent = `${r},${c}`;
            cellEl.appendChild(labelEl);

            if (cell.isEmpty) {
                cellEl.classList.add('empty-cell');
            }

            // Всегда разрешаем кликать на клетки
            cellEl.addEventListener('click', () => handleCellClick(r, c));

            for (let p = 0; p < state.numPlayers; p++) {
                if (state.players[p].row === r && state.players[p].col === c) {
                    const token = document.createElement('div');
                    token.className = `player-token p${p + 1}`;
                    if (state.players[p].hasFlag) token.classList.add('has-flag');
                    if (p === state.currentPlayer) token.classList.add('current-turn');
                    if (state.aiOpponent && p === 1) token.classList.add('ai-token');
                    cellEl.appendChild(token);
                }
            }

            boardEl.appendChild(cellEl);
        }
    }
}

function renderNextTile() {
    const el = document.getElementById('next-tile');
    el.innerHTML = createTileSVG(state.nextTileType, state.nextTileRotation, -1, -1, false, -1, -1);
}

function rotateNextTile(dir) {
    state.nextTileRotation = ((state.nextTileRotation + dir) % 6 + 6) % 6;
    renderNextTile();
}

function rollDice() {
    if (state.phase !== 'roll') return;

    const diceEl = document.getElementById('dice');
    diceEl.classList.add('rolling');

    let rolls = 0;
    const rollInterval = setInterval(() => {
        // Показываем случайное число от 1 до 6 во время анимации
        diceEl.textContent = Math.floor(Math.random() * 6) + 1;
        rolls++;
        if (rolls > 12) {
            clearInterval(rollInterval);
            // Генерируем финальное значение от 1 до 6
            const value = Math.floor(Math.random() * 6) + 1;
            state.points = value;
            diceEl.textContent = value;
            diceEl.classList.remove('rolling');
            
            // Логируем для отладки
            if (state.aiOpponent && state.currentPlayer === 1) {
                console.log(`🎲 ИИ выбросил: ${value} очков`);
            }

            state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
            state.nextTileRotation = 0;
            renderNextTile();

            state.phase = 'action';
            updateUI();
            
            if (state.aiOpponent && state.currentPlayer === 1) {
                updateStatus(`🎲 ИИ выбросил ${value}! ИИ думает...`);
                // НЕ вызываем aiTurn здесь, так как он уже будет вызван из aiTurn() после завершения анимации
                // Это предотвращает двойной вызов
            } else {
                updateStatus(`Выпало ${value}! Кликните на пустую клетку чтобы разместить тайл, или выберите действие.`);
            }
        }
    }, 50);
}

function updateUI() {
    document.getElementById('points-value').textContent = state.points;

    const diceEl = document.getElementById('dice');
    const rollBtn = document.getElementById('roll-btn');

    if (state.phase === 'roll') {
        diceEl.classList.remove('disabled');
        rollBtn.disabled = false;
    } else {
        diceEl.classList.add('disabled');
        rollBtn.disabled = true;
    }

    const player = state.players[state.currentPlayer];

    // Не блокируем кнопки для игрока, только для ИИ
    const isAiTurn = state.aiOpponent && state.currentPlayer === 1;
    
    document.getElementById('btn-move').disabled =
        state.phase !== 'action' || state.points < COST.move || !canMoveAnywhere(player) || isAiTurn;

    document.getElementById('btn-place-adj').disabled =
        state.phase !== 'action' || state.points < COST.placeAdjacent || !hasAdjacentEmpty(player) || isAiTurn;

    document.getElementById('btn-place-any').disabled =
        state.phase !== 'action' || state.points < COST.placeAnywhere || !hasAnyEmpty() || isAiTurn;

    document.getElementById('btn-replace-adj').disabled =
        state.phase !== 'action' || state.points < COST.replaceAdjacent || !hasAdjacentReplaceable() || isAiTurn;

    document.getElementById('btn-replace').disabled =
        state.phase !== 'action' || state.points < COST.replace || !hasReplaceable() || isAiTurn;

    document.getElementById('btn-end').disabled = state.phase !== 'action' || isAiTurn;
    
    document.getElementById('btn-undo').disabled = 
        state.phase !== 'action' || state.lastTilePlacement === null || isAiTurn;

    document.getElementById('player1-section').classList.toggle('active', state.currentPlayer === 0);
    document.getElementById('player2-section').classList.toggle('active', state.currentPlayer === 1);
    document.getElementById('player2-section').style.display = state.numPlayers > 1 ? 'flex' : 'none';

    const player2Title = document.querySelector('#player2-section .player-title');
    if (player2Title) {
        if (state.aiOpponent) {
            player2Title.textContent = 'ИИ';
            player2Title.style.color = PLAYER_COLORS[1].primary;
        } else {
            player2Title.textContent = 'Игрок 2';
            player2Title.style.color = PLAYER_COLORS[1].primary;
        }
    }

    document.querySelectorAll('.action-btn').forEach(btn => btn.classList.remove('selected'));
    if (state.selectedAction) {
        const btnId = {
            'move': 'btn-move',
            'placeAdjacent': 'btn-place-adj',
            'placeAnywhere': 'btn-place-any',
            'replaceAdjacent': 'btn-replace-adj',
            'replace': 'btn-replace'
        }[state.selectedAction];
        if (btnId) document.getElementById(btnId).classList.add('selected');
    }
    
    const player1Title = document.querySelector('#player1-section .player-title');
    
    if (player1Title) {
        player1Title.style.color = PLAYER_COLORS[0].primary;
        player1Title.textContent = 'Игрок';
    }
}

function getNeighbors(row, col) {
    const neighbors = [];
    const isOddCol = col % 2 === 1;

    const offsets = isOddCol ? [
        { dr: -1, dc: 0, edge: 0 },
        { dr: 0, dc: 1, edge: 1 },
        { dr: 1, dc: 1, edge: 2 },
        { dr: 1, dc: 0, edge: 3 },
        { dr: 1, dc: -1, edge: 4 },
        { dr: 0, dc: -1, edge: 5 },
    ] : [
        { dr: -1, dc: 0, edge: 0 },
        { dr: -1, dc: 1, edge: 1 },
        { dr: 0, dc: 1, edge: 2 },
        { dr: 1, dc: 0, edge: 3 },
        { dr: 0, dc: -1, edge: 4 },
        { dr: -1, dc: -1, edge: 5 },
    ];

    offsets.forEach(({ dr, dc, edge }) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
            if (state.board[nr][nc].shouldDisplay) {
                neighbors.push({ row: nr, col: nc, edge });
            }
        }
    });

    return neighbors;
}

function hasPathToEdge(cell, edge) {
    if (cell.startForPlayer !== -1 || cell.finishForPlayer !== -1) return true;
    if (cell.isEmpty || cell.tileType === null) return false;

    const edges = rotateEdges(TILE_TYPES[cell.tileType], cell.rotation);
    return edges.includes(edge);
}

function canMoveAnywhere(player) {
    const cell = state.board[player.row][player.col];
    const neighbors = getNeighbors(player.row, player.col);

    return neighbors.some(n => {
        const nCell = state.board[n.row][n.col];
        if (nCell.isEmpty) return false;

        const myEdge = n.edge;
        const theirEdge = (myEdge + 3) % 6;

        return hasPathToEdge(cell, myEdge) && hasPathToEdge(nCell, theirEdge);
    });
}

function getValidMoves(player) {
    const cell = state.board[player.row][player.col];
    const neighbors = getNeighbors(player.row, player.col);
    const valid = [];

    neighbors.forEach(n => {
        const nCell = state.board[n.row][n.col];
        if (nCell.isEmpty) return;

        const myEdge = n.edge;
        const theirEdge = (myEdge + 3) % 6;

        if (hasPathToEdge(cell, myEdge) && hasPathToEdge(nCell, theirEdge)) {
            valid.push({ row: n.row, col: n.col });
        }
    });

    return valid;
}

function hasAdjacentEmpty(player) {
    const neighbors = getNeighbors(player.row, player.col);
    return neighbors.some(n => state.board[n.row][n.col].isEmpty);
}

function getAdjacentEmpty(player) {
    const neighbors = getNeighbors(player.row, player.col);
    return neighbors.filter(n => state.board[n.row][n.col].isEmpty);
}

function hasAnyEmpty() {
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (state.board[r][c].shouldDisplay && state.board[r][c].isEmpty) return true;
        }
    }
    return false;
}

function getAllEmpty() {
    const empty = [];
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (state.board[r][c].shouldDisplay && state.board[r][c].isEmpty) empty.push({ row: r, col: c });
        }
    }
    return empty;
}

function hasReplaceable() {
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const cell = state.board[r][c];
            if (cell.shouldDisplay && !cell.isEmpty && cell.startForPlayer === -1 && cell.finishForPlayer === -1) return true;
        }
    }
    return false;
}

function getReplaceable() {
    const tiles = [];
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const cell = state.board[r][c];
            if (cell.shouldDisplay && !cell.isEmpty && cell.startForPlayer === -1 && cell.finishForPlayer === -1) {
                tiles.push({ row: r, col: c });
            }
        }
    }
    return tiles;
}

function hasAdjacentReplaceable() {
    const player = state.players[state.currentPlayer];
    const neighbors = getNeighbors(player.row, player.col);
    return neighbors.some(n => {
        const cell = state.board[n.row][n.col];
        return !cell.isEmpty && cell.startForPlayer === -1 && cell.finishForPlayer === -1;
    });
}

function getAdjacentReplaceable() {
    const player = state.players[state.currentPlayer];
    const neighbors = getNeighbors(player.row, player.col);
    return neighbors.filter(n => {
        const cell = state.board[n.row][n.col];
        return !cell.isEmpty && cell.startForPlayer === -1 && cell.finishForPlayer === -1;
    });
}

function selectAction(action) {
    // Если ход ИИ, не позволяем игроку выбирать действия
    if (state.aiOpponent && state.currentPlayer === 1) {
        updateStatus('Сейчас ход ИИ!');
        return;
    }
    
    state.selectedAction = action;
    state.selectedCell = null;
    clearHighlights();

    const player = state.players[state.currentPlayer];
    let targets = [];

    switch (action) {
        case 'move':
            targets = getValidMoves(player);
            updateStatus('Выберите клетку для перемещения (1 очко)');
            break;
        case 'placeAdjacent':
            targets = getAdjacentEmpty(player);
            updateStatus('Выберите пустую клетку рядом с фишкой (2 очка)');
            break;
        case 'placeAnywhere':
            targets = getAllEmpty();
            updateStatus('Выберите любую пустую клетку (4 очка)');
            break;
        case 'replaceAdjacent':
            targets = getAdjacentReplaceable();
            updateStatus('Выберите соседний тайл для замены/поворота (5 очков)');
            break;
        case 'replace':
            targets = getReplaceable();
            updateStatus('Выберите любой тайл для замены/поворота (6 очков)');
            break;
    }

    highlightCells(targets);
    updateUI();
}

function highlightCells(cells) {
    cells.forEach(cell => {
        const el = document.querySelector(`.hex-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
        if (el) el.classList.add('valid-target');
    });
}

function clearHighlights() {
    document.querySelectorAll('.hex-cell').forEach(el => {
        el.classList.remove('valid-target', 'selected-cell');
    });
}

function handleCellClick(row, col) {
    if (state.phase !== 'action') {
        updateStatus('Сначала бросьте кубик!');
        return;
    }

    // Если ход ИИ, игнорируем клики игрока
    if (state.aiOpponent && state.currentPlayer === 1) {
        updateStatus('Сейчас ход ИИ! Подождите...');
        return;
    }

    const player = state.players[state.currentPlayer];
    const cell = state.board[row][col];

    if (!state.selectedAction) {
        if (cell.isEmpty) {
            const isAdjacent = getAdjacentEmpty(player).some(c => c.row === row && c.col === col);

            if (isAdjacent && state.points >= COST.placeAdjacent) {
                state.selectedAction = 'placeAdjacent';
            } else if (state.points >= COST.placeAnywhere) {
                state.selectedAction = 'placeAnywhere';
            } else {
                updateStatus(`Недостаточно очков! Нужно ${isAdjacent ? 2 : 4}, есть ${state.points}`);
                return;
            }
        } else if (cell.startForPlayer === -1 && cell.finishForPlayer === -1 && state.points >= COST.replace) {
            const validMoves = getValidMoves(player);
            if (validMoves.some(c => c.row === row && c.col === col)) {
                state.selectedAction = 'move';
            } else {
                state.selectedAction = 'replace';
            }
        } else {
            const validMoves = getValidMoves(player);
            if (validMoves.some(c => c.row === row && c.col === col) && state.points >= COST.move) {
                state.selectedAction = 'move';
            } else {
                updateStatus('Нельзя сюда переместиться или недостаточно очков');
                return;
            }
        }
        updateUI();
    }

    switch (state.selectedAction) {
        case 'move':
            const validMoves2 = getValidMoves(player);
            if (!validMoves2.some(c => c.row === row && c.col === col)) {
                updateStatus('Нельзя сюда переместиться - нет соединённого пути');
                state.selectedAction = null;
                return;
            }
            player.row = row;
            player.col = col;
            state.points -= COST.move;

            if (state.gameMode === 'flag' && !player.hasFlag) {
                if (cell.finishForPlayer === state.currentPlayer) {
                    player.hasFlag = true;
                    updateStatus('🚩 Флаг подобран! Возвращайтесь на старт!');
                }
            }

            if (checkWin(player, cell)) {
                renderBoard();
                showWinModal();
                return;
            }

            renderBoard();
            state.selectedAction = null;
            clearHighlights();
            updateUI();

            if (state.points > 0 && canMoveAnywhere(player)) {
                updateStatus(`Осталось ${state.points} очков. Продолжайте или завершите ход.`);
            } else if (state.points > 0) {
                updateStatus(`Осталось ${state.points} очков.`);
            } else {
                updateStatus(`Очки закончились! Можно отменить последнее действие или завершить ход.`);
            }
            break;

        case 'placeAdjacent':
            if (!cell.isEmpty) {
                updateStatus('Эта клетка уже занята!');
                state.selectedAction = null;
                return;
            }
            const adjacentEmpty = getAdjacentEmpty(player);
            if (!adjacentEmpty.some(c => c.row === row && c.col === col)) {
                updateStatus('Можно размещать только в соседние пустые клетки!');
                state.selectedAction = null;
                clearHighlights();
                return;
            }
            
            // Размещаем тайл
            state.lastTilePlacement = {
                action: 'placeAdjacent',
                row: row,
                col: col,
                previousCellState: { ...cell },
                pointsUsed: COST.placeAdjacent,
                nextTileTypeBefore: state.nextTileType,
                nextTileRotationBefore: state.nextTileRotation
            };
            
            state.board[row][col] = {
                ...cell,
                tileType: state.nextTileType,
                rotation: state.nextTileRotation,
                isEmpty: false
            };

            state.points -= COST.placeAdjacent;
            state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
            state.nextTileRotation = 0;
            renderNextTile();

            renderBoard();
            state.selectedAction = null;
            clearHighlights();
            updateUI();
            updateStatus(`Тайл размещён рядом с фишкой! Осталось ${state.points} очков. Нажмите "Отмена" чтобы убрать тайл.`);

            if (state.points <= 0) {
                updateStatus(`Очки закончились! Можно отменить последнее действие или завершить ход.`);
            }
            break;

        case 'placeAnywhere':
            if (!cell.isEmpty) {
                updateStatus('Эта клетка уже занята!');
                state.selectedAction = null;
                return;
            }
            state.lastTilePlacement = {
                action: 'placeAnywhere',
                row: row,
                col: col,
                previousCellState: { ...cell },
                pointsUsed: COST.placeAnywhere,
                nextTileTypeBefore: state.nextTileType,
                nextTileRotationBefore: state.nextTileRotation
            };
            
            state.board[row][col] = {
                ...cell,
                tileType: state.nextTileType,
                rotation: state.nextTileRotation,
                isEmpty: false
            };

            state.points -= COST.placeAnywhere;
            state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
            state.nextTileRotation = 0;
            renderNextTile();

            renderBoard();
            state.selectedAction = null;
            clearHighlights();
            updateUI();
            updateStatus(`Тайл размещён в любом месте! Осталось ${state.points} очков. Нажмите "Отмена" чтобы убрать тайл.`);

            if (state.points <= 0) {
                updateStatus(`Очки закончились! Можно отменить последнее действие или завершить ход.`);
            }
            break;

        case 'replaceAdjacent':
            if (!getAdjacentReplaceable().some(c => c.row === row && c.col === col)) {
                updateStatus('Этот тайл не рядом с вашей фишкой!');
                state.selectedAction = null;
                return;
            }
            state.selectedCell = { row, col };
            state.replaceActionCost = COST.replaceAdjacent;
            document.getElementById('replace-modal').classList.add('show');
            break;

        case 'replace':
            state.selectedCell = { row, col };
            state.replaceActionCost = COST.replace;
            document.getElementById('replace-modal').classList.add('show');
            break;
    }
}

function undoLastPlacement() {
    if (state.lastTilePlacement === null) {
        updateStatus('Нечего отменять!');
        return;
    }

    if (state.phase !== 'action') {
        updateStatus('Можно отменять только во время хода!');
        return;
    }

    const placement = state.lastTilePlacement;
    
    state.board[placement.row][placement.col] = placement.previousCellState;
    state.points += placement.pointsUsed;
    state.nextTileType = placement.nextTileTypeBefore;
    state.nextTileRotation = placement.nextTileRotationBefore;
    state.lastTilePlacement = null;
    
    renderBoard();
    renderNextTile();
    updateUI();
    updateStatus('Последнее размещение тайла отменено!');
}

function doRotateTile() {
    if (!state.selectedCell) return;

    const { row, col } = state.selectedCell;
    
    state.lastTilePlacement = {
        action: 'rotate',
        row: row,
        col: col,
        previousCellState: { ...state.board[row][col] },
        pointsUsed: state.replaceActionCost || COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[row][col].rotation = (state.board[row][col].rotation + 1) % 6;
    state.points -= state.replaceActionCost || COST.replace;

    document.getElementById('replace-modal').classList.remove('show');
    state.selectedCell = null;
    state.selectedAction = null;
    clearHighlights();
    renderBoard();
    updateUI();
    updateStatus(`Тайл повёрнут! Осталось ${state.points} очков. Нажмите "Отмена" чтобы отменить поворот.`);

    if (state.points <= 0) {
        updateStatus(`Очки закончились! Можно отменить последнее действие или завершить ход.`);
    }
}

function doReplaceTile() {
    if (!state.selectedCell) return;

    const { row, col } = state.selectedCell;
    
    state.lastTilePlacement = {
        action: 'replace',
        row: row,
        col: col,
        previousCellState: { ...state.board[row][col] },
        pointsUsed: state.replaceActionCost || COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[row][col].tileType = state.nextTileType;
    state.board[row][col].rotation = state.nextTileRotation;
    state.points -= state.replaceActionCost || COST.replace;

    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;

    document.getElementById('replace-modal').classList.remove('show');
    state.selectedCell = null;
    state.selectedAction = null;
    clearHighlights();
    renderBoard();
    renderNextTile();
    updateUI();
    updateStatus(`Тайл заменён! Осталось ${state.points} очков. Нажмите "Отмена" чтобы вернуть старый тайл.`);

    if (state.points <= 0) {
        updateStatus(`Очки закончились! Можно отменить последнее действие или завершить ход.`);
    }
}

function cancelReplace() {
    document.getElementById('replace-modal').classList.remove('show');
    state.selectedCell = null;
}

function checkWin(player, cell) {
    const playerIndex = state.currentPlayer;
    
    if (state.gameMode === 'simple') {
        return player.row === state.finishPos[playerIndex].row && 
               player.col === state.finishPos[playerIndex].col;
    } else {
        return player.row === state.startPos[playerIndex].row && 
               player.col === state.startPos[playerIndex].col && 
               player.hasFlag;
    }
}

function showWinModal() {
    const playerColor = PLAYER_COLORS[state.currentPlayer];
    
    document.getElementById('modal-title').textContent = '🎉 Победа!';
    document.getElementById('modal-title').style.color = playerColor.primary;
    
    if (state.numPlayers > 1) {
        const winnerName = state.currentPlayer === 0 ? 'Игрок' : (state.aiOpponent ? 'ИИ' : 'Игрок 2');
        document.getElementById('modal-text').innerHTML = 
            `<span style="color: ${playerColor.primary}; font-weight: bold;">${winnerName}</span> победил!`;
    } else {
        document.getElementById('modal-text').innerHTML = 
            `<span style="color: ${playerColor.primary}; font-weight: bold;">Вы прошли лабиринт!</span>`;
    }
    
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
    restartGame();
}

function endTurn() {
    // Если ход ИИ, не позволяем игроку завершать ход за ИИ
    if (state.aiOpponent && state.currentPlayer === 1) {
        updateStatus('Сейчас ход ИИ!');
        return;
    }
    
    state.selectedAction = null;
    state.selectedCell = null;
    state.lastTilePlacement = null;
    clearHighlights();

    state.currentPlayer = (state.currentPlayer + 1) % state.numPlayers;
    state.phase = 'roll';
    state.points = 0;

    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    renderNextTile();

    document.getElementById('dice').textContent = '?';
    updateUI();
    
    if (state.aiOpponent && state.currentPlayer === 1) {
        updateStatus('Ход ИИ...');
        // Проверяем, что функция aiTurn доступна
        if (typeof aiTurn === 'function') {
            setTimeout(aiTurn, 1000);
        } else if (typeof startAiTurn === 'function') {
            // Используем startAiTurn если aiTurn недоступна
            setTimeout(startAiTurn, 1000);
        } else {
            updateStatus('Ошибка: функции ИИ не загружены');
        }
    } else {
        updateStatus(`Игрок ${state.currentPlayer + 1}, бросьте кубик!`);
    }
}

function updateStatus(text) {
    document.getElementById('status').textContent = text;
}

function setGameMode(mode) {
    state.gameMode = mode;
    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    restartGame();
}

function setPlayers(num) {
    state.numPlayers = num;
    if (num === 1) {
        state.aiOpponent = false;
    }
    document.querySelectorAll('.mode-btn[data-players]').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.players) === num);
    });
    restartGame();
}

// Новая функция для выбора типа режима игры
function setGameModeType(modeType) {
    state.gameModeType = modeType;
    
    // Обновляем активные кнопки
    document.querySelectorAll('.mode-btn[data-mode-type]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.modeType === modeType);
    });
    
    // Показываем/скрываем панель выбора сложности ИИ
    const aiPanel = document.getElementById('ai-mode-panel');
    if (aiPanel) {
        if (modeType === 'bot') {
            aiPanel.style.display = 'block';
        } else {
            aiPanel.style.display = 'none';
        }
    }
    
    // Настраиваем режим игры
    if (modeType === 'single') {
        state.numPlayers = 1;
        state.aiOpponent = false;
        updateStatus('Режим для одного игрока');
    } else if (modeType === 'bot') {
        state.numPlayers = 2;
        state.aiOpponent = true;
        // Показываем панель выбора сложности
        const aiPanel = document.getElementById('ai-mode-panel');
        if (aiPanel) {
            aiPanel.style.display = 'block';
        }
        // Обновляем активную кнопку сложности
        const currentDifficulty = state.aiDifficulty || 'medium';
        const difficultyButtons = document.querySelectorAll('.mode-btn[data-difficulty]');
        if (difficultyButtons.length > 0) {
            difficultyButtons.forEach(btn => {
                if (btn.dataset.difficulty === currentDifficulty) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        // Устанавливаем сложность через функцию, если она доступна (без перезапуска, т.к. restartGame вызовется ниже)
        if (typeof setAiDifficulty === 'function') {
            setAiDifficulty(currentDifficulty, true); // skipRestart = true
        } else {
            // Если функция недоступна, просто обновляем состояние
            state.aiDifficulty = currentDifficulty;
        }
        updateStatus('🤖 Режим против ИИ включен!');
    } else if (modeType === 'online') {
        state.numPlayers = 2;
        state.aiOpponent = false;
        // TODO: здесь будет логика для онлайн режима
        updateStatus('🌐 Онлайн режим (в разработке)');
    }
    
    restartGame();
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        loadCurrentSettingsToPanel();
    } else {
        panel.style.display = 'none';
    }
}

function loadCurrentSettingsToPanel() {
    document.getElementById('cols-slider').value = state.cols;
    document.getElementById('rows-slider').value = state.rows;
    document.getElementById('gap-h-slider').value = state.hexGapH;
    document.getElementById('gap-v-slider').value = state.hexGapV;
    document.getElementById('size-slider').value = state.hexSize;
    updateSettingDisplay();
}

function updateSettingDisplay() {
    document.getElementById('cols-value').textContent = document.getElementById('cols-slider').value;
    document.getElementById('rows-value').textContent = document.getElementById('rows-slider').value;
    document.getElementById('gap-h-value').textContent = document.getElementById('gap-h-slider').value;
    document.getElementById('gap-v-value').textContent = document.getElementById('gap-v-slider').value;
    document.getElementById('size-value').textContent = document.getElementById('size-slider').value;
}

function applySettings() {
    state.cols = parseInt(document.getElementById('cols-slider').value);
    state.rows = parseInt(document.getElementById('rows-slider').value);
    state.hexGapH = parseInt(document.getElementById('gap-h-slider').value);
    state.hexGapV = parseInt(document.getElementById('gap-v-slider').value);
    state.hexSize = parseInt(document.getElementById('size-slider').value);
    
    document.getElementById('settings-panel').style.display = 'none';
    
    restartGame();
}

function resetSettings() {
    document.getElementById('cols-slider').value = 9;
    document.getElementById('rows-slider').value = 9;
    document.getElementById('gap-h-slider').value = -3;
    document.getElementById('gap-v-slider').value = -19;
    document.getElementById('size-slider').value = 55;
    updateSettingDisplay();
    applySettings();
}

function restartGame() {
    initBoard();
}

// Dark mode
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    document.documentElement.classList.toggle('dark', e.matches);
});

// Обработчики событий
document.getElementById('btn-undo').addEventListener('click', undoLastPlacement);

// Init
initBoard();