// Создаем контейнер для логов ИИ
function createAiLogPanel() {
    const logPanel = document.createElement('div');
    logPanel.id = 'ai-log-panel';
    logPanel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 400px;
        height: 300px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #fbbf24;
        border-radius: 10px;
        color: white;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        resize: both;
        min-width: 300px;
        min-height: 200px;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        background: #1e3a8a;
        padding: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #fbbf24;
    `;
    
    const title = document.createElement('span');
    title.textContent = '🤖 Лог ИИ';
    title.style.fontWeight = 'bold';
    title.style.color = '#fbbf24';
    
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '5px';
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Копировать';
    copyBtn.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
    `;
    copyBtn.onclick = copyAiLog;
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Очистить';
    clearBtn.style.cssText = `
        background: #ef4444;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
    `;
    clearBtn.onclick = clearAiLog;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        background: transparent;
        color: white;
        border: 1px solid white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
    `;
    closeBtn.onclick = () => logPanel.style.display = 'none';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '▼';
    toggleBtn.style.cssText = `
        background: #f59e0b;
        color: black;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
    `;
    toggleBtn.onclick = () => {
        if (logContent.style.display === 'none') {
            logContent.style.display = 'block';
            toggleBtn.textContent = '▼';
        } else {
            logContent.style.display = 'none';
            toggleBtn.textContent = '▲';
        }
    };
    
    controls.appendChild(copyBtn);
    controls.appendChild(clearBtn);
    controls.appendChild(toggleBtn);
    controls.appendChild(closeBtn);
    
    header.appendChild(title);
    header.appendChild(controls);
    
    const logContent = document.createElement('div');
    logContent.id = 'ai-log-content';
    logContent.style.cssText = `
        flex: 1;
        padding: 8px;
        overflow-y: auto;
        overflow-x: hidden;
        word-wrap: break-word;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.4;
        background: #111827;
    `;
    
    logPanel.appendChild(header);
    logPanel.appendChild(logContent);
    
    document.body.appendChild(logPanel);
    
    // Создаем кнопку для открытия панели, если она скрыта
    const openBtn = document.createElement('button');
    openBtn.textContent = '📝 Лог ИИ';
    openBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 420px;
        background: #1e3a8a;
        color: #fbbf24;
        border: 1px solid #fbbf24;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        z-index: 999;
    `;
    openBtn.onclick = () => logPanel.style.display = 'flex';
    
    document.body.appendChild(openBtn);
}

// Функция для логирования
function logAi(message, type = 'info') {
    const logContent = document.getElementById('ai-log-content');
    if (!logContent) {
        createAiLogPanel();
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const typePrefix = {
        'info': 'ℹ️',
        'error': '❌',
        'warning': '⚠️',
        'success': '✅',
        'move': '➡️',
        'place': '🧩',
        'replace': '🔄',
        'action': '🎯'
    }[type] || '📝';
    
    const logEntry = document.createElement('div');
    logEntry.style.cssText = `
        margin-bottom: 4px;
        padding: 4px;
        border-radius: 3px;
        background: ${type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                     type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 
                     type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 
                     'rgba(59, 130, 246, 0.2)'};
        border-left: 3px solid ${type === 'error' ? '#ef4444' : 
                             type === 'warning' ? '#f59e0b' : 
                             type === 'success' ? '#22c55e' : 
                             '#3b82f6'};
    `;
    
    logEntry.innerHTML = `<span style="color: #94a3b8;">[${timestamp}]</span> ${typePrefix} ${message}`;
    
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
    
    // Также логируем в консоль
    console.log(`🤖 AI ${type}: ${message}`);
}

// Копирование лога
function copyAiLog() {
    const logContent = document.getElementById('ai-log-content');
    if (!logContent) return;
    
    const text = logContent.innerText;
    navigator.clipboard.writeText(text)
        .then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✓ Скопировано!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#3b82f6';
            }, 1500);
        })
        .catch(err => {
            console.error('Ошибка копирования:', err);
            logAi('Не удалось скопировать лог', 'error');
        });
}

// Очистка лога
function clearAiLog() {
    const logContent = document.getElementById('ai-log-content');
    if (logContent) {
        logContent.innerHTML = '';
        logAi('Лог очищен', 'info');
    }
}

// Переопределяем функцию обновления статуса для логирования
const originalUpdateStatus = updateStatus;
updateStatus = function(text) {
    originalUpdateStatus(text);
    if (state.aiOpponent && state.currentPlayer === 1) {
        logAi(`Статус: ${text}`, 'info');
    }
};

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
            
            if (edges.includes(myEdge) && nEdges.includes(theirEdge)) {
                return true;
            }
        }
    }
    
    return false;
}

// Функция для получения оптимального поворота тайла
function getBestRotationForTile(row, col, tileType) {
    let bestRotation = 0;
    let maxConnections = 0;
    
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

// Функция для хода ИИ - ОБНОВЛЕННАЯ С ЛОГИРОВАНИЕМ
function aiTurn() {
    logAi(`=== НАЧАЛО ХОДА ИИ ===`, 'action');
    logAi(`Фаза: ${state.phase}, Очки: ${state.points}, Тайл: ${state.nextTileType}`, 'info');
    
    if (state.aiThinking) {
        logAi('ИИ уже думает, пропускаем', 'warning');
        return;
    }
    
    if (!state.aiOpponent || state.currentPlayer !== 1) {
        logAi('Сейчас не ход ИИ', 'warning');
        return;
    }
    
    state.aiThinking = true;
    
    if (state.phase === 'roll') {
        logAi('Бросает кубик...', 'info');
        updateStatus('🤖 ИИ бросает кубик...');
        setTimeout(() => {
            rollDice();
            state.aiThinking = false;
        }, 1000);
        return;
    }
    
    if (state.phase !== 'action') {
        logAi('Не фаза действий', 'error');
        state.aiThinking = false;
        return;
    }
    
    const delay = state.aiDifficulty === 'easy' ? 1000 : state.aiDifficulty === 'medium' ? 800 : 400;
    
    logAi(`Сложность: ${state.aiDifficulty}, Задержка: ${delay}мс`, 'info');
    updateStatus(`🤖 ИИ думает (${state.aiDifficulty})...`);
    
    setTimeout(() => {
        aiMakeDecision();
    }, delay);
}

// Основная функция принятия решений ИИ
function aiMakeDecision() {
    logAi(`Принятие решения. Очки: ${state.points}`, 'action');
    
    if (state.points <= 0) {
        logAi('Очки закончились, завершаем ход', 'info');
        updateStatus('🤖 ИИ: очки закончились');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 500);
        return;
    }
    
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    logAi(`Позиция ИИ: (${aiPlayer.row},${aiPlayer.col}), Финиш: (${finish.row},${finish.col})`, 'info');
    
    // Проверяем все доступные действия
    const actions = [];
    
    // 1. Движение
    if (state.points >= COST.move) {
        const canMove = canMoveAnywhere(aiPlayer);
        const validMoves = canMove ? getValidMoves(aiPlayer).length : 0;
        actions.push({
            type: 'move',
            cost: COST.move,
            possible: canMove && validMoves > 0,
            moves: validMoves
        });
        logAi(`Движение: ${canMove ? `возможно (${validMoves} вариантов)` : 'невозможно'}`, 'move');
    }
    
    // 2. Размещение рядом
    if (state.points >= COST.placeAdjacent) {
        const adjacentEmpty = getAdjacentEmpty(aiPlayer);
        actions.push({
            type: 'placeAdjacent',
            cost: COST.placeAdjacent,
            possible: adjacentEmpty.length > 0,
            cells: adjacentEmpty.length
        });
        logAi(`Размещение рядом: ${adjacentEmpty.length > 0 ? `возможно (${adjacentEmpty.length} клеток)` : 'невозможно'}`, 'place');
    }
    
    // 3. Размещение где угодно
    if (state.points >= COST.placeAnywhere) {
        const allEmpty = getAllEmpty();
        actions.push({
            type: 'placeAnywhere',
            cost: COST.placeAnywhere,
            possible: allEmpty.length > 0,
            cells: allEmpty.length
        });
        logAi(`Размещение где угодно: ${allEmpty.length > 0 ? `возможно (${allEmpty.length} клеток)` : 'невозможно'}`, 'place');
    }
    
    // 4. Замена рядом
    if (state.points >= COST.replaceAdjacent) {
        const adjacentReplaceable = getAdjacentReplaceable();
        actions.push({
            type: 'replaceAdjacent',
            cost: COST.replaceAdjacent,
            possible: adjacentReplaceable.length > 0,
            cells: adjacentReplaceable.length
        });
        logAi(`Замена рядом: ${adjacentReplaceable.length > 0 ? `возможно (${adjacentReplaceable.length} тайлов)` : 'невозможно'}`, 'replace');
    }
    
    // 5. Замена любого
    if (state.points >= COST.replace) {
        const replaceable = getReplaceable();
        actions.push({
            type: 'replace',
            cost: COST.replace,
            possible: replaceable.length > 0,
            cells: replaceable.length
        });
        logAi(`Замена любого: ${replaceable.length > 0 ? `возможно (${replaceable.length} тайлов)` : 'невозможно'}`, 'replace');
    }
    
    // Фильтруем доступные действия
    const possibleActions = actions.filter(a => a.possible);
    logAi(`Доступных действий: ${possibleActions.length}`, possibleActions.length > 0 ? 'success' : 'warning');
    
    if (possibleActions.length === 0) {
        logAi('Нет доступных действий, завершаем ход', 'error');
        updateStatus('🤖 ИИ: нет доступных действий');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 500);
        return;
    }
    
    // Выбираем стратегию в зависимости от сложности
    let actionTaken = false;
    
    try {
        if (state.aiDifficulty === 'easy') {
            actionTaken = aiEasyStrategy(possibleActions, aiPlayer, finish);
        } else if (state.aiDifficulty === 'medium') {
            actionTaken = aiMediumStrategy(possibleActions, aiPlayer, finish);
        } else {
            actionTaken = aiHardStrategy(possibleActions, aiPlayer, finish);
        }
        
        if (!actionTaken) {
            logAi('Не удалось выполнить действие, завершаем ход', 'error');
            updateStatus('🤖 ИИ: не смог выполнить действие');
            state.aiThinking = false;
            setTimeout(() => {
                endTurn();
            }, 500);
        }
    } catch (error) {
        logAi(`ОШИБКА: ${error.message}`, 'error');
        console.error('AI error:', error);
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 500);
    }
}

// Легкая стратегия ИИ
function aiEasyStrategy(possibleActions, aiPlayer, finish) {
    logAi('Стратегия: Легкая', 'info');
    
    // Выбираем случайное доступное действие
    const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
    logAi(`Выбрано действие: ${randomAction.type} (${randomAction.cost} очков)`, 'action');
    
    return executeAiAction(randomAction.type, aiPlayer, finish);
}

// Средняя стратегия ИИ
function aiMediumStrategy(possibleActions, aiPlayer, finish) {
    logAi('Стратегия: Средняя', 'info');
    
    // Приоритет: движение → размещение рядом → остальное
    const actionPriority = {
        'move': 5,
        'placeAdjacent': 4,
        'placeAnywhere': 3,
        'replaceAdjacent': 2,
        'replace': 1
    };
    
    possibleActions.sort((a, b) => actionPriority[b.type] - actionPriority[a.type]);
    const bestAction = possibleActions[0];
    logAi(`Выбрано действие: ${bestAction.type} (приоритет ${actionPriority[bestAction.type]})`, 'action');
    
    return executeAiAction(bestAction.type, aiPlayer, finish);
}

// Сложная стратегия ИИ
function aiHardStrategy(possibleActions, aiPlayer, finish) {
    logAi('Стратегия: Сложная', 'info');
    
    // Пока используем среднюю стратегию, но с улучшенной логикой
    return aiMediumStrategy(possibleActions, aiPlayer, finish);
}

// Выполнение действия ИИ
function executeAiAction(actionType, aiPlayer, finish) {
    logAi(`Выполнение действия: ${actionType}`, 'action');
    
    switch (actionType) {
        case 'move':
            return aiPerformMove(aiPlayer, finish);
        case 'placeAdjacent':
            return aiPerformPlaceAdjacent(aiPlayer, finish);
        case 'placeAnywhere':
            return aiPerformPlaceAnywhere(aiPlayer, finish);
        case 'replaceAdjacent':
            return aiPerformReplaceAdjacent(aiPlayer);
        case 'replace':
            return aiPerformReplace(aiPlayer);
        default:
            logAi(`Неизвестное действие: ${actionType}`, 'error');
            return false;
    }
}

// Движение ИИ
function aiPerformMove(aiPlayer, finish) {
    logAi('Пытаемся двигаться', 'move');
    
    const validMoves = getValidMoves(aiPlayer);
    if (validMoves.length === 0) {
        logAi('Нет доступных ходов', 'error');
        return false;
    }
    
    logAi(`Доступные ходы: ${validMoves.map(m => `(${m.row},${m.col})`).join(', ')}`, 'info');
    
    // Выбираем ход, который ближе к финишу
    let bestMove = validMoves[0];
    let bestDist = Math.abs(bestMove.row - finish.row) + Math.abs(bestMove.col - finish.col);
    
    for (const move of validMoves) {
        const dist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
        if (dist < bestDist) {
            bestDist = dist;
            bestMove = move;
        }
    }
    
    logAi(`Выбран ход: (${bestMove.row},${bestMove.col}), расстояние до финиша: ${bestDist}`, 'move');
    
    const oldPos = `(${aiPlayer.row},${aiPlayer.col})`;
    aiPlayer.row = bestMove.row;
    aiPlayer.col = bestMove.col;
    const newPos = `(${aiPlayer.row},${aiPlayer.col})`;
    
    const oldPoints = state.points;
    state.points -= COST.move;
    
    logAi(`Перемещение: ${oldPos} → ${newPos}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ переместился ${oldPos} → ${newPos}`);
    renderBoard();
    
    // Проверяем победу
    if (checkWin(aiPlayer, state.board[bestMove.row][bestMove.col])) {
        logAi('🏆 ИИ ДОСТИГ ФИНИША!', 'success');
        setTimeout(() => {
            showWinModal();
        }, 500);
        state.aiThinking = false;
        return true;
    }
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        setTimeout(aiTurn, 600);
    } else {
        logAi('Очки закончились, завершаем ход', 'info');
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
    
    return true;
}

// Размещение тайла рядом
function aiPerformPlaceAdjacent(aiPlayer, finish) {
    logAi('Пытаемся разместить тайл рядом', 'place');
    
    const adjacentEmpty = getAdjacentEmpty(aiPlayer);
    if (adjacentEmpty.length === 0) {
        logAi('Нет пустых клеток рядом', 'error');
        return false;
    }
    
    logAi(`Пустые клетки рядом: ${adjacentEmpty.map(c => `(${c.row},${c.col})`).join(', ')}`, 'info');
    
    // Выбираем первую попавшуюся клетку
    const targetCell = adjacentEmpty[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    const connections = countTileConnections(targetCell.row, targetCell.col, state.nextTileType, bestRotation);
    
    logAi(`Выбрана клетка: (${targetCell.row},${targetCell.col}), поворот: ${bestRotation}, соединений: ${connections}`, 'place');
    
    // Сохраняем состояние для отката
    state.lastTilePlacement = {
        action: 'placeAdjacent',
        row: targetCell.row,
        col: targetCell.col,
        previousCellState: { ...state.board[targetCell.row][targetCell.col] },
        pointsUsed: COST.placeAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Размещаем тайл
    state.board[targetCell.row][targetCell.col] = {
        ...state.board[targetCell.row][targetCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };
    
    const oldPoints = state.points;
    state.points -= COST.placeAdjacent;
    const oldTileType = state.nextTileType;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен: тип ${oldTileType} → тип ${state.nextTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ разместил тайл в (${targetCell.row},${targetCell.col})`);
    renderBoard();
    renderNextTile();
    
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        setTimeout(aiTurn, 600);
    } else {
        logAi('Очки закончились, завершаем ход', 'info');
        updateStatus('🤖 ИИ завершает ход.');
        state.aiThinking = false;
        setTimeout(() => {
            endTurn();
        }, 800);
    }
    
    return true;
}

// Размещение тайла где угодно
function aiPerformPlaceAnywhere(aiPlayer, finish) {
    logAi('Пытаемся разместить тайл где угодно', 'place');
    
    const allEmpty = getAllEmpty();
    if (allEmpty.length === 0) {
        logAi('Нет пустых клеток на поле', 'error');
        return false;
    }
    
    // Ищем клетку, которая ближе к финишу
    let bestCell = allEmpty[0];
    let bestDist = Math.abs(bestCell.row - finish.row) + Math.abs(bestCell.col - finish.col);
    
    for (const cell of allEmpty) {
        const dist = Math.abs(cell.row - finish.row) + Math.abs(cell.col - finish.col);
        if (dist < bestDist) {
            bestDist = dist;
            bestCell = cell;
        }
    }
    
    const bestRotation = getBestRotationForTile(bestCell.row, bestCell.col, state.nextTileType);
    
    logAi(`Выбрана клетка: (${bestCell.row},${bestCell.col}), расстояние до финиша: ${bestDist}, поворот: ${bestRotation}`, 'place');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: bestCell.row,
        col: bestCell.col,
        previousCellState: { ...state.board[bestCell.row][bestCell.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Размещаем тайл
    state.board[bestCell.row][bestCell.col] = {
        ...state.board[bestCell.row][bestCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };
    
    const oldPoints = state.points;
    state.points -= COST.placeAnywhere;
    const oldTileType = state.nextTileType;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен: тип ${oldTileType} → тип ${state.nextTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ разместил тайл в (${bestCell.row},${bestCell.col})`);
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

// Замена соседнего тайла
function aiPerformReplaceAdjacent(aiPlayer) {
    logAi('Пытаемся заменить соседний тайл', 'replace');
    
    const adjacentReplaceable = getAdjacentReplaceable();
    if (adjacentReplaceable.length === 0) {
        logAi('Нет заменяемых тайлов рядом', 'error');
        return false;
    }
    
    // Выбираем первый попавшийся тайл
    const targetCell = adjacentReplaceable[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    logAi(`Выбран тайл для замены: (${targetCell.row},${targetCell.col}), новый поворот: ${bestRotation}`, 'replace');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'replace',
        row: targetCell.row,
        col: targetCell.col,
        previousCellState: { ...state.board[targetCell.row][targetCell.col] },
        pointsUsed: COST.replaceAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Заменяем тайл
    state.board[targetCell.row][targetCell.col].tileType = state.nextTileType;
    state.board[targetCell.row][targetCell.col].rotation = bestRotation;
    
    const oldPoints = state.points;
    state.points -= COST.replaceAdjacent;
    const oldTileType = state.nextTileType;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл заменен: тип ${oldTileType} → тип ${state.nextTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ заменил тайл в (${targetCell.row},${targetCell.col})`);
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

// Замена любого тайла
function aiPerformReplace(aiPlayer) {
    logAi('Пытаемся заменить любой тайл', 'replace');
    
    const replaceable = getReplaceable();
    if (replaceable.length === 0) {
        logAi('Нет заменяемых тайлов', 'error');
        return false;
    }
    
    // Выбираем первый попавшийся тайл
    const targetCell = replaceable[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    logAi(`Выбран тайл для замены: (${targetCell.row},${targetCell.col}), новый поворот: ${bestRotation}`, 'replace');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'replace',
        row: targetCell.row,
        col: targetCell.col,
        previousCellState: { ...state.board[targetCell.row][targetCell.col] },
        pointsUsed: COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Заменяем тайл
    state.board[targetCell.row][targetCell.col].tileType = state.nextTileType;
    state.board[targetCell.row][targetCell.col].rotation = bestRotation;
    
    const oldPoints = state.points;
    state.points -= COST.replace;
    const oldTileType = state.nextTileType;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл заменен: тип ${oldTileType} → тип ${state.nextTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ заменил тайл в (${targetCell.row},${targetCell.col})`);
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

// Функция для подсчета соединений
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
        createAiLogPanel(); // Создаем панель логов при включении ИИ
        logAi('Режим ИИ включен', 'success');
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
        const difficultyNames = {
            'easy': 'Легкая',
            'medium': 'Средняя', 
            'hard': 'Сложная'
        };
        updateStatus(`Сложность ИИ установлена: ${difficultyNames[difficulty]}`);
        logAi(`Сложность изменена на: ${difficultyNames[difficulty]}`, 'info');
    }
}

// Функция для принудительного завершения хода ИИ
function forceEndAiTurn() {
    if (state.aiOpponent && state.currentPlayer === 1 && state.aiThinking) {
        logAi('Ход ИИ принудительно завершен игроком', 'warning');
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

// Патчим оригинальные функции для логирования
(function() {
    const originalEndTurn = window.endTurn;
    const originalRollDice = window.rollDice;
    
    window.endTurn = function() {
        if (state.aiOpponent && state.currentPlayer === 1) {
            logAi('=== ЗАВЕРШЕНИЕ ХОДА ИИ ===', 'action');
        }
        state.aiThinking = false;
        if (originalEndTurn) {
            originalEndTurn();
        }
    };
    
    window.rollDice = function() {
        if (state.aiOpponent && state.currentPlayer === 1) {
            logAi('Бросок кубика завершен', 'info');
        }
        if (originalRollDice) {
            originalRollDice();
        }
    };
})();