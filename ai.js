// Функция для проверки, соединяет ли тайл с соседними тайлами
function tileConnectsToNeighbors(row, col, tileType, rotation) {
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

// Функция для получения оптимального поворота тайла для максимального соединения
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

// Функция для хода ИИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiTurn() {
    console.log("AI turn called, phase:", state.phase, "currentPlayer:", state.currentPlayer, "points:", state.points);
    
    // Если ИИ уже думает, не запускаем новый ход
    if (state.aiThinking) {
        console.log("AI already thinking, skipping");
        return;
    }
    
    // Проверяем, что сейчас ход ИИ
    if (!state.aiOpponent || state.currentPlayer !== 1) {
        console.log("Not AI turn or AI not opponent");
        return;
    }
    
    state.aiThinking = true;
    
    if (state.phase === 'roll') {
        updateStatus('🤖 ИИ бросает кубик...');
        setTimeout(() => {
            rollDice();
            state.aiThinking = false;
        }, 1000);
        return;
    }
    
    if (state.phase !== 'action') {
        console.log("Not action phase, AI can't act");
        state.aiThinking = false;
        return;
    }
    
    const delay = state.aiDifficulty === 'easy' ? 1000 : state.aiDifficulty === 'medium' ? 800 : 400;
    
    updateStatus(`🤖 ИИ думает (${state.aiDifficulty === 'easy' ? 'легкий' : state.aiDifficulty === 'medium' ? 'средний' : 'сложный'})...`);
    
    setTimeout(() => {
        console.log("AI making decision with points:", state.points);
        aiMakeDecision();
    }, delay);
}

// Основная функция принятия решений ИИ
function aiMakeDecision() {
    console.log("AI make decision started with points:", state.points);
    
    // Если нет очков, завершаем ход
    if (state.points <= 0) {
        console.log("No points left, ending turn");
        updateStatus('🤖 ИИ: очки закончились');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 500);
        return;
    }
    
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // Проверяем доступные действия
    let actionTaken = false;
    
    // Приоритет 1: Движение к финишу (если есть 1 очко и можно двигаться)
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        if (validMoves.length > 0) {
            console.log("AI can move, choosing best move");
            actionTaken = aiPerformSmartMove(aiPlayer, finish);
            if (actionTaken) return;
        }
    }
    
    // Приоритет 2: Разместить тайл рядом, который создает соединения (2 очка)
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        console.log("AI can place adjacent tile");
        actionTaken = aiPerformSmartPlaceAdjacent(aiPlayer, finish);
        if (actionTaken) return;
    }
    
    // Приоритет 3: Разместить тайл в любом месте, создающий путь (4 очка)
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        console.log("AI can place anywhere");
        actionTaken = aiPerformSmartPlaceAnywhere(aiPlayer, finish);
        if (actionTaken) return;
    }
    
    // Приоритет 4: Заменить соседний тайл на лучший (5 очков)
    if (state.points >= COST.replaceAdjacent && hasAdjacentReplaceable()) {
        console.log("AI can replace adjacent");
        actionTaken = aiPerformSmartReplaceAdjacent(aiPlayer);
        if (actionTaken) return;
    }
    
    // Приоритет 5: Заменить любой тайл на лучший (6 очков)
    if (state.points >= COST.replace && hasReplaceable()) {
        console.log("AI can replace any");
        actionTaken = aiPerformSmartReplace(aiPlayer);
        if (actionTaken) return;
    }
    
    // Если ничего не получилось, завершаем ход
    console.log("AI couldn't take any action, ending turn");
    updateStatus('🤖 ИИ: не может выполнить действия');
    state.aiThinking = false;
    setTimeout(() => {
        endTurn();
    }, 500);
}

// Умное движение ИИ
function aiPerformSmartMove(aiPlayer, finish) {
    const validMoves = getValidMoves(aiPlayer);
    
    if (validMoves.length === 0) {
        console.log("No valid moves available");
        return false;
    }
    
    // Ищем ход, который приближает к финишу
    let bestMove = validMoves[0];
    let bestDist = Math.abs(bestMove.row - finish.row) + Math.abs(bestMove.col - finish.col);
    
    for (const move of validMoves) {
        const dist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
        if (dist < bestDist) {
            bestDist = dist;
            bestMove = move;
        }
    }
    
    // Выполняем ход
    const previousRow = aiPlayer.row;
    const previousCol = aiPlayer.col;
    
    aiPlayer.row = bestMove.row;
    aiPlayer.col = bestMove.col;
    state.points -= COST.move;
    
    updateStatus(`🤖 ИИ переместился с (${previousRow},${previousCol}) на (${bestMove.row},${bestMove.col}) [${state.points} очков осталось]`);
    renderBoard();
    
    // Проверяем победу
    if (checkWin(aiPlayer, state.board[bestMove.row][bestMove.col])) {
        setTimeout(() => {
            showWinModal();
        }, 500);
        state.aiThinking = false;
        return true;
    }
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
    
    return true;
}

// Умное размещение тайла рядом
function aiPerformSmartPlaceAdjacent(aiPlayer, finish) {
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    
    if (adjacentEmpty.length === 0) {
        console.log("No adjacent empty cells");
        return false;
    }
    
    // Ищем клетку, где тайл будет максимально соединяться
    let bestCell = null;
    let bestRotation = 0;
    let maxConnections = -1;
    
    for (const cell of adjacentEmpty) {
        const rotation = getBestRotationForTile(cell.row, cell.col, state.nextTileType);
        const connections = countTileConnections(cell.row, cell.col, state.nextTileType, rotation);
        
        // Также учитываем расстояние до финиша
        const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
        const score = connections * 10 - distToFinish;
        
        if (score > maxConnections || (score === maxConnections && connections > 0)) {
            maxConnections = score;
            bestCell = cell;
            bestRotation = rotation;
        }
    }
    
    if (!bestCell) {
        // Если не нашли хорошую клетку, берем первую
        bestCell = adjacentEmpty[0];
        bestRotation = getBestRotationForTile(bestCell.row, bestCell.col, state.nextTileType);
    }
    
    // Проверяем, что тайл будет хоть с кем-то соединяться
    const connections = countTileConnections(bestCell.row, bestCell.col, state.nextTileType, bestRotation);
    if (connections === 0 && state.aiDifficulty !== 'easy') {
        console.log("Tile wouldn't connect, trying different action");
        return false; // Пробуем другое действие
    }
    
    // Размещаем тайл
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

    const previousPoints = state.points;
    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ разместил тайл рядом в (${bestCell.row},${bestCell.col}) [${previousPoints} → ${state.points} очков]`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
    
    return true;
}

// Умное размещение тайла в любом месте
function aiPerformSmartPlaceAnywhere(aiPlayer, finish) {
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        console.log("No empty cells on board");
        return false;
    }
    
    // Ищем клетку, которая создает путь к финишу
    let bestCell = null;
    let bestRotation = 0;
    let bestScore = -Infinity;
    
    for (const cell of allEmpty) {
        const rotation = getBestRotationForTile(cell.row, cell.col, state.nextTileType);
        const connections = countTileConnections(cell.row, cell.col, state.nextTileType, rotation);
        
        // Оценка: соединения важны, но также важно приближение к финишу
        const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
        const distToAi = Math.abs(cell.row - aiPlayer.row) + Math.abs(cell.col - aiPlayer.col);
        
        let score = connections * 15;
        score -= distToFinish * 2; // Чем ближе к финишу, тем лучше
        score -= Math.abs(distToAi - 3) * 3; // Оптимальное расстояние от ИИ: 3 клетки
        
        if (score > bestScore) {
            bestScore = score;
            bestCell = cell;
            bestRotation = rotation;
        }
    }
    
    if (!bestCell) {
        bestCell = allEmpty[0];
        bestRotation = getBestRotationForTile(bestCell.row, bestCell.col, state.nextTileType);
    }
    
    // Размещаем тайл
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: bestCell.row,
        col: bestCell.col,
        previousCellState: { ...state.board[bestCell.row][bestCell.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[bestCell.row][bestCell.col] = {
        ...state.board[bestCell.row][bestCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };

    const previousPoints = state.points;
    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ разместил тайл в (${bestCell.row},${bestCell.col}) [${previousPoints} → ${state.points} очков]`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
    
    return true;
}

// Умная замена соседнего тайла
function aiPerformSmartReplaceAdjacent(aiPlayer) {
    const adjacentReplaceable = getAdjacentReplaceable();
    
    if (adjacentReplaceable.length === 0) {
        console.log("No adjacent replaceable tiles");
        return false;
    }
    
    // Ищем тайл с минимальным количеством соединений
    let worstCell = null;
    let minConnections = Infinity;
    
    for (const cell of adjacentReplaceable) {
        const tile = state.board[cell.row][cell.col];
        const connections = countTileConnections(cell.row, cell.col, tile.tileType, tile.rotation);
        
        if (connections < minConnections) {
            minConnections = connections;
            worstCell = cell;
        }
    }
    
    if (!worstCell) {
        worstCell = adjacentReplaceable[0];
    }
    
    // Проверяем, улучшит ли замена соединения
    const bestRotation = getBestRotationForTile(worstCell.row, worstCell.col, state.nextTileType);
    const newConnections = countTileConnections(worstCell.row, worstCell.col, state.nextTileType, bestRotation);
    
    if (newConnections <= minConnections && state.aiDifficulty !== 'easy') {
        console.log("Replacement wouldn't improve connections, skipping");
        return false;
    }
    
    // Заменяем тайл
    state.lastTilePlacement = {
        action: 'replace',
        row: worstCell.row,
        col: worstCell.col,
        previousCellState: { ...state.board[worstCell.row][worstCell.col] },
        pointsUsed: COST.replaceAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[worstCell.row][worstCell.col].tileType = state.nextTileType;
    state.board[worstCell.row][worstCell.col].rotation = bestRotation;
    
    const previousPoints = state.points;
    state.points -= COST.replaceAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ улучшил тайл в (${worstCell.row},${worstCell.col}) [${previousPoints} → ${state.points} очков]`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
    
    return true;
}

// Умная замена любого тайла
function aiPerformSmartReplace(aiPlayer) {
    const replaceable = getReplaceable();
    
    if (replaceable.length === 0) {
        console.log("No replaceable tiles");
        return false;
    }
    
    // Ищем тайл с минимальным количеством соединений
    let worstCell = null;
    let minConnections = Infinity;
    
    for (const cell of replaceable) {
        const tile = state.board[cell.row][cell.col];
        const connections = countTileConnections(cell.row, cell.col, tile.tileType, tile.rotation);
        
        if (connections < minConnections) {
            minConnections = connections;
            worstCell = cell;
        }
    }
    
    if (!worstCell) {
        worstCell = replaceable[0];
    }
    
    const bestRotation = getBestRotationForTile(worstCell.row, worstCell.col, state.nextTileType);
    
    // Заменяем тайл
    state.lastTilePlacement = {
        action: 'replace',
        row: worstCell.row,
        col: worstCell.col,
        previousCellState: { ...state.board[worstCell.row][worstCell.col] },
        pointsUsed: COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[worstCell.row][worstCell.col].tileType = state.nextTileType;
    state.board[worstCell.row][worstCell.col].rotation = bestRotation;
    
    const previousPoints = state.points;
    state.points -= COST.replace;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ заменил тайл в (${worstCell.row},${worstCell.col}) [${previousPoints} → ${state.points} очков]`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
    
    return true;
}

// Вспомогательная функция для подсчета соединений тайла
function countTileConnections(row, col, tileType, rotation) {
    const neighbors = getNeighbors(row, col);
    const edges = rotateEdges(TILE_TYPES[tileType], rotation);
    
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
    
    return connections;
}

// Функция для установки режима игры с ИИ
function setAiMode(enable) {
    state.aiOpponent = enable;
    if (enable) {
        state.numPlayers = 2;
        document.querySelectorAll('.mode-btn[data-players]').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.players) === 2);
        });
        updateStatus('Режим против ИИ включен!');
    } else {
        updateStatus('Режим против ИИ выключен');
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

// Проверка победы ИИ
function checkAiWin() {
    const aiPlayer = state.players[1];
    
    if (checkWin(aiPlayer, state.board[aiPlayer.row][aiPlayer.col])) {
        setTimeout(() => {
            showWinModal();
        }, 500);
        return true;
    }
    return false;
}

// Функция для принудительного завершения хода ИИ
function forceEndAiTurn() {
    if (state.aiOpponent && state.currentPlayer === 1 && state.aiThinking) {
        console.log("Force ending AI turn");
        state.aiThinking = false;
        updateStatus('🤖 Ход ИИ принудительно завершен');
        setTimeout(() => {
            endTurn();
        }, 300);
    }
}

// Добавляем обработчики для кнопок ИИ
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Модифицируем кнопку завершения хода для работы с ИИ
    const endTurnBtn = document.getElementById('btn-end');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', function() {
            if (state.aiOpponent && state.currentPlayer === 1) {
                forceEndAiTurn();
            } else {
                endTurn();
            }
        });
    }
    
    // Инициализируем состояние ИИ
    state.aiThinking = false;
    state.aiStatus = '';
});

// Патчим оригинальные функции для правильной работы с ИИ
(function() {
    // Сохраняем оригинальные функции
    const originalEndTurn = window.endTurn;
    const originalRollDice = window.rollDice;
    
    // Патчим endTurn для сброса флага ИИ
    window.endTurn = function() {
        state.aiThinking = false;
        if (originalEndTurn) {
            originalEndTurn();
        }
    };
    
    // Патчим rollDice для обработки ИИ
    window.rollDice = function() {
        if (originalRollDice) {
            originalRollDice();
        }
    };
})();