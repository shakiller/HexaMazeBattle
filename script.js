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
    aiOpponent: false, // Новое поле: игра против ИИ
    aiDifficulty: 'medium' // Сложность ИИ: easy, medium, hard
};

// Цвета игроков
const PLAYER_COLORS = [
    { // Игрок 1
        primary: '#3b82f6',    // Синий
        light: '#60a5fa',      // Светло-синий
        dark: '#1d4ed8',       // Темно-синий
        text: '#ffffff'        // Белый текст
    },
    { // Игрок 2
        primary: '#ef4444',    // Красный
        light: '#f87171',      // Светло-красный
        dark: '#dc2626',       // Темно-красный
        text: '#ffffff'        // Белый текст
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
    
    // Для нечетного количества строк (9, 11, 13 и т.д.)
    // Скрываем ячейки в последнем ряду с нечетными столбцами
    if (state.rows % 2 === 1) {
        // Для 9 рядов: скрыть (8,1), (8,3), (8,5), (8,7)
        if (row === lastRow && col % 2 === 1) {
            return false;
        }
    }
    
    // Для четного количества строк (8, 10, 12 и т.д.)
    // Скрываем ячейки в последнем ряду с нечетными столбцами
    if (state.rows % 2 === 0) {
        // Для 8 рядов: скрыть (7,1), (7,3), (7,5), (7,7)
        if (row === lastRow && col % 2 === 1) {
            return false;
        }
    }
    
    // Для очень маленьких полей можно добавить дополнительные правила
    if (state.rows <= 3 && state.cols > 4) {
        // Для полей с 3 строками или меньше
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

    // Верхний левый угол: первая отображаемая ячейка в первой строке
    for (let c = 0; c < state.cols; c++) {
        if (state.board[0][c].shouldDisplay) {
            corners.topLeft = { row: 0, col: c };
            break;
        }
    }

    // Верхний правый угол: первая отображаемая ячейка в первой строке с конца
    for (let c = state.cols - 1; c >= 0; c--) {
        if (state.board[0][c].shouldDisplay) {
            corners.topRight = { row: 0, col: c };
            break;
        }
    }

    // Нижний левый угол: первая отображаемая ячейка в последней строке
    for (let c = 0; c < state.cols; c++) {
        if (state.board[state.rows - 1][c].shouldDisplay) {
            corners.bottomLeft = { row: state.rows - 1, col: c };
            break;
        }
    }

    // Нижний правый угол: первая отображаемая ячейка в последней строке с конца
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
    const h = size * 1.1547; // Height of hexagon (flat-top)
    
    // Horizontal distance between columns
    const horizDist = w * 0.75 + gapH;
    // Vertical distance between rows (full height plus vertical gap)
    const vertDist = h + gapV;
    
    const x = col * horizDist;
    // Even columns are at full row positions, odd columns are shifted down by half
    const y = row * vertDist + (col % 2 === 1 ? vertDist * 0.5 : 0);
    
    return { x, y };
}

// Get center point of an edge for drawing paths
function getEdgePoint(edge, radius = 38) {
    // For flat-top hex: edge 0 = top, going clockwise
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
    // Flat-top hexagon
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push(`${50 + 46 * Math.cos(angle)},${57.7 + 46 * Math.sin(angle)}`);
    }
    const hexPoints = points.join(' ');

    let fillColor = isEmpty ? '#1a2332' : '#1e3a5f';
    let strokeColor = isEmpty ? '#334155' : '#0ea5e9';
    let textColor = '#ffffff';

    // Определяем, является ли ячейка стартом или финишем какого-либо игрока
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

    // Draw paths - всегда жёлтый цвет
    if (!isEmpty && tileType !== null) {
        const edges = rotateEdges(TILE_TYPES[tileType], rotation);
        const cx = 50, cy = 57.7;
        
        // Более короткий радиус для путей, чтобы не выходить за пределы гексагона
        const pathRadius = 38; // Уменьшен с 48
        
        // Углы для плоских шестиугольников
        const angles = [-90, -30, 30, 90, 150, 210].map(deg => deg * Math.PI / 180);
        
        // Рисуем пути
        edges.forEach(edge => {
            const angle = angles[edge];
            const startRadius = 12; // Начинаем не от центра, а немного отступив
            const endRadius = pathRadius; // Заканчиваем не у самого края
            
            const x1 = cx + startRadius * Math.cos(angle);
            const y1 = cy + startRadius * Math.sin(angle);
            const x2 = cx + endRadius * Math.cos(angle);
            const y2 = cy + endRadius * Math.sin(angle);
            
            // Основная линия пути - яркий жёлтый, без обводки и скруглений
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                    stroke="#fbbf24" stroke-width="12" stroke-linecap="butt"/>`;
        });

        // Центральный узел - уменьшен
        svg += `<circle cx="${cx}" cy="${cy}" r="8" fill="#fbbf24"/>`;
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#fef3c7"/>`;
        
        // Дополнительная центральная точка для лучшей видимости соединений
        svg += `<circle cx="${cx}" cy="${cy}" r="2" fill="#ffffff" opacity="0.5"/>`;
    }

    // Start/Finish labels
    if (isStart) {
        const playerNum = startForPlayer + 1;
        const playerColor = PLAYER_COLORS[startForPlayer];
        
        // Добавляем фон для лучшей читаемости текста
        svg += `<circle cx="50" cy="57.7" r="20" fill="${playerColor.primary}" opacity="0.7"/>`;
        svg += `<text x="50" y="62" text-anchor="middle" fill="${playerColor.text}" font-size="10" font-weight="bold" font-family="sans-serif">СТАРТ${playerNum}</text>`;
        
        // Добавляем иконку игрока
        svg += `<circle cx="50" cy="45" r="6" fill="${playerColor.text}"/>`;
    }
    if (isFinish) {
        const playerNum = finishForPlayer + 1;
        const playerColor = PLAYER_COLORS[finishForPlayer];
        
        // Добавляем фон для лучшей читаемости текста
        svg += `<circle cx="50" cy="57.7" r="20" fill="${playerColor.light}" opacity="0.7"/>`;
        svg += `<text x="50" y="55" text-anchor="middle" fill="${playerColor.text}" font-size="10" font-weight="bold" font-family="sans-serif">ФИНИШ${playerNum}</text>`;
        
        if (state.gameMode === 'flag') {
            svg += `<text x="50" y="78" text-anchor="middle" font-size="16">🚩</text>`;
        }
        
        // Добавляем иконку финиша (флажок)
        svg += `<path d="M47,45 L53,45 L53,50 L50,48 L47,50 Z" fill="${playerColor.text}"/>`;
    }

    // Если ячейка и старт и финиш (для одного игрока в режиме одного игрока)
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
    // Update start and finish positions based on board size
    // For symmetrical field, start at top corners, finish at bottom corners
    
    // Update CSS variables
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

    // Find corner cells
    const corners = findCornerCells();

    // Set start and finish positions based on number of players
    if (state.numPlayers === 1) {
        state.startPos[0] = corners.topLeft || { row: 0, col: 0 };
        state.finishPos[0] = corners.bottomRight || { row: state.rows - 1, col: state.cols - 1 };
    } else {
        // For two players, use opposite corners
        state.startPos[0] = corners.topLeft || { row: 0, col: 0 };
        state.finishPos[0] = corners.bottomRight || { row: state.rows - 1, col: state.cols - 1 };
        state.startPos[1] = corners.topRight || { row: 0, col: state.cols - 1 };
        state.finishPos[1] = corners.bottomLeft || { row: state.rows - 1, col: 0 };
    }

    // Mark start and finish cells on the board
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

    // Initialize players at their start positions
    state.players = [];
    for (let p = 0; p < state.numPlayers; p++) {
        state.players.push({
            row: state.startPos[p].row,
            col: state.startPos[p].col,
            hasFlag: false
        });
    }

    // Generate new tile for next placement
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;

    state.currentPlayer = 0;
    state.phase = 'roll';
    state.points = 0;
    state.selectedAction = null;
    state.selectedCell = null;
    state.lastTilePlacement = null; // Сбрасываем последнее размещение

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

    // Calculate board size with gaps
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
            
            // Skip cells that shouldn't be displayed
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

            // Add index label
            const labelEl = document.createElement('div');
            labelEl.className = 'hex-cell-label';
            labelEl.textContent = `${r},${c}`;
            cellEl.appendChild(labelEl);

            if (cell.isEmpty) {
                cellEl.classList.add('empty-cell');
            }

            // Для игрока клетки кликабельны, для ИИ - нет
            if (!state.aiOpponent || state.currentPlayer === 0) {
                cellEl.addEventListener('click', () => handleCellClick(r, c));
            }

            // Add player tokens
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

            // Генерируем новый тайл при броске кубика
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

    // Update action buttons
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
    
    // Кнопка отмены последнего действия - теперь доступна всегда, когда есть что отменять
    document.getElementById('btn-undo').disabled = 
        state.phase !== 'action' || state.lastTilePlacement === null || (state.aiOpponent && state.currentPlayer === 1);

    // Player sections
    document.getElementById('player1-section').classList.toggle('active', state.currentPlayer === 0);
    document.getElementById('player2-section').classList.toggle('active', state.currentPlayer === 1);
    document.getElementById('player2-section').style.display = state.numPlayers > 1 ? 'flex' : 'none';

    // Если игра против ИИ, меняем название игрока 2
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

    // Highlight selected action
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
    
    // Обновляем заголовки игроков с цветами
    const player1Title = document.querySelector('#player1-section .player-title');
    
    if (player1Title) {
        player1Title.style.color = PLAYER_COLORS[0].primary;
        player1Title.textContent = 'Игрок';
    }
}

function getNeighbors(row, col) {
    const neighbors = [];
    const isOddCol = col % 2 === 1;

    // Flat-top hex neighbors - column offset layout
    // Edge 0=top, 1=top-right, 2=bottom-right, 3=bottom, 4=bottom-left, 5=top-left
    const offsets = isOddCol ? [
        { dr: -1, dc: 0, edge: 0 },  // top
        { dr: 0, dc: 1, edge: 1 },   // top-right
        { dr: 1, dc: 1, edge: 2 },   // bottom-right
        { dr: 1, dc: 0, edge: 3 },   // bottom
        { dr: 1, dc: -1, edge: 4 },  // bottom-left
        { dr: 0, dc: -1, edge: 5 },  // top-left
    ] : [
        { dr: -1, dc: 0, edge: 0 },  // top
        { dr: -1, dc: 1, edge: 1 }, // top-right
        { dr: 0, dc: 1, edge: 2 },   // bottom-right
        { dr: 1, dc: 0, edge: 3 },   // bottom
        { dr: 0, dc: -1, edge: 4 },  // bottom-left
        { dr: -1, dc: -1, edge: 5 }, // top-left
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
    if (cell.startForPlayer !== -1 || cell.finishForPlayer !== -1) return true; // Start/finish connect to all edges
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

    // Если игра против ИИ и сейчас ход ИИ, блокируем клики
    if (state.aiOpponent && state.currentPlayer === 1) {
        return;
    }

    const player = state.players[state.currentPlayer];
    const cell = state.board[row][col];

    // Auto-select action based on clicked cell
    if (!state.selectedAction) {
        // Empty cell - try to place tile
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
        }
        // Non-empty cell - try to move or replace
        else if (cell.startForPlayer === -1 && cell.finishForPlayer === -1 && state.points >= COST.replace) {
            // Check if it's a valid move target
            const validMoves = getValidMoves(player);
            if (validMoves.some(c => c.row === row && c.col === col)) {
                state.selectedAction = 'move';
            } else {
                state.selectedAction = 'replace';
            }
        }
        // Try to move
        else {
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

    // Validate the action is possible on this cell
    switch (state.selectedAction) {
        case 'move':
            // Check valid move
            const validMoves2 = getValidMoves(player);
            if (!validMoves2.some(c => c.row === row && c.col === col)) {
                updateStatus('Нельзя сюда переместиться - нет соединённого пути');
                state.selectedAction = null;
                return;
            }
            // Move player
            player.row = row;
            player.col = col;
            state.points -= COST.move;

            // Check flag pickup (only if player is on their own finish)
            if (state.gameMode === 'flag' && !player.hasFlag) {
                if (cell.finishForPlayer === state.currentPlayer) {
                    player.hasFlag = true;
                    updateStatus('🚩 Флаг подобран! Возвращайтесь на старт!');
                }
            }

            // Check win
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
            // Проверяем, что клетка пустая и соседняя
            if (!cell.isEmpty) {
                updateStatus('Эта клетка уже занята!');
                state.selectedAction = null;
                return;
            }
            // Проверяем, что клетка действительно соседняя
            const adjacentEmpty = getAdjacentEmpty(player);
            if (!adjacentEmpty.some(c => c.row === row && c.col === col)) {
                updateStatus('Можно размещать только в соседние пустые клетки!');
                state.selectedAction = null;
                clearHighlights();
                return;
            }
            // Сохраняем информацию о размещении для возможной отмены
            state.lastTilePlacement = {
                action: 'placeAdjacent',
                row: row,
                col: col,
                previousCellState: { ...cell },
                pointsUsed: COST.placeAdjacent,
                nextTileTypeBefore: state.nextTileType,
                nextTileRotationBefore: state.nextTileRotation
            };
            
            // Place tile
            state.board[row][col] = {
                ...cell,
                tileType: state.nextTileType,
                rotation: state.nextTileRotation,
                isEmpty: false
            };

            state.points -= COST.placeAdjacent;
            
            // Генерируем новый тайл после размещения
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
            // Сохраняем информацию о размещении для возможной отмены
            state.lastTilePlacement = {
                action: 'placeAnywhere',
                row: row,
                col: col,
                previousCellState: { ...cell },
                pointsUsed: COST.placeAnywhere,
                nextTileTypeBefore: state.nextTileType,
                nextTileRotationBefore: state.nextTileRotation
            };
            
            // Place tile
            state.board[row][col] = {
                ...cell,
                tileType: state.nextTileType,
                rotation: state.nextTileRotation,
                isEmpty: false
            };

            state.points -= COST.placeAnywhere;
            
            // Генерируем новый тайл после размещения
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
            // Check if adjacent
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
            // Show replace/rotate modal
            state.selectedCell = { row, col };
            state.replaceActionCost = COST.replace;
            document.getElementById('replace-modal').classList.add('show');
            break;
    }
}

// Функция для отмены последнего размещения тайла
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
    
    // Возвращаем предыдущее состояние клетки
    state.board[placement.row][placement.col] = placement.previousCellState;
    
    // Возвращаем очки
    state.points += placement.pointsUsed;
    
    // Возвращаем предыдущий тайл (если он был изменен)
    state.nextTileType = placement.nextTileTypeBefore;
    state.nextTileRotation = placement.nextTileRotationBefore;
    
    // Сбрасываем запись о последнего размещения
    state.lastTilePlacement = null;
    
    renderBoard();
    renderNextTile();
    updateUI();
    updateStatus('Последнее размещение тайла отменено!');
}

function doRotateTile() {
    if (!state.selectedCell) return;

    const { row, col } = state.selectedCell;
    
    // Сохраняем информацию для возможной отмены
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
    
    // Сохраняем информацию для возможной отмены
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

    // Генерируем новый тайл после замены
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
        // Проверяем, достиг ли игрок своего финиша
        return player.row === state.finishPos[playerIndex].row && 
               player.col === state.finishPos[playerIndex].col;
    } else {
        // В режиме с флагом: игрок должен вернуться на свой старт с флагом
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
    state.lastTilePlacement = null; // Сбрасываем последнее размещение при завершении хода
    clearHighlights();

    state.currentPlayer = (state.currentPlayer + 1) % state.numPlayers;
    state.phase = 'roll';
    state.points = 0;

    // Генерируем новый тайл при начале нового хода
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
        // ИИ бросает кубик
        rollDice();
        return;
    }
    
    if (state.phase !== 'action' || state.currentPlayer !== 1) return;
    
    const aiPlayer = state.players[1];
    const delay = state.aiDifficulty === 'easy' ? 1500 : state.aiDifficulty === 'medium' ? 1000 : 500;
    
    // Ждем немного для реалистичности
    setTimeout(() => {
        aiMakeDecision();
    }, delay);
}

function aiMakeDecision() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    let decisionMade = false;
    
    // Стратегия в зависимости от сложности
    if (state.aiDifficulty === 'easy') {
        decisionMade = aiEasyStrategy();
    } else if (state.aiDifficulty === 'medium') {
        decisionMade = aiMediumStrategy();
    } else {
        decisionMade = aiHardStrategy();
    }
    
    // Если решение не принято, завершаем ход
    if (!decisionMade) {
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 500);
    }
}

function aiEasyStrategy() {
    // Легкий ИИ: случайные действия
    const aiPlayer = state.players[1];
    const availableActions = [];
    
    // Проверяем возможные действия
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
    
    // Выбираем случайное действие
    const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
    
    // Выполняем действие
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
    // Средний ИИ: пытается двигаться к финишу
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // 1. Попробовать двигаться к финишу
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        // Ищем движение, которое приближает к финишу
        const movesTowardsFinish = validMoves.filter(move => {
            const currentDist = Math.abs(aiPlayer.row - finish.row) + Math.abs(aiPlayer.col - finish.col);
            const newDist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
            return newDist < currentDist;
        });
        
        if (movesTowardsFinish.length > 0) {
            // Выбираем лучшее движение
            const bestMove = movesTowardsFinish.reduce((best, current) => {
                const bestDist = Math.abs(best.row - finish.row) + Math.abs(best.col - finish.col);
                const currentDist = Math.abs(current.row - finish.row) + Math.abs(current.col - finish.col);
                return currentDist < bestDist ? current : best;
            });
            
            // Выполняем движение
            aiPlayer.row = bestMove.row;
            aiPlayer.col = bestMove.col;
            state.points -= COST.move;
            
            updateStatus(`ИИ переместился на (${bestMove.row},${bestMove.col})`);
            renderBoard();
            checkAiWin();
            
            // Продолжаем ход, если есть очки
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
    
    // 2. Если нельзя двигаться, размещаем тайлы рядом
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        return aiPerformPlaceAdjacent();
    }
    
    // 3. Иначе случайное действие
    return aiEasyStrategy();
}

function aiHardStrategy() {
    // Сложный ИИ: стратегическая игра
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const humanPlayer = state.players[0];
    const humanFinish = state.finishPos[0];
    
    // 1. Проверяем, можем ли мы выиграть на этом ходу
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        const winningMove = validMoves.find(move => 
            move.row === finish.row && move.col === finish.col
        );
        
        if (winningMove) {
            // Выигрышный ход!
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
    
    // 2. Блокируем игрока, если он близко к победе
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        const humanDist = Math.abs(humanPlayer.row - humanFinish.row) + Math.abs(humanPlayer.col - humanFinish.col);
        if (humanDist <= 3) {
            // Игрок близко к победе, пытаемся заблокировать
            const emptyCells = getAllEmpty();
            const blockingCells = emptyCells.filter(cell => {
                // Клетки рядом с путем игрока к финишу
                const cellDistToHumanPath = Math.abs(cell.row - humanPlayer.row) + Math.abs(cell.col - humanPlayer.col);
                return cellDistToHumanPath <= 2;
            });
            
            if (blockingCells.length > 0) {
                // Размещаем тайл в блокирующей клетке
                const bestBlock = blockingCells[Math.floor(Math.random() * blockingCells.length)];
                
                // Сохраняем для возможной отмены (хотя ИИ не отменяет)
                state.lastTilePlacement = {
                    action: 'placeAnywhere',
                    row: bestBlock.row,
                    col: bestBlock.col,
                    previousCellState: { ...state.board[bestBlock.row][bestBlock.col] },
                    pointsUsed: COST.placeAnywhere,
                    nextTileTypeBefore: state.nextTileType,
                    nextTileRotationBefore: state.nextTileRotation
                };
                
                state.board[bestBlock.row][bestBlock.col] = {
                    ...state.board[bestBlock.row][bestBlock.col],
                    tileType: state.nextTileType,
                    rotation: state.nextTileRotation,
                    isEmpty: false
                };
                
                state.points -= COST.placeAnywhere;
                state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
                state.nextTileRotation = 0;
                
                updateStatus(`ИИ разместил тайл в (${bestBlock.row},${bestBlock.col}) для блокировки`);
                renderBoard();
                renderNextTile();
                
                // Продолжаем ход
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
    
    // 3. Используем среднюю стратегию
    return aiMediumStrategy();
}

function aiPerformMove() {
    const aiPlayer = state.players[1];
    const validMoves = getValidMoves(aiPlayer);
    
    if (validMoves.length === 0) {
        return false;
    }
    
    // Выбираем случайный ход
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    aiPlayer.row = randomMove.row;
    aiPlayer.col = randomMove.col;
    state.points -= COST.move;
    
    updateStatus(`ИИ переместился на (${randomMove.row},${randomMove.col})`);
    renderBoard();
    checkAiWin();
    
    // Продолжаем ход, если есть очки
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
    
    // Выбираем случайную соседнюю клетку
    const randomCell = adjacentEmpty[Math.floor(Math.random() * adjacentEmpty.length)];
    
    // Сохраняем для возможной отмены
    state.lastTilePlacement = {
        action: 'placeAdjacent',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.placeAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Place tile
    state.board[randomCell.row][randomCell.col] = {
        ...state.board[randomCell.row][randomCell.col],
        tileType: state.nextTileType,
        rotation: state.nextTileRotation,
        isEmpty: false
    };

    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил тайл рядом с фишкой в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    // Продолжаем ход
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
    
    // Выбираем случайную клетку
    const randomCell = allEmpty[Math.floor(Math.random() * allEmpty.length)];
    
    // Сохраняем для возможной отмены
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Place tile
    state.board[randomCell.row][randomCell.col] = {
        ...state.board[randomCell.row][randomCell.col],
        tileType: state.nextTileType,
        rotation: state.nextTileRotation,
        isEmpty: false
    };

    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    // Продолжаем ход
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
    
    // Выбираем случайный тайл для замены
    const randomCell = adjacentReplaceable[Math.floor(Math.random() * adjacentReplaceable.length)];
    
    // Сохраняем для возможной отмены
    state.lastTilePlacement = {
        action: 'replace',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.replaceAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Replace tile
    state.board[randomCell.row][randomCell.col].tileType = state.nextTileType;
    state.board[randomCell.row][randomCell.col].rotation = state.nextTileRotation;
    state.points -= COST.replaceAdjacent;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ заменил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    // Продолжаем ход
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
    
    // Выбираем случайный тайл для замены
    const randomCell = replaceable[Math.floor(Math.random() * replaceable.length)];
    
    // Сохраняем для возможной отмены
    state.lastTilePlacement = {
        action: 'replace',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Replace tile
    state.board[randomCell.row][randomCell.col].tileType = state.nextTileType;
    state.board[randomCell.row][randomCell.col].rotation = state.nextTileRotation;
    state.points -= COST.replace;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ заменил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    // Продолжаем ход
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

// Функция для установки режима игры с ИИ
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

// Функция для установки сложности ИИ
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
    
    // Hide settings panel
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

// Добавляем обработчик для кнопки отмены
document.getElementById('btn-undo').addEventListener('click', undoLastPlacement);

// Добавляем обработчики для кнопок ИИ
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