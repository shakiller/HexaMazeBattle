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
    aiDifficulty: 'medium'
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

// Типы тайлов для создания проходов (лучшие для соединения)
const CONNECTING_TILE_TYPES = [0, 1, 2, 7, 8]; // Прямые и соединения

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

// Функция для проверки, соединяется ли тайл с соседними
function tileConnectsToNeighbors(row, col, tileType, rotation) {
    const cell = state.board[row][col];
    const neighbors = getNeighbors(row, col);
    
    if (neighbors.length === 0) return false;
    
    const edges = rotateEdges(TILE_TYPES[tileType], rotation);
    
    for (const neighbor of neighbors) {
        const nCell = state.board[neighbor.row][neighbor.col];
        if (!nCell.isEmpty && nCell.tileType !== null) {
            const myEdge = neighbor.edge;
            const theirEdge = (myEdge + 3) % 6;
            
            const nEdges = rotateEdges(TILE_TYPES[nCell.tileType], nCell.rotation);
            
            // Если тайл соединяется хотя бы с одним соседом
            if (edges.includes(myEdge) && nEdges.includes(theirEdge)) {
                return true;
            }
        }
    }
    
    return false;
}

// Функция для получения оптимального поворота тайла для соединения
function getBestRotationForTile(row, col, tileType) {
    let bestRotation = 0;
    let maxConnections = 0;
    
    // Проверяем все возможные повороты
    for (let rotation = 0; rotation < 6; rotation++) {
        let connections = 0;
        const neighbors = getNeighbors(row, col);
        const edges = rotateEdges(TILE_TYPES[tileType], rotation);
        
        for (const neighbor of neighbors) {
            const nCell = state.board[neighbor.row][neighbor.col];
            if (!nCell.isEmpty && nCell.tileType !== null) {
                const myEdge = neighbor.edge;
                const theirEdge = (myEdge + 3) % 6;
                const nEdges = rotateEdges(TILE_TYPES[nCell.tileType], nCell.rotation);
                
                if (edges.includes(myEdge) && nEdges.includes(theirEdge)) {
                    connections++;
                }
            }
        }
        
        if (connections > maxConnections) {
            maxConnections = connections;
            bestRotation = rotation;
        }
    }
    
    return bestRotation;
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
        setTimeout(aiTurn, 1000);
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

            if (!state.aiOpponent || state.currentPlayer === 0) {
                cellEl.addEventListener('click', () => handleCellClick(r, c));
            }

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
        diceEl.textContent = Math.floor(Math.random() * 6) + 1;
        rolls++;
        if (rolls > 12) {
            clearInterval(rollInterval);
            const value = Math.floor(Math.random() * 6) + 1;
            state.points = value;
            diceEl.textContent = value;
            diceEl.classList.remove('rolling');

            state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
            state.nextTileRotation = 0;
            renderNextTile();

            state.phase = 'action';
            updateUI();
            
            if (state.aiOpponent && state.currentPlayer === 1) {
                updateStatus(`ИИ выбросил ${value}! ИИ думает...`);
                setTimeout(aiTurn, 500);
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

    document.getElementById('btn-move').disabled =
        state.phase !== 'action' || state.points < COST.move || !canMoveAnywhere(player) || (state.aiOpponent && state.currentPlayer === 1);

    document.getElementById('btn-place-adj').disabled =
        state.phase !== 'action' || state.points < COST.placeAdjacent || !hasAdjacentEmpty(player) || (state.aiOpponent && state.currentPlayer === 1);

    document.getElementById('btn-place-any').disabled =
        state.phase !== 'action' || state.points < COST.placeAnywhere || !hasAnyEmpty() || (state.aiOpponent && state.currentPlayer === 1);

    document.getElementById('btn-replace-adj').disabled =
        state.phase !== 'action' || state.points < COST.replaceAdjacent || !hasAdjacentReplaceable() || (state.aiOpponent && state.currentPlayer === 1);

    document.getElementById('btn-replace').disabled =
        state.phase !== 'action' || state.points < COST.replace || !hasReplaceable() || (state.aiOpponent && state.currentPlayer === 1);

    document.getElementById('btn-end').disabled = state.phase !== 'action' || (state.aiOpponent && state.currentPlayer === 1);
    
    document.getElementById('btn-undo').disabled = 
        state.phase !== 'action' || state.lastTilePlacement === null || (state.aiOpponent && state.currentPlayer === 1);

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

    if (state.aiOpponent && state.currentPlayer === 1) {
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
            
            // Игрок и ИИ могут размещать тайлы рядом
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
        setTimeout(aiTurn, 1000);
    } else {
        updateStatus(`Игрок ${state.currentPlayer + 1}, бросьте кубик!`);
    }
}

// ==================== ИИ БОТ ====================

function aiTurn() {
    if (state.phase === 'roll') {
        rollDice();
        return;
    }
    
    if (state.phase !== 'action' || state.currentPlayer !== 1) return;
    
    const delay = state.aiDifficulty === 'easy' ? 1500 : state.aiDifficulty === 'medium' ? 1000 : 500;
    
    setTimeout(() => {
        aiMakeDecision();
    }, delay);
}

function aiMakeDecision() {
    let decisionMade = false;
    
    if (state.aiDifficulty === 'easy') {
        decisionMade = aiEasyStrategy();
    } else if (state.aiDifficulty === 'medium') {
        decisionMade = aiMediumStrategy();
    } else {
        decisionMade = aiHardStrategy();
    }
    
    if (!decisionMade) {
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 500);
    }
}

function aiEasyStrategy() {
    const aiPlayer = state.players[1];
    const availableActions = [];
    
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        availableActions.push('move');
    }
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        availableActions.push('placeAdjacent');
    }
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        availableActions.push('placeAnywhere');
    }
    if (state.points >= COST.replaceAdjacent && hasAdjacentReplaceable()) {
        availableActions.push('replaceAdjacent');
    }
    if (state.points >= COST.replace && hasReplaceable()) {
        availableActions.push('replace');
    }
    
    if (availableActions.length === 0) {
        return false;
    }
    
    const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
    
    switch (randomAction) {
        case 'move':
            return aiPerformMove();
        case 'placeAdjacent':
            return aiPerformPlaceAdjacent();
        case 'placeAnywhere':
            return aiPerformPlaceAnywhere();
        case 'replaceAdjacent':
            return aiPerformReplaceAdjacent();
        case 'replace':
            return aiPerformReplace();
    }
    
    return false;
}

function aiMediumStrategy() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // 1. Попробовать двигаться к финишу
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        const movesTowardsFinish = validMoves.filter(move => {
            const currentDist = Math.abs(aiPlayer.row - finish.row) + Math.abs(aiPlayer.col - finish.col);
            const newDist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
            return newDist < currentDist;
        });
        
        if (movesTowardsFinish.length > 0) {
            const bestMove = movesTowardsFinish.reduce((best, current) => {
                const bestDist = Math.abs(best.row - finish.row) + Math.abs(best.col - finish.col);
                const currentDist = Math.abs(current.row - finish.row) + Math.abs(current.col - finish.col);
                return currentDist < bestDist ? current : best;
            });
            
            aiPlayer.row = bestMove.row;
            aiPlayer.col = bestMove.col;
            state.points -= COST.move;
            
            updateStatus(`ИИ переместился на (${bestMove.row},${bestMove.col})`);
            renderBoard();
            checkAiWin();
            
            if (state.points > 0) {
                setTimeout(aiTurn, 800);
            } else {
                updateStatus('ИИ завершает ход.');
                setTimeout(() => {
                    endTurn();
                }, 1000);
            }
            return true;
        }
    }
    
    // 2. Размещать соединяющие тайлы рядом
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        const adjacentEmpty = getAdjacentEmpty(aiPlayer);
        
        // Ищем клетку, где тайл будет соединяться
        for (const cell of adjacentEmpty) {
            // Проверяем, будет ли текущий тайл соединяться
            if (tileConnectsToNeighbors(cell.row, cell.col, state.nextTileType, state.nextTileRotation)) {
                // Размещаем тайл
                state.lastTilePlacement = {
                    action: 'placeAdjacent',
                    row: cell.row,
                    col: cell.col,
                    previousCellState: { ...state.board[cell.row][cell.col] },
                    pointsUsed: COST.placeAdjacent,
                    nextTileTypeBefore: state.nextTileType,
                    nextTileRotationBefore: state.nextTileRotation
                };
                
                // Находим оптимальный поворот
                const bestRotation = getBestRotationForTile(cell.row, cell.col, state.nextTileType);
                
                state.board[cell.row][cell.col] = {
                    ...state.board[cell.row][cell.col],
                    tileType: state.nextTileType,
                    rotation: bestRotation,
                    isEmpty: false
                };

                state.points -= COST.placeAdjacent;
                state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
                state.nextTileRotation = 0;
                
                updateStatus(`ИИ разместил соединяющий тайл в (${cell.row},${cell.col})`);
                renderBoard();
                renderNextTile();
                
                if (state.points > 0) {
                    setTimeout(aiTurn, 800);
                } else {
                    updateStatus('ИИ завершает ход.');
                    setTimeout(() => {
                        endTurn();
                    }, 1000);
                }
                return true;
            }
        }
        
        // Если не нашли соединяющую клетку, размещаем в случайной
        return aiPerformPlaceAdjacent();
    }
    
    // 3. Или размещаем тайл для создания пути к финишу
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        const allEmpty = getAllEmpty();
        
        // Ищем клетки на пути к финишу
        const pathCells = allEmpty.filter(cell => {
            const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
            const distToAi = Math.abs(cell.row - aiPlayer.row) + Math.abs(cell.col - aiPlayer.col);
            return distToFinish < 5 && distToAi < 5;
        });
        
        if (pathCells.length > 0) {
            const bestCell = pathCells[Math.floor(Math.random() * pathCells.length)];
            
            state.lastTilePlacement = {
                action: 'placeAnywhere',
                row: bestCell.row,
                col: bestCell.col,
                previousCellState: { ...state.board[bestCell.row][bestCell.col] },
                pointsUsed: COST.placeAnywhere,
                nextTileTypeBefore: state.nextTileType,
                nextTileRotationBefore: state.nextTileRotation
            };
            
            // Используем соединяющие тайлы для пути
            const connectingTile = CONNECTING_TILE_TYPES[Math.floor(Math.random() * CONNECTING_TILE_TYPES.length)];
            const bestRotation = getBestRotationForTile(bestCell.row, bestCell.col, connectingTile);
            
            state.board[bestCell.row][bestCell.col] = {
                ...state.board[bestCell.row][bestCell.col],
                tileType: connectingTile,
                rotation: bestRotation,
                isEmpty: false
            };

            state.points -= COST.placeAnywhere;
            state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
            state.nextTileRotation = 0;
            
            updateStatus(`ИИ создал путь в (${bestCell.row},${bestCell.col})`);
            renderBoard();
            renderNextTile();
            
            if (state.points > 0) {
                setTimeout(aiTurn, 800);
            } else {
                updateStatus('ИИ завершает ход.');
                setTimeout(() => {
                    endTurn();
                }, 1000);
            }
            return true;
        }
    }
    
    // 4. Иначе случайное действие
    return aiEasyStrategy();
}

function aiHardStrategy() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const humanPlayer = state.players[0];
    const humanFinish = state.finishPos[0];
    
    // 1. Выигрышный ход
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        const winningMove = validMoves.find(move => 
            move.row === finish.row && move.col === finish.col
        );
        
        if (winningMove) {
            aiPlayer.row = winningMove.row;
            aiPlayer.col = winningMove.col;
            state.points -= COST.move;
            
            updateStatus(`ИИ переместился на финиш!`);
            renderBoard();
            setTimeout(() => {
                checkAiWin();
            }, 500);
            return true;
        }
    }
    
    // 2. Блокировка игрока
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        const humanDist = Math.abs(humanPlayer.row - humanFinish.row) + Math.abs(humanPlayer.col - humanFinish.col);
        if (humanDist <= 3) {
            const emptyCells = getAllEmpty();
            const blockingCells = emptyCells.filter(cell => {
                const cellDistToHumanPath = Math.abs(cell.row - humanPlayer.row) + Math.abs(cell.col - humanPlayer.col);
                return cellDistToHumanPath <= 2;
            });
            
            if (blockingCells.length > 0) {
                const bestBlock = blockingCells[Math.floor(Math.random() * blockingCells.length)];
                
                state.lastTilePlacement = {
                    action: 'placeAnywhere',
                    row: bestBlock.row,
                    col: bestBlock.col,
                    previousCellState: { ...state.board[bestBlock.row][bestBlock.col] },
                    pointsUsed: COST.placeAnywhere,
                    nextTileTypeBefore: state.nextTileType,
                    nextTileRotationBefore: state.nextTileRotation
                };
                
                // Используем тупиковые тайлы для блокировки
                const blockingTile = 3; // Turn top to top-right (не прямой)
                const bestRotation = getBestRotationForTile(bestBlock.row, bestBlock.col, blockingTile);
                
                state.board[bestBlock.row][bestBlock.col] = {
                    ...state.board[bestBlock.row][bestBlock.col],
                    tileType: blockingTile,
                    rotation: bestRotation,
                    isEmpty: false
                };
                
                state.points -= COST.placeAnywhere;
                state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
                state.nextTileRotation = 0;
                
                updateStatus(`ИИ блокирует путь в (${bestBlock.row},${bestBlock.col})`);
                renderBoard();
                renderNextTile();
                
                if (state.points > 0) {
                    setTimeout(aiTurn, 800);
                } else {
                    updateStatus('ИИ завершает ход.');
                    setTimeout(() => {
                        endTurn();
                    }, 1000);
                }
                return true;
            }
        }
    }
    
    // 3. Улучшение собственного пути
    if (state.points >= COST.replace && hasReplaceable()) {
        const replaceable = getReplaceable();
        // Ищем тайлы на пути к финишу, которые можно улучшить
        const pathTiles = replaceable.filter(cell => {
            const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
            return distToFinish < 4;
        });
        
        if (pathTiles.length > 0) {
            const bestTile = pathTiles[Math.floor(Math.random() * pathTiles.length)];
            
            state.lastTilePlacement = {
                action: 'replace',
                row: bestTile.row,
                col: bestTile.col,
                previousCellState: { ...state.board[bestTile.row][bestTile.col] },
                pointsUsed: COST.replace,
                nextTileTypeBefore: state.nextTileType,
                nextTileRotationBefore: state.nextTileRotation
            };
            
            // Заменяем на соединяющий тайл
            const connectingTile = CONNECTING_TILE_TYPES[Math.floor(Math.random() * CONNECTING_TILE_TYPES.length)];
            const bestRotation = getBestRotationForTile(bestTile.row, bestTile.col, connectingTile);
            
            state.board[bestTile.row][bestTile.col].tileType = connectingTile;
            state.board[bestTile.row][bestTile.col].rotation = bestRotation;
            state.points -= COST.replace;
            
            state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
            state.nextTileRotation = 0;
            
            updateStatus(`ИИ улучшил путь в (${bestTile.row},${bestTile.col})`);
            renderBoard();
            renderNextTile();
            
            if (state.points > 0) {
                setTimeout(aiTurn, 800);
            } else {
                updateStatus('ИИ завершает ход.');
                setTimeout(() => {
                    endTurn();
                }, 1000);
            }
            return true;
        }
    }
    
    // 4. Используем среднюю стратегию
    return aiMediumStrategy();
}

function aiPerformMove() {
    const aiPlayer = state.players[1];
    const validMoves = getValidMoves(aiPlayer);
    
    if (validMoves.length === 0) {
        return false;
    }
    
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    aiPlayer.row = randomMove.row;
    aiPlayer.col = randomMove.col;
    state.points -= COST.move;
    
    updateStatus(`ИИ переместился на (${randomMove.row},${randomMove.col})`);
    renderBoard();
    checkAiWin();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
    return true;
}

function aiPerformPlaceAdjacent() {
    const aiPlayer = state.players[1];
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    
    if (adjacentEmpty.length === 0) {
        return false;
    }
    
    // Ищем клетку, где тайл будет лучше всего соединяться
    let bestCell = null;
    let bestConnections = -1;
    let bestRotation = 0;
    
    for (const cell of adjacentEmpty) {
        const rotation = getBestRotationForTile(cell.row, cell.col, state.nextTileType);
        const edges = rotateEdges(TILE_TYPES[state.nextTileType], rotation);
        const neighbors = getNeighbors(cell.row, cell.col);
        
        let connections = 0;
        for (const neighbor of neighbors) {
            const nCell = state.board[neighbor.row][neighbor.col];
            if (!nCell.isEmpty && nCell.tileType !== null) {
                const myEdge = neighbor.edge;
                const theirEdge = (myEdge + 3) % 6;
                const nEdges = rotateEdges(TILE_TYPES[nCell.tileType], nCell.rotation);
                
                if (edges.includes(myEdge) && nEdges.includes(theirEdge)) {
                    connections++;
                }
            }
        }
        
        if (connections > bestConnections) {
            bestConnections = connections;
            bestCell = cell;
            bestRotation = rotation;
        }
    }
    
    if (!bestCell) {
        bestCell = adjacentEmpty[Math.floor(Math.random() * adjacentEmpty.length)];
        bestRotation = state.nextTileRotation;
    }
    
    state.lastTilePlacement = {
        action: 'placeAdjacent',
        row: bestCell.row,
        col: bestCell.col,
        previousCellState: { ...state.board[bestCell.row][bestCell.col] },
        pointsUsed: COST.placeAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[bestCell.row][bestCell.col] = {
        ...state.board[bestCell.row][bestCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };

    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил тайл рядом в (${bestCell.row},${bestCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
    return true;
}

function aiPerformPlaceAnywhere() {
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        return false;
    }
    
    // Для сложного ИИ выбираем стратегически важные клетки
    let targetCells = allEmpty;
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    if (state.aiDifficulty === 'medium' || state.aiDifficulty === 'hard') {
        // Предпочитаем клетки на пути к финишу
        targetCells = allEmpty.filter(cell => {
            const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
            const distToAi = Math.abs(cell.row - aiPlayer.row) + Math.abs(cell.col - aiPlayer.col);
            return distToFinish < 6 && distToAi < 6;
        });
        
        if (targetCells.length === 0) {
            targetCells = allEmpty;
        }
    }
    
    const randomCell = targetCells[Math.floor(Math.random() * targetCells.length)];
    
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Для среднего и сложного ИИ используем оптимальный поворот
    let rotation = state.nextTileRotation;
    if (state.aiDifficulty === 'medium' || state.aiDifficulty === 'hard') {
        rotation = getBestRotationForTile(randomCell.row, randomCell.col, state.nextTileType);
    }
    
    state.board[randomCell.row][randomCell.col] = {
        ...state.board[randomCell.row][randomCell.col],
        tileType: state.nextTileType,
        rotation: rotation,
        isEmpty: false
    };

    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
    return true;
}

function aiPerformReplaceAdjacent() {
    const adjacentReplaceable = getAdjacentReplaceable();
    
    if (adjacentReplaceable.length === 0) {
        return false;
    }
    
    const randomCell = adjacentReplaceable[Math.floor(Math.random() * adjacentReplaceable.length)];
    
    state.lastTilePlacement = {
        action: 'replace',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.replaceAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Для среднего и сложного ИИ используем соединяющие тайлы
    let tileType = state.nextTileType;
    if (state.aiDifficulty === 'medium' || state.aiDifficulty === 'hard') {
        if (Math.random() < 0.7) { // 70% chance использовать соединяющий тайл
            tileType = CONNECTING_TILE_TYPES[Math.floor(Math.random() * CONNECTING_TILE_TYPES.length)];
        }
    }
    
    let rotation = state.nextTileRotation;
    if (state.aiDifficulty === 'medium' || state.aiDifficulty === 'hard') {
        rotation = getBestRotationForTile(randomCell.row, randomCell.col, tileType);
    }
    
    state.board[randomCell.row][randomCell.col].tileType = tileType;
    state.board[randomCell.row][randomCell.col].rotation = rotation;
    state.points -= COST.replaceAdjacent;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ заменил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
    return true;
}

function aiPerformReplace() {
    const replaceable = getReplaceable();
    
    if (replaceable.length === 0) {
        return false;
    }
    
    const randomCell = replaceable[Math.floor(Math.random() * replaceable.length)];
    
    state.lastTilePlacement = {
        action: 'replace',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[randomCell.row][randomCell.col].tileType = state.nextTileType;
    state.board[randomCell.row][randomCell.col].rotation = state.nextTileRotation;
    state.points -= COST.replace;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ заменил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
    return true;
}

function checkAiWin() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    if (checkWin(aiPlayer, state.board[aiPlayer.row][aiPlayer.col])) {
        setTimeout(() => {
            showWinModal();
        }, 500);
        return true;
    }
    return false;
}

function setAiMode(enable) {
    state.aiOpponent = enable;
    if (enable) {
        state.numPlayers = 2;
        document.querySelectorAll('.mode-btn[data-players]').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.players) === 2);
        });
    }
    restartGame();
}

function setAiDifficulty(difficulty) {
    state.aiDifficulty = difficulty;
    document.querySelectorAll('.mode-btn[data-difficulty]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    
    if (state.aiOpponent) {
        updateStatus(`Сложность ИИ установлена: ${difficulty === 'easy' ? 'Легкая' : difficulty === 'medium' ? 'Средняя' : 'Сложная'}`);
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
document.getElementById('btn-ai-easy').addEventListener('click', () => {
    setAiMode(true);
    setAiDifficulty('easy');
});
document.getElementById('btn-ai-medium').addEventListener('click', () => {
    setAiMode(true);
    setAiDifficulty('medium');
});
document.getElementById('btn-ai-hard').addEventListener('click', () => {
    setAiMode(true);
    setAiDifficulty('hard');
});

// Init
initBoard();