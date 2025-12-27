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

// Функция для проверки, создает ли тайл путь к цели
function createsPathToTarget(row, col, tileType, rotation, targetRow, targetCol) {
    // Проверяем, соединяется ли тайл с существующими путями
    if (tileConnectsToNeighbors(row, col, tileType, rotation)) {
        return true;
    }
    
    // Проверяем расстояние до цели
    const distToTarget = Math.abs(row - targetRow) + Math.abs(col - targetCol);
    return distToTarget < 4; // Если близко к цели, все равно размещаем
}

// Функция для хода ИИ
function aiTurn() {
    if (state.phase === 'roll') {
        // ИИ бросает кубик
        rollDice();
        return;
    }
    
    if (state.phase !== 'action' || state.currentPlayer !== 1) return;
    
    const delay = state.aiDifficulty === 'easy' ? 1500 : state.aiDifficulty === 'medium' ? 1000 : 500;
    
    setTimeout(() => {
        aiMakeDecision();
    }, delay);
}

// Основная функция принятия решений ИИ
function aiMakeDecision() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // В зависимости от сложности выбираем стратегию
    if (state.aiDifficulty === 'easy') {
        aiEasyStrategy();
    } else if (state.aiDifficulty === 'medium') {
        aiMediumStrategy();
    } else {
        aiHardStrategy();
    }
}

// Легкий ИИ: случайные действия, но старается создавать соединения
function aiEasyStrategy() {
    const aiPlayer = state.players[1];
    const availableActions = [];
    
    // Собираем все доступные действия
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        availableActions.push({type: 'move', cost: COST.move});
    }
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        availableActions.push({type: 'placeAdjacent', cost: COST.placeAdjacent});
    }
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        availableActions.push({type: 'placeAnywhere', cost: COST.placeAnywhere});
    }
    if (state.points >= COST.replaceAdjacent && hasAdjacentReplaceable()) {
        availableActions.push({type: 'replaceAdjacent', cost: COST.replaceAdjacent});
    }
    if (state.points >= COST.replace && hasReplaceable()) {
        availableActions.push({type: 'replace', cost: COST.replace});
    }
    
    if (availableActions.length === 0) {
        // Если нет доступных действий, завершаем ход
        updateStatus('ИИ завершает ход.');
        setTimeout(() => {
            endTurn();
        }, 500);
        return;
    }
    
    // Сортируем действия по приоритету: движение -> размещение рядом -> остальное
    const actionPriority = {
        'move': 5,
        'placeAdjacent': 4,
        'placeAnywhere': 3,
        'replaceAdjacent': 2,
        'replace': 1
    };
    
    availableActions.sort((a, b) => actionPriority[b.type] - actionPriority[a.type]);
    
    // Выбираем лучшее доступное действие
    const bestAction = availableActions[0];
    
    // Выполняем действие
    switch (bestAction.type) {
        case 'move':
            aiPerformSmartMove();
            break;
        case 'placeAdjacent':
            aiPerformSmartPlaceAdjacent();
            break;
        case 'placeAnywhere':
            aiPerformSmartPlaceAnywhere();
            break;
        case 'replaceAdjacent':
            aiPerformReplaceAdjacent();
            break;
        case 'replace':
            aiPerformReplace();
            break;
    }
}

// Средний ИИ: стратегическое движение и создание путей
function aiMediumStrategy() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // 1. Попробовать двигаться к финишу
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        
        if (validMoves.length > 0) {
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
            
            // Выполняем лучший ход
            aiPlayer.row = bestMove.row;
            aiPlayer.col = bestMove.col;
            state.points -= COST.move;
            
            updateStatus(`ИИ переместился на (${bestMove.row},${bestMove.col})`);
            renderBoard();
            
            // Проверяем победу
            if (checkWin(aiPlayer, state.board[bestMove.row][bestMove.col])) {
                setTimeout(() => {
                    showWinModal();
                }, 500);
                return;
            }
            
            // Продолжаем ход, если есть очки
            if (state.points > 0) {
                setTimeout(aiTurn, 800);
            } else {
                updateStatus('ИИ завершает ход.');
                setTimeout(() => {
                    endTurn();
                }, 1000);
            }
            return;
        }
    }
    
    // 2. Размещаем соединяющие тайлы рядом
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        aiPerformSmartPlaceAdjacent();
        return;
    }
    
    // 3. Размещаем тайлы для создания пути к финишу
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        aiPerformStrategicPlaceAnywhere();
        return;
    }
    
    // 4. Если ничего не можем, используем легкую стратегию
    aiEasyStrategy();
}

// Сложный ИИ: улучшенная стратегия с блокировкой противника
function aiHardStrategy() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const humanPlayer = state.players[0];
    const humanFinish = state.finishPos[0];
    
    // 1. Проверяем выигрышный ход
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
            return;
        }
    }
    
    // 2. Блокируем игрока, если он близко к победе
    const humanDist = Math.abs(humanPlayer.row - humanFinish.row) + Math.abs(humanPlayer.col - humanFinish.col);
    if (humanDist <= 3 && state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        const allEmpty = getAllEmpty();
        const blockingCells = allEmpty.filter(cell => {
            // Клетки рядом с путем игрока к финишу
            const cellDistToHumanPath = Math.abs(cell.row - humanPlayer.row) + Math.abs(cell.col - humanPlayer.col);
            return cellDistToHumanPath <= 2;
        });
        
        if (blockingCells.length > 0) {
            // Размещаем тайл в блокирующей клетке
            const bestBlock = blockingCells[Math.floor(Math.random() * blockingCells.length)];
            
            // Используем тупиковый тайл для блокировки
            const blockingTile = 3; // Turn top to top-right (не прямой)
            const bestRotation = getBestRotationForTile(bestBlock.row, bestBlock.col, blockingTile);
            
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
            return;
        }
    }
    
    // 3. Используем среднюю стратегию
    aiMediumStrategy();
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

// Умное движение ИИ (выбирает ход, который создает больше возможностей)
function aiPerformSmartMove() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const validMoves = getValidMoves(aiPlayer);
    
    if (validMoves.length === 0) {
        return false;
    }
    
    // Оцениваем каждый возможный ход
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    
    for (const move of validMoves) {
        let score = 0;
        
        // 1. Приближение к финишу
        const currentDist = Math.abs(aiPlayer.row - finish.row) + Math.abs(aiPlayer.col - finish.col);
        const newDist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
        score += (currentDist - newDist) * 10; // Чем ближе, тем лучше
        
        // 2. Количество возможных ходов с новой позиции
        // Временно перемещаем фишку для оценки
        const tempRow = aiPlayer.row;
        const tempCol = aiPlayer.col;
        aiPlayer.row = move.row;
        aiPlayer.col = move.col;
        
        const futureMoves = getValidMoves(aiPlayer).length;
        score += futureMoves * 5;
        
        // Возвращаем фишку
        aiPlayer.row = tempRow;
        aiPlayer.col = tempCol;
        
        // 3. Соединение с существующими путями
        const cell = state.board[move.row][move.col];
        if (!cell.isEmpty && cell.tileType !== null) {
            score += 15;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    // Выполняем лучший ход
    aiPlayer.row = bestMove.row;
    aiPlayer.col = bestMove.col;
    state.points -= COST.move;
    
    updateStatus(`ИИ переместился на (${bestMove.row},${bestMove.col})`);
    renderBoard();
    
    // Проверяем победу
    if (checkWin(aiPlayer, state.board[bestMove.row][bestMove.col])) {
        setTimeout(() => {
            showWinModal();
        }, 500);
        return true;
    }
    
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

// Умное размещение тайла рядом (создает соединения)
function aiPerformSmartPlaceAdjacent() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    
    if (adjacentEmpty.length === 0) {
        return false;
    }
    
    // Оцениваем каждую клетку
    let bestCell = null;
    let bestScore = -Infinity;
    
    for (const cell of adjacentEmpty) {
        let score = 0;
        
        // 1. Соединение с существующими тайлами
        const bestRotation = getBestRotationForTile(cell.row, cell.col, state.nextTileType);
        const connections = countTileConnections(cell.row, cell.col, state.nextTileType, bestRotation);
        score += connections * 20;
        
        // 2. Приближение к финишу
        const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
        score -= distToFinish; // Чем ближе, тем лучше
        
        // 3. Создание пути для будущих движений
        const distToAi = Math.abs(cell.row - aiPlayer.row) + Math.abs(cell.col - aiPlayer.col);
        if (distToAi <= 2) {
            score += 10;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestCell = cell;
        }
    }
    
    if (!bestCell) {
        bestCell = adjacentEmpty[Math.floor(Math.random() * adjacentEmpty.length)];
    }
    
    // Находим оптимальный поворот
    const bestRotation = getBestRotationForTile(bestCell.row, bestCell.col, state.nextTileType);
    
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

    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил соединяющий тайл в (${bestCell.row},${bestCell.col})`);
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

// Стратегическое размещение тайла в любом месте (создает путь к финишу)
function aiPerformStrategicPlaceAnywhere() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        return false;
    }
    
    // Ищем клетки на пути к финишу
    const pathCells = [];
    const otherCells = [];
    
    for (const cell of allEmpty) {
        const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
        const distToAi = Math.abs(cell.row - aiPlayer.row) + Math.abs(cell.col - aiPlayer.col);
        
        // Клетки на пути между ИИ и финишем
        if (distToFinish < 6 && distToAi < 6) {
            pathCells.push(cell);
        } else {
            otherCells.push(cell);
        }
    }
    
    let targetCell;
    if (pathCells.length > 0) {
        // Выбираем лучшую клетку на пути
        let bestCell = pathCells[0];
        let bestScore = -Infinity;
        
        for (const cell of pathCells) {
            let score = 0;
            
            // 1. Соединение с существующими тайлами
            const bestRotation = getBestRotationForTile(cell.row, cell.col, state.nextTileType);
            const connections = countTileConnections(cell.row, cell.col, state.nextTileType, bestRotation);
            score += connections * 25;
            
            // 2. Расстояние до финиша (чем ближе, тем лучше)
            const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
            score -= distToFinish * 2;
            
            // 3. Расстояние до ИИ (не слишком близко, не слишком далеко)
            const distToAi = Math.abs(cell.row - aiPlayer.row) + Math.abs(cell.col - aiPlayer.col);
            if (distToAi >= 2 && distToAi <= 4) {
                score += 15;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestCell = cell;
            }
        }
        
        targetCell = bestCell;
    } else {
        // Выбираем случайную клетку
        targetCell = allEmpty[Math.floor(Math.random() * allEmpty.length)];
    }
    
    // Находим оптимальный поворот
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: targetCell.row,
        col: targetCell.col,
        previousCellState: { ...state.board[targetCell.row][targetCell.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[targetCell.row][targetCell.col] = {
        ...state.board[targetCell.row][targetCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };

    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ создал путь в (${targetCell.row},${targetCell.col})`);
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

// Умное размещение тайла в любом месте (упрощенная версия)
function aiPerformSmartPlaceAnywhere() {
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        return false;
    }
    
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // Ищем клетку, которая лучше всего соединяется
    let bestCell = null;
    let maxConnections = -1;
    
    for (const cell of allEmpty) {
        const rotation = getBestRotationForTile(cell.row, cell.col, state.nextTileType);
        const connections = countTileConnections(cell.row, cell.col, state.nextTileType, rotation);
        
        if (connections > maxConnections) {
            maxConnections = connections;
            bestCell = cell;
        }
    }
    
    if (!bestCell) {
        bestCell = allEmpty[Math.floor(Math.random() * allEmpty.length)];
    }
    
    const bestRotation = getBestRotationForTile(bestCell.row, bestCell.col, state.nextTileType);
    
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

    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил тайл в (${bestCell.row},${bestCell.col})`);
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

// Замена соседнего тайла (улучшает соединения)
function aiPerformReplaceAdjacent() {
    const adjacentReplaceable = getAdjacentReplaceable();
    
    if (adjacentReplaceable.length === 0) {
        return false;
    }
    
    // Ищем тайл с плохими соединениями
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
        worstCell = adjacentReplaceable[Math.floor(Math.random() * adjacentReplaceable.length)];
    }
    
    // Находим оптимальный поворот для текущего тайла
    const bestRotation = getBestRotationForTile(worstCell.row, worstCell.col, state.nextTileType);
    
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
    state.points -= COST.replaceAdjacent;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ улучшил соединения в (${worstCell.row},${worstCell.col})`);
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

// Замена любого тайла (улучшает соединения)
function aiPerformReplace() {
    const replaceable = getReplaceable();
    
    if (replaceable.length === 0) {
        return false;
    }
    
    // Ищем тайл с наименьшим количеством соединений
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
        worstCell = replaceable[Math.floor(Math.random() * replaceable.length)];
    }
    
    const bestRotation = getBestRotationForTile(worstCell.row, worstCell.col, state.nextTileType);
    
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
    state.points -= COST.replace;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ улучшил тайл в (${worstCell.row},${worstCell.col})`);
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

// Добавляем обработчики для кнопок ИИ в основной файл
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