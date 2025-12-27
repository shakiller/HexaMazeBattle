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

// Легкий ИИ: случайные действия
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
    
    // Выбираем случайное действие
    const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
    
    // Выполняем действие
    switch (randomAction.type) {
        case 'move':
            aiPerformMove();
            break;
        case 'placeAdjacent':
            aiPerformPlaceAdjacent();
            break;
        case 'placeAnywhere':
            aiPerformPlaceAnywhere();
            break;
        case 'replaceAdjacent':
            aiPerformReplaceAdjacent();
            break;
        case 'replace':
            aiPerformReplace();
            break;
    }
}

// Средний ИИ: пытается двигаться к финишу
function aiMediumStrategy() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // 1. Попробовать двигаться к финишу
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        
        // Ищем ход, который приближает к финишу
        let bestMove = null;
        let bestDist = Infinity;
        
        for (const move of validMoves) {
            const dist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
            if (dist < bestDist) {
                bestDist = dist;
                bestMove = move;
            }
        }
        
        if (bestMove) {
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
    
    // 2. Если нельзя двигаться, размещаем тайлы для создания пути
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        aiPerformPlaceAdjacentStrategic();
        return;
    }
    
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        aiPerformPlaceAnywhereStrategic();
        return;
    }
    
    // 3. Если ничего не можем, используем легкую стратегию
    aiEasyStrategy();
}

// Сложный ИИ: стратегическая игра
function aiHardStrategy() {
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    const humanPlayer = state.players[0];
    
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
    
    // 2. Используем среднюю стратегию с улучшениями
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

// Стратегическое размещение тайла рядом
function aiPerformPlaceAdjacentStrategic() {
    const aiPlayer = state.players[1];
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    
    if (adjacentEmpty.length === 0) {
        return false;
    }
    
    // Выбираем клетку, которая ведет к финишу
    const finish = state.finishPos[1];
    let bestCell = adjacentEmpty[0];
    let bestDist = Math.abs(bestCell.row - finish.row) + Math.abs(bestCell.col - finish.col);
    
    for (const cell of adjacentEmpty) {
        const dist = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
        if (dist < bestDist) {
            bestDist = dist;
            bestCell = cell;
        }
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
        rotation: state.nextTileRotation,
        isEmpty: false
    };

    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил стратегический тайл в (${bestCell.row},${bestCell.col})`);
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

// Стратегическое размещение тайла в любом месте
function aiPerformPlaceAnywhereStrategic() {
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        return false;
    }
    
    const finish = state.finishPos[1];
    const aiPlayer = state.players[1];
    
    // Ищем клетки на пути к финишу
    const pathCells = allEmpty.filter(cell => {
        const distToFinish = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
        const distToAi = Math.abs(cell.row - aiPlayer.row) + Math.abs(cell.col - aiPlayer.col);
        return distToFinish < 6 && distToAi < 6;
    });
    
    let targetCell;
    if (pathCells.length > 0) {
        // Выбираем случайную клетку на пути
        targetCell = pathCells[Math.floor(Math.random() * pathCells.length)];
    } else {
        // Или случайную клетку
        targetCell = allEmpty[Math.floor(Math.random() * allEmpty.length)];
    }
    
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
        rotation: state.nextTileRotation,
        isEmpty: false
    };

    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил стратегический тайл в (${targetCell.row},${targetCell.col})`);
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

// Простое движение ИИ
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
    
    // Проверяем победу
    if (checkWin(aiPlayer, state.board[randomMove.row][randomMove.col])) {
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

// Простое размещение тайла рядом
function aiPerformPlaceAdjacent() {
    const aiPlayer = state.players[1];
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    
    if (adjacentEmpty.length === 0) {
        return false;
    }
    
    // Выбираем случайную соседнюю клетку
    const randomCell = adjacentEmpty[Math.floor(Math.random() * adjacentEmpty.length)];
    
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
        rotation: state.nextTileRotation,
        isEmpty: false
    };

    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    updateStatus(`ИИ разместил тайл рядом в (${randomCell.row},${randomCell.col})`);
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

// Простое размещение тайла в любом месте
function aiPerformPlaceAnywhere() {
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        return false;
    }
    
    const randomCell = allEmpty[Math.floor(Math.random() * allEmpty.length)];
    
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
        rotation: state.nextTileRotation,
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

// Замена соседнего тайла
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
    
    state.board[randomCell.row][randomCell.col].tileType = state.nextTileType;
    state.board[randomCell.row][randomCell.col].rotation = state.nextTileRotation;
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

// Замена любого тайла
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