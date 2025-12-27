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
    const availableActions = [];
    
    // Собираем все доступные действия
    if (state.points >= COST.move && canMoveAnywhere(aiPlayer)) {
        const validMoves = getValidMoves(aiPlayer);
        if (validMoves.length > 0) {
            availableActions.push({type: 'move', cost: COST.move, possible: true});
        }
    }
    if (state.points >= COST.placeAdjacent && hasAdjacentEmpty(aiPlayer)) {
        availableActions.push({type: 'placeAdjacent', cost: COST.placeAdjacent, possible: true});
    }
    if (state.points >= COST.placeAnywhere && hasAnyEmpty()) {
        availableActions.push({type: 'placeAnywhere', cost: COST.placeAnywhere, possible: true});
    }
    if (state.points >= COST.replaceAdjacent && hasAdjacentReplaceable()) {
        availableActions.push({type: 'replaceAdjacent', cost: COST.replaceAdjacent, possible: true});
    }
    if (state.points >= COST.replace && hasReplaceable()) {
        availableActions.push({type: 'replace', cost: COST.replace, possible: true});
    }
    
    console.log("Available AI actions:", availableActions);
    
    if (availableActions.length === 0) {
        // Если нет доступных действий, завершаем ход
        console.log("No available actions, ending turn");
        updateStatus('🤖 ИИ: нет доступных действий');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 500);
        return;
    }
    
    // Сначала проверяем, можем ли мы что-то сделать с текущими очками
    const affordableActions = availableActions.filter(action => state.points >= action.cost);
    
    if (affordableActions.length === 0) {
        // Если есть очки, но недостаточно для любого действия, принудительно завершаем ход
        console.log("Points but no affordable actions, forcing end turn");
        updateStatus('🤖 ИИ: недостаточно очков для действий');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 500);
        return;
    }
    
    // В зависимости от сложности выбираем стратегию
    if (state.aiDifficulty === 'easy') {
        aiEasyStrategy(affordableActions);
    } else if (state.aiDifficulty === 'medium') {
        aiMediumStrategy(affordableActions);
    } else {
        aiHardStrategy(affordableActions);
    }
}

// Легкий ИИ: случайные действия
function aiEasyStrategy(affordableActions) {
    console.log("AI easy strategy with affordable:", affordableActions);
    
    // Выбираем случайное доступное действие
    const randomAction = affordableActions[Math.floor(Math.random() * affordableActions.length)];
    
    console.log("Random action chosen:", randomAction.type);
    
    // Выполняем действие
    switch (randomAction.type) {
        case 'move':
            aiPerformSimpleMove();
            break;
        case 'placeAdjacent':
            aiPerformSimplePlaceAdjacent();
            break;
        case 'placeAnywhere':
            aiPerformSimplePlaceAnywhere();
            break;
        case 'replaceAdjacent':
            aiPerformSimpleReplaceAdjacent();
            break;
        case 'replace':
            aiPerformSimpleReplace();
            break;
        default:
            // Если что-то пошло не так, завершаем ход
            console.log("Unknown action type, ending turn");
            updateStatus('🤖 ИИ: завершает ход');
            state.aiThinking = false;
            setTimeout(() => {
                endTurn();
            }, 500);
            break;
    }
}

// Средний ИИ: стратегическое движение
function aiMediumStrategy(affordableActions) {
    console.log("AI medium strategy");
    
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    
    // 1. Приоритет: движение к финишу
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
                setTimeout(aiTurn, 600);
            } else {
                updateStatus('🤖 ИИ завершает ход.');
                state.aiThinking = false;
                setTimeout(() => {
                    endTurn();
                }, 800);
            }
            return;
        }
    }
    
    // 2. Если движение недоступно, используем легкую стратегию
    aiEasyStrategy(affordableActions);
}

// Сложный ИИ
function aiHardStrategy(affordableActions) {
    console.log("AI hard strategy");
    // Пока используем среднюю стратегию
    aiMediumStrategy(affordableActions);
}

// Простое движение ИИ (в любую доступную клетку)
function aiPerformSimpleMove() {
    const aiPlayer = state.players[1];
    const validMoves = getValidMoves(aiPlayer);
    
    if (validMoves.length === 0) {
        console.log("No valid moves for AI");
        // Попробуем другое действие
        state.aiThinking = false;
        setTimeout(aiTurn, 100);
        return;
    }
    
    // Выбираем случайный доступный ход
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    
    // Выполняем ход
    aiPlayer.row = randomMove.row;
    aiPlayer.col = randomMove.col;
    state.points -= COST.move;
    
    updateStatus(`🤖 ИИ переместился на (${randomMove.row},${randomMove.col})`);
    renderBoard();
    
    // Проверяем победу
    if (checkWin(aiPlayer, state.board[randomMove.row][randomMove.col])) {
        setTimeout(() => {
            showWinModal();
        }, 500);
        state.aiThinking = false;
        return;
    }
    
    if (state.points > 0) {
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
}

// Простое размещение тайла рядом
function aiPerformSimplePlaceAdjacent() {
    const aiPlayer = state.players[1];
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    
    if (adjacentEmpty.length === 0) {
        console.log("No adjacent empty cells");
        // Попробуем другое действие
        state.aiThinking = false;
        setTimeout(aiTurn, 100);
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
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
}

// Простое размещение тайла в любом месте
function aiPerformSimplePlaceAnywhere() {
    const allEmpty = getAllEmpty();
    
    if (allEmpty.length === 0) {
        console.log("No empty cells on board");
        // Попробуем другое действие
        state.aiThinking = false;
        setTimeout(aiTurn, 100);
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
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
}

// Простая замена соседнего тайла
function aiPerformSimpleReplaceAdjacent() {
    const adjacentReplaceable = getAdjacentReplaceable();
    
    if (adjacentReplaceable.length === 0) {
        console.log("No adjacent replaceable tiles");
        // Попробуем другое действие
        state.aiThinking = false;
        setTimeout(aiTurn, 100);
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
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
}

// Простая замена любого тайла
function aiPerformSimpleReplace() {
    const replaceable = getReplaceable();
    
    if (replaceable.length === 0) {
        console.log("No replaceable tiles");
        // Попробуем другое действие
        state.aiThinking = false;
        setTimeout(aiTurn, 100);
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
        setTimeout(aiTurn, 600);
    } else {
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
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

// Функция для принудительного завершения хода ИИ (может быть вызвана игроком)
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
    
    // Добавляем кнопку принудительного завершения хода ИИ
    const endTurnBtn = document.getElementById('btn-end');
    const originalEndTurn = endTurnBtn.onclick;
    endTurnBtn.onclick = function() {
        if (state.aiOpponent && state.currentPlayer === 1 && state.aiThinking) {
            forceEndAiTurn();
        } else {
            originalEndTurn.call(this);
        }
    };
    
    // Инициализируем состояние ИИ
    state.aiThinking = false;
    state.aiStatus = '';
});

// Добавляем модификацию функции endTurn для корректной работы с ИИ
const originalEndTurn = window.endTurn;
window.endTurn = function() {
    state.aiThinking = false;
    originalEndTurn();
};