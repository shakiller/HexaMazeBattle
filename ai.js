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

// Функция для хода ИИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiTurn() {
    console.log("AI turn called, phase:", state.phase, "currentPlayer:", state.currentPlayer);
    
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
            // После броска кубика, следующий ход будет в action phase
        }, 1000);
        return;
    }
    
    if (state.phase !== 'action') {
        console.log("Not action phase, AI can't act");
        state.aiThinking = false;
        return;
    }
    
    const delay = state.aiDifficulty === 'easy' ? 1500 : state.aiDifficulty === 'medium' ? 1000 : 500;
    
    updateStatus(`🤖 ИИ думает (${state.aiDifficulty === 'easy' ? 'легкий' : state.aiDifficulty === 'medium' ? 'средний' : 'сложный'})...`);
    
    setTimeout(() => {
        console.log("AI making decision with points:", state.points);
        aiMakeDecision();
    }, delay);
}

// Основная функция принятия решений ИИ
function aiMakeDecision() {
    console.log("AI make decision started");
    
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
    
    console.log("Available AI actions:", availableActions);
    
    if (availableActions.length === 0) {
        // Если нет доступных действий, завершаем ход
        console.log("No available actions, ending turn");
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 500);
        return;
    }
    
    // В зависимости от сложности выбираем стратегию
    if (state.aiDifficulty === 'easy') {
        aiEasyStrategy(availableActions);
    } else if (state.aiDifficulty === 'medium') {
        aiMediumStrategy(availableActions);
    } else {
        aiHardStrategy(availableActions);
    }
}

// Легкий ИИ: случайные действия, но старается создавать соединения
function aiEasyStrategy(availableActions) {
    console.log("AI easy strategy");
    
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
function aiMediumStrategy(availableActions) {
    console.log("AI medium strategy");
    
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
            
            updateStatus(`🤖 ИИ переместился на (${bestMove.row},${bestMove.col})`);
            renderBoard();
            
            // Проверяем победу
            if (checkWin(aiPlayer, state.board[bestMove.row][bestMove.col])) {
                setTimeout(() => {
                    showWinModal();
                }, 500);
                state.aiThinking = false;
                return;
            }
            
            // Продолжаем ход, если есть очки
            if (state.points > 0) {
                setTimeout(aiTurn, 800);
            } else {
                updateStatus('🤖 ИИ завершает ход.');
                state.aiThinking = false;
                setTimeout(() => {
                    endTurn();
                }, 1000);
            }
            return;
        }
    }
    
    // 2. Если движение недоступно или невыгодно, используем легкую стратегию
    aiEasyStrategy(availableActions);
}

// Сложный ИИ: улучшенная стратегия с блокировкой противника
function aiHardStrategy(availableActions) {
    console.log("AI hard strategy");
    
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
            
            updateStatus(`🤖 ИИ переместился на финиш!`);
            renderBoard();
            state.aiThinking = false;
            setTimeout(() => {
                showWinModal();
            }, 500);
            return;
        }
    }
    
    // 2. Используем среднюю стратегию
    aiMediumStrategy(availableActions);
}

// Умное движение ИИ (выбирает ход, который создает больше возможностей)
function aiPerformSmartMove() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const validMoves = getValidMoves(aiPlayer);
    
    if (validMoves.length === 0) {
        console.log("No valid moves for AI");
        state.aiThinking = false;
        aiMakeDecision(); // Пробуем другое действие
        return;
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
    
    updateStatus(`🤖 ИИ переместился на (${bestMove.row},${bestMove.col})`);
    renderBoard();
    
    // Проверяем победу
    if (checkWin(aiPlayer, state.board[bestMove.row][bestMove.col])) {
        state.aiThinking = false;
        setTimeout(() => {
            showWinModal();
        }, 500);
        return;
    }
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
}

// Умное размещение тайла рядом (создает соединения)
function aiPerformSmartPlaceAdjacent() {
    const aiPlayer = state.players[1];
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    
    if (adjacentEmpty.length === 0) {
        console.log("No adjacent empty cells");
        state.aiThinking = false;
        aiMakeDecision(); // Пробуем другое действие
        return;
    }
    
    // Выбираем случайную клетку рядом
    const randomCell = adjacentEmpty[Math.floor(Math.random() * adjacentEmpty.length)];
    
    // Находим оптимальный поворот
    const bestRotation = getBestRotationForTile(randomCell.row, randomCell.col, state.nextTileType);
    
    // Размещаем тайл
    state.lastTilePlacement = {
        action: 'placeAdjacent',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.placeAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[randomCell.row][randomCell.col] = {
        ...state.board[randomCell.row][randomCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };

    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ разместил тайл рядом в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
}

// Умное размещение тайла в любом месте (упрощенная версия)
function aiPerformSmartPlaceAnywhere() {
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        console.log("No empty cells on board");
        state.aiThinking = false;
        aiMakeDecision(); // Пробуем другое действие
        return;
    }
    
    // Выбираем случайную пустую клетку
    const randomCell = allEmpty[Math.floor(Math.random() * allEmpty.length)];
    
    const bestRotation = getBestRotationForTile(randomCell.row, randomCell.col, state.nextTileType);
    
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[randomCell.row][randomCell.col] = {
        ...state.board[randomCell.row][randomCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };

    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ разместил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
}

// Замена соседнего тайла (улучшает соединения)
function aiPerformReplaceAdjacent() {
    const adjacentReplaceable = getAdjacentReplaceable();
    
    if (adjacentReplaceable.length === 0) {
        console.log("No adjacent replaceable tiles");
        state.aiThinking = false;
        aiMakeDecision(); // Пробуем другое действие
        return;
    }
    
    // Выбираем случайный соседний тайл
    const randomCell = adjacentReplaceable[Math.floor(Math.random() * adjacentReplaceable.length)];
    
    // Находим оптимальный поворот для текущего тайла
    const bestRotation = getBestRotationForTile(randomCell.row, randomCell.col, state.nextTileType);
    
    state.lastTilePlacement = {
        action: 'replace',
        row: randomCell.row,
        col: randomCell.col,
        previousCellState: { ...state.board[randomCell.row][randomCell.col] },
        pointsUsed: COST.replaceAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    state.board[randomCell.row][randomCell.col].tileType = state.nextTileType;
    state.board[randomCell.row][randomCell.col].rotation = bestRotation;
    state.points -= COST.replaceAdjacent;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ заменил соседний тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
}

// Замена любого тайла (улучшает соединения)
function aiPerformReplace() {
    const replaceable = getReplaceable();
    
    if (replaceable.length === 0) {
        console.log("No replaceable tiles");
        state.aiThinking = false;
        aiMakeDecision(); // Пробуем другое действие
        return;
    }
    
    // Выбираем случайный тайл
    const randomCell = replaceable[Math.floor(Math.random() * replaceable.length)];
    
    const bestRotation = getBestRotationForTile(randomCell.row, randomCell.col, state.nextTileType);
    
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
    state.board[randomCell.row][randomCell.col].rotation = bestRotation;
    state.points -= COST.replace;
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`🤖 ИИ заменил тайл в (${randomCell.row},${randomCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        setTimeout(aiTurn, 800);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 1000);
    }
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
    
    // Инициализируем состояние ИИ
    state.aiThinking = false;
    state.aiStatus = '';
});