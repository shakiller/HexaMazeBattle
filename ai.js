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
        background: rgba(0, 0, 0, 0.95);
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
        box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #1e3a8a, #1e40af);
        padding: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #fbbf24;
        flex-shrink: 0;
    `;
    
    const title = document.createElement('span');
    title.textContent = '🤖 Лог ИИ';
    title.style.fontWeight = 'bold';
    title.style.color = '#fbbf24';
    title.style.fontSize = '14px';
    
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '5px';
    controls.style.alignItems = 'center';
    
    const copyBtn = document.createElement('button');
    copyBtn.id = 'ai-log-copy-btn';
    copyBtn.textContent = '📋 Копировать';
    copyBtn.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
        transition: all 0.2s;
    `;
    copyBtn.onmouseover = () => copyBtn.style.background = '#2563eb';
    copyBtn.onmouseout = () => copyBtn.style.background = '#3b82f6';
    copyBtn.onclick = copyAiLog;
    
    const clearBtn = document.createElement('button');
    clearBtn.id = 'ai-log-clear-btn';
    clearBtn.textContent = '🗑️ Очистить';
    clearBtn.style.cssText = `
        background: #ef4444;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
        transition: all 0.2s;
    `;
    clearBtn.onmouseover = () => clearBtn.style.background = '#dc2626';
    clearBtn.onmouseout = () => clearBtn.style.background = '#ef4444';
    clearBtn.onclick = clearAiLog;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'ai-log-toggle-btn';
    toggleBtn.textContent = '▼';
    toggleBtn.style.cssText = `
        background: #f59e0b;
        color: black;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
        font-weight: bold;
        transition: all 0.2s;
    `;
    toggleBtn.onmouseover = () => toggleBtn.style.background = '#d97706';
    toggleBtn.onmouseout = () => toggleBtn.style.background = '#f59e0b';
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'ai-log-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        background: transparent;
        color: #fbbf24;
        border: 1px solid #fbbf24;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        transition: all 0.2s;
        margin-left: 5px;
    `;
    closeBtn.onmouseover = () => {
        closeBtn.style.background = '#fbbf24';
        closeBtn.style.color = 'black';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'transparent';
        closeBtn.style.color = '#fbbf24';
    };
    
    toggleBtn.onclick = () => {
        const logContent = document.getElementById('ai-log-content');
        if (logContent.style.display === 'none') {
            logContent.style.display = 'block';
            toggleBtn.textContent = '▼';
        } else {
            logContent.style.display = 'none';
            toggleBtn.textContent = '▲';
        }
    };
    
    closeBtn.onclick = () => {
        logPanel.style.display = 'none';
        const openBtn = document.getElementById('ai-log-open-btn');
        if (openBtn) openBtn.style.display = 'block';
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
        padding: 10px;
        overflow-y: auto;
        overflow-x: hidden;
        word-wrap: break-word;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.4;
        background: #0f172a;
        color: #e2e8f0;
    `;
    
    logPanel.appendChild(header);
    logPanel.appendChild(logContent);
    
    document.body.appendChild(logPanel);
    
    // Создаем кнопку для открытия панели, если она скрыта
    const openBtn = document.createElement('button');
    openBtn.id = 'ai-log-open-btn';
    openBtn.textContent = '📝 Лог ИИ';
    openBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 420px;
        background: linear-gradient(135deg, #1e3a8a, #1e40af);
        color: #fbbf24;
        border: 2px solid #fbbf24;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        z-index: 999;
        display: none;
        transition: all 0.2s;
        box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
    `;
    openBtn.onmouseover = () => openBtn.style.transform = 'translateY(-2px)';
    openBtn.onmouseout = () => openBtn.style.transform = 'translateY(0)';
    openBtn.onclick = () => {
        logPanel.style.display = 'flex';
        openBtn.style.display = 'none';
    };
    
    document.body.appendChild(openBtn);
    
    // Показываем кнопку открытия при скрытии панели
    closeBtn.onclick = () => {
        logPanel.style.display = 'none';
        openBtn.style.display = 'block';
    };
    
    return logPanel;
}

// Функция для логирования
function logAi(message, type = 'info') {
    // Создаем панель если её нет
    let logContent = document.getElementById('ai-log-content');
    if (!logContent) {
        createAiLogPanel();
        logContent = document.getElementById('ai-log-content');
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const typeConfig = {
        'info': { emoji: 'ℹ️', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
        'error': { emoji: '❌', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
        'warning': { emoji: '⚠️', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
        'success': { emoji: '✅', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        'move': { emoji: '➡️', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
        'place': { emoji: '🧩', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
        'replace': { emoji: '🔄', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
        'action': { emoji: '🎯', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
        'phase': { emoji: '🔄', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
        'debug': { emoji: '🔍', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
    };
    
    const config = typeConfig[type] || typeConfig.info;
    
    const logEntry = document.createElement('div');
    logEntry.style.cssText = `
        margin-bottom: 4px;
        padding: 6px 8px;
        border-radius: 4px;
        background: ${config.bg};
        border-left: 3px solid ${config.color};
        transition: all 0.2s;
    `;
    logEntry.onmouseover = () => logEntry.style.background = config.bg.replace('0.15', '0.25');
    logEntry.onmouseout = () => logEntry.style.background = config.bg;
    
    logEntry.innerHTML = `
        <span style="color: #64748b; font-size: 10px;">[${timestamp}]</span>
        <span style="color: ${config.color}; margin: 0 5px; font-weight: bold;">${config.emoji}</span>
        <span style="color: #e2e8f0;">${message}</span>
    `;
    
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
    
    // Также логируем в консоль
    console.log(`%c🤖 AI ${type}: ${message}`, `color: ${config.color}`);
}

// Копирование лога - ИСПРАВЛЕННАЯ ВЕРСИЯ
function copyAiLog() {
    const logContent = document.getElementById('ai-log-content');
    if (!logContent) {
        logAi('Лог не найден', 'error');
        return;
    }
    
    try {
        // Получаем весь текст из лога
        let text = '';
        const entries = logContent.querySelectorAll('div');
        entries.forEach(entry => {
            const timestamp = entry.querySelector('span[style*="color: #64748b"]')?.textContent || '';
            const emoji = entry.querySelector('span[style*="font-weight: bold"]')?.textContent || '';
            const message = entry.querySelector('span[style*="color: #e2e8f0"]')?.textContent || '';
            text += `${timestamp} ${emoji} ${message}\n`;
        });
        
        // Используем современный API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text.trim())
                .then(() => {
                    const btn = document.getElementById('ai-log-copy-btn');
                    if (btn) {
                        const originalText = btn.textContent;
                        btn.textContent = '✓ Скопировано!';
                        btn.style.background = '#10b981';
                        setTimeout(() => {
                            btn.textContent = originalText;
                            btn.style.background = '#3b82f6';
                        }, 1500);
                    }
                    logAi('Лог скопирован в буфер обмена', 'success');
                })
                .catch(err => {
                    console.error('Clipboard error:', err);
                    fallbackCopy(text.trim());
                });
        } else {
            // Fallback для старых браузеров или HTTP
            fallbackCopy(text.trim());
        }
    } catch (error) {
        console.error('Copy error:', error);
        logAi(`Ошибка копирования: ${error.message}`, 'error');
    }
}

// Fallback метод копирования
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            const btn = document.getElementById('ai-log-copy-btn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✓ Скопировано!';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#3b82f6';
                }, 1500);
            }
            logAi('Лог скопирован (fallback метод)', 'success');
        } else {
            throw new Error('Copy command failed');
        }
    } catch (err) {
        console.error('Fallback copy error:', err);
        logAi('Не удалось скопировать. Разрешите доступ к буферу обмена или используйте Ctrl+C', 'error');
        
        // Показываем текст для ручного копирования
        alert('Скопируйте текст вручную:\n\n' + text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
    } finally {
        document.body.removeChild(textarea);
    }
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
    
    // Логируем статусы связанные с ИИ
    if (state.aiOpponent && state.currentPlayer === 1) {
        if (text.includes('ИИ') || text.includes('🤖')) {
            logAi(`Статус: ${text}`, 'phase');
        }
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

// Глобальная переменная для предотвращения дублирующих вызовов
let aiTurnTimeout = null;
let aiActionInProgress = false;

// Функция для хода ИИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiTurn() {
    logAi(`=== НАЧАЛО ХОДА ИИ ===`, 'action');
    logAi(`Фаза: ${state.phase}, Очки: ${state.points}, Тайл: ${state.nextTileType}`, 'info');
    
    // Очищаем предыдущий таймаут
    if (aiTurnTimeout) {
        clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    
    // Проверяем, что сейчас действительно ход ИИ
    if (!state.aiOpponent || state.currentPlayer !== 1) {
        logAi('Сейчас не ход ИИ (проверка не прошла)', 'warning');
        state.aiThinking = false;
        aiActionInProgress = false;
        return;
    }
    
    if (state.aiThinking || aiActionInProgress) {
        logAi('ИИ уже думает или действие в процессе, пропускаем дублирующий вызов', 'warning');
        return;
    }
    
    state.aiThinking = true;
    aiActionInProgress = true;
    
    if (state.phase === 'roll') {
        logAi('Фаза: Бросок кубика', 'phase');
        updateStatus('🤖 ИИ бросает кубик...');
        
        // Используем таймаут для отслеживания
        aiTurnTimeout = setTimeout(() => {
            logAi('Вызываем rollDice()', 'debug');
            rollDice();
            
            // После броска кубика, должен наступить action phase
            // Проверяем это через небольшую задержку
            setTimeout(() => {
                logAi(`После броска: фаза=${state.phase}, очки=${state.points}`, 'debug');
                
                if (state.phase === 'action' && state.points > 0) {
                    logAi(`Бросок завершен! Выпало ${state.points} очков`, 'success');
                    state.aiThinking = false;
                    aiActionInProgress = false;
                    aiTurnTimeout = null;
                    
                    // Продолжаем ход в action phase
                    setTimeout(aiTurn, 500);
                } else {
                    logAi(`Проблема после броска: фаза=${state.phase}, очки=${state.points}`, 'error');
                    state.aiThinking = false;
                    aiActionInProgress = false;
                    aiTurnTimeout = null;
                    
                    // Если что-то пошло не так, передаем ход
                    emergencyEndAiTurn();
                }
            }, 300);
            
        }, 1000);
        return;
    }
    
    if (state.phase !== 'action') {
        logAi(`Неправильная фаза для действий: ${state.phase}`, 'error');
        state.aiThinking = false;
        aiActionInProgress = false;
        return;
    }
    
    const delay = state.aiDifficulty === 'easy' ? 1200 : state.aiDifficulty === 'medium' ? 800 : 500;
    
    logAi(`Сложность: ${state.aiDifficulty}, Задержка: ${delay}мс`, 'info');
    updateStatus(`🤖 ИИ думает...`);
    
    // Используем таймаут
    aiTurnTimeout = setTimeout(() => {
        try {
            aiMakeDecision();
        } catch (error) {
            logAi(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`, 'error');
            console.error('AI critical error:', error);
            emergencyEndAiTurn();
        }
        aiTurnTimeout = null;
    }, delay);
}

// Аварийное завершение хода ИИ
function emergencyEndAiTurn() {
    logAi('Аварийное завершение хода ИИ', 'error');
    state.aiThinking = false;
    aiActionInProgress = false;
    
    // Не сбрасываем очки, только передаем ход
    state.currentPlayer = 0; // Передаем ход игроку
    state.phase = 'roll';
    // Очки не сбрасываем - они уже должны быть правильно подсчитаны
    
    updateStatus('❌ Ошибка ИИ. Ваш ход!');
    renderBoard();
    updateUI(); // Важно: обновляем UI!
    
    logAi('Ход передан игроку (аварийно)', 'phase');
}

// Основная функция принятия решений ИИ
function aiMakeDecision() {
    logAi(`Принятие решения. Очки: ${state.points}`, 'action');
    
    // Важная проверка: если points стал отрицательным, исправляем
    if (state.points < 0) {
        logAi(`ОШИБКА: отрицательные очки (${state.points}), исправляем на 0`, 'error');
        state.points = 0;
    }
    
    if (state.points <= 0) {
        logAi('Очки закончились, завершаем ход', 'info');
        completeAiTurn('🤖 ИИ: очки закончились');
        return;
    }
    
    const aiPlayer = state.players[1];
    const finish = state.finishPos[1];
    logAi(`Позиция ИИ: (${aiPlayer.row},${aiPlayer.col}), Финиш: (${finish.row},${finish.col})`, 'debug');
    
    // Проверяем ВСЕ возможные действия с детальным логированием
    const actions = [];
    
    // 1. Движение
    if (state.points >= COST.move) {
        const canMove = canMoveAnywhere(aiPlayer);
        const validMoves = canMove ? getValidMoves(aiPlayer) : [];
        const moveInfo = {
            type: 'move',
            cost: COST.move,
            possible: canMove && validMoves.length > 0,
            moves: validMoves.length,
            moveList: validMoves
        };
        actions.push(moveInfo);
        logAi(`Движение: ${moveInfo.possible ? `✓ (${validMoves.length} вариантов)` : '✗'}`, 
              moveInfo.possible ? 'success' : 'warning');
    }
    
    // 2. Размещение рядом
    if (state.points >= COST.placeAdjacent) {
        const adjacentEmpty = getAdjacentEmpty(aiPlayer);
        const placeAdjInfo = {
            type: 'placeAdjacent',
            cost: COST.placeAdjacent,
            possible: adjacentEmpty.length > 0,
            cells: adjacentEmpty.length,
            cellList: adjacentEmpty
        };
        actions.push(placeAdjInfo);
        logAi(`Размещение рядом: ${placeAdjInfo.possible ? `✓ (${adjacentEmpty.length} клеток)` : '✗'}`, 
              placeAdjInfo.possible ? 'success' : 'warning');
    }
    
    // 3. Размещение где угодно
    if (state.points >= COST.placeAnywhere) {
        const allEmpty = getAllEmpty();
        const placeAnyInfo = {
            type: 'placeAnywhere',
            cost: COST.placeAnywhere,
            possible: allEmpty.length > 0,
            cells: allEmpty.length,
            cellList: allEmpty
        };
        actions.push(placeAnyInfo);
        logAi(`Размещение где угодно: ${placeAnyInfo.possible ? `✓ (${allEmpty.length} клеток)` : '✗'}`, 
              placeAnyInfo.possible ? 'success' : 'warning');
    }
    
    // 4. Замена рядом
    if (state.points >= COST.replaceAdjacent) {
        const adjacentReplaceable = getAdjacentReplaceable();
        const replaceAdjInfo = {
            type: 'replaceAdjacent',
            cost: COST.replaceAdjacent,
            possible: adjacentReplaceable.length > 0,
            cells: adjacentReplaceable.length,
            cellList: adjacentReplaceable
        };
        actions.push(replaceAdjInfo);
        logAi(`Замена рядом: ${replaceAdjInfo.possible ? `✓ (${adjacentReplaceable.length} тайлов)` : '✗'}`, 
              replaceAdjInfo.possible ? 'success' : 'warning');
    }
    
    // 5. Замена любого
    if (state.points >= COST.replace) {
        const replaceable = getReplaceable();
        const replaceInfo = {
            type: 'replace',
            cost: COST.replace,
            possible: replaceable.length > 0,
            cells: replaceable.length,
            cellList: replaceable
        };
        actions.push(replaceInfo);
        logAi(`Замена любого: ${replaceInfo.possible ? `✓ (${replaceable.length} тайлов)` : '✗'}`, 
              replaceInfo.possible ? 'success' : 'warning');
    }
    
    // Фильтруем доступные действия
    const possibleActions = actions.filter(a => a.possible);
    logAi(`Доступных действий: ${possibleActions.length} из ${actions.length}`, 
          possibleActions.length > 0 ? 'success' : 'error');
    
    if (possibleActions.length === 0) {
        logAi('❌ Нет доступных действий, завершаем ход', 'error');
        completeAiTurn('🤖 ИИ: нет доступных действий');
        return;
    }
    
    // Выбираем стратегию в зависимости от сложности
    let actionTaken = false;
    
    try {
        if (state.aiDifficulty === 'easy') {
            logAi('Выбор стратегии: Легкая', 'phase');
            actionTaken = aiEasyStrategy(possibleActions, aiPlayer, finish);
        } else if (state.aiDifficulty === 'medium') {
            logAi('Выбор стратегии: Средняя', 'phase');
            actionTaken = aiMediumStrategy(possibleActions, aiPlayer, finish);
        } else {
            logAi('Выбор стратегии: Сложная', 'phase');
            actionTaken = aiHardStrategy(possibleActions, aiPlayer, finish);
        }
        
        if (!actionTaken) {
            logAi('⚠️ Не удалось выполнить действие, завершаем ход', 'warning');
            completeAiTurn('🤖 ИИ: не смог выполнить действие');
        }
    } catch (error) {
        logAi(`❌ ОШИБКА В СТРАТЕГИИ: ${error.message}`, 'error');
        console.error('AI strategy error:', error);
        completeAiTurn('🤖 Ошибка ИИ. Завершаю ход.');
    }
}

// Функция для корректного завершения хода ИИ
function completeAiTurn(message) {
    logAi('Завершение хода ИИ...', 'phase');
    
    // Всегда сбрасываем флаги
    state.aiThinking = false;
    aiActionInProgress = false;
    
    // Обновляем статус
    if (message) {
        updateStatus(message);
    }
    
    // ОБЯЗАТЕЛЬНО обновляем UI перед завершением
    updateUI();
    
    // Даем небольшую задержку перед передачей хода
    setTimeout(() => {
        // Проверяем, что мы все еще в режиме ИИ и это все еще ход ИИ
        if (state.aiOpponent && state.currentPlayer === 1) {
            logAi('Передача хода игроку', 'phase');
            aiEndTurn(); // Используем специальную функцию завершения хода ИИ
        } else {
            logAi('Ход уже передан', 'debug');
        }
    }, 1000);
}

// Специальная функция завершения хода для ИИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiEndTurn() {
    logAi('Выполняем aiEndTurn()', 'phase');
    
    // Сбрасываем состояние ИИ
    state.aiThinking = false;
    aiActionInProgress = false;
    if (aiTurnTimeout) {
        clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    
    // Сбрасываем выбранное действие и клетку
    state.selectedAction = null;
    state.selectedCell = null;
    state.lastTilePlacement = null;
    clearHighlights();
    
    // Меняем игрока
    state.currentPlayer = 0; // Передаем ход игроку
    state.phase = 'roll';
    // НЕ сбрасываем очки - они уже должны быть правильно подсчитаны!
    // state.points = 0; // УБИРАЕМ ЭТУ СТРОКУ!
    
    // Генерируем новый тайл
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    renderNextTile();
    
    // Сбрасываем кубик
    document.getElementById('dice').textContent = '?';
    
    // Обновляем UI
    updateUI();
    
    logAi(`Ход ИИ завершен, передано игроку. Текущие очки: ${state.points}`, 'phase');
    updateStatus(`Игрок, бросьте кубик!`);
}

// Легкая стратегия ИИ
function aiEasyStrategy(possibleActions, aiPlayer, finish) {
    // Сортируем по стоимости (от дешевых к дорогим)
    possibleActions.sort((a, b) => a.cost - b.cost);
    
    // Выбираем самое дешевое доступное действие
    const chosenAction = possibleActions[0];
    logAi(`Выбрано дешевое действие: ${chosenAction.type} (${chosenAction.cost} очков)`, 'action');
    
    return executeAiAction(chosenAction.type, aiPlayer, finish, chosenAction);
}

// Средняя стратегия ИИ
function aiMediumStrategy(possibleActions, aiPlayer, finish) {
    // Приоритет: движение → размещение рядом → остальное
    const actionPriority = {
        'move': 5,
        'placeAdjacent': 4,
        'placeAnywhere': 3,
        'replaceAdjacent': 2,
        'replace': 1
    };
    
    possibleActions.sort((a, b) => {
        const priorityDiff = actionPriority[b.type] - actionPriority[a.type];
        if (priorityDiff !== 0) return priorityDiff;
        return a.cost - b.cost; // Если приоритет одинаковый, выбираем дешевле
    });
    
    const bestAction = possibleActions[0];
    logAi(`Выбрано приоритетное действие: ${bestAction.type} (приоритет ${actionPriority[bestAction.type]}, ${bestAction.cost} очков)`, 'action');
    
    return executeAiAction(bestAction.type, aiPlayer, finish, bestAction);
}

// Сложная стратегия ИИ
function aiHardStrategy(possibleActions, aiPlayer, finish) {
    // Для сложного ИИ пытаемся выбрать действие, которое приближает к финишу
    let bestAction = possibleActions[0];
    let bestScore = -Infinity;
    
    for (const action of possibleActions) {
        let score = 0;
        
        // Базовый приоритет как в средней стратегии
        const priority = {
            'move': 5,
            'placeAdjacent': 4,
            'placeAnywhere': 3,
            'replaceAdjacent': 2,
            'replace': 1
        }[action.type] || 0;
        
        score += priority * 10;
        
        // Предпочтение дешевым действиям
        score += (10 - action.cost) * 2;
        
        if (score > bestScore) {
            bestScore = score;
            bestAction = action;
        }
    }
    
    logAi(`Выбрано стратегическое действие: ${bestAction.type} (оценка: ${bestScore.toFixed(1)})`, 'action');
    
    return executeAiAction(bestAction.type, aiPlayer, finish, bestAction);
}

// Выполнение действия ИИ
function executeAiAction(actionType, aiPlayer, finish, actionInfo) {
    logAi(`▶️ Выполнение: ${actionType}`, 'action');
    
    switch (actionType) {
        case 'move':
            return aiPerformMove(aiPlayer, finish, actionInfo);
        case 'placeAdjacent':
            return aiPerformPlaceAdjacent(aiPlayer, finish, actionInfo);
        case 'placeAnywhere':
            return aiPerformPlaceAnywhere(aiPlayer, finish, actionInfo);
        case 'replaceAdjacent':
            return aiPerformReplaceAdjacent(aiPlayer, actionInfo);
        case 'replace':
            return aiPerformReplace(aiPlayer, actionInfo);
        default:
            logAi(`❌ Неизвестное действие: ${actionType}`, 'error');
            return false;
    }
}

// Движение ИИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiPerformMove(aiPlayer, finish, actionInfo) {
    const validMoves = actionInfo.moveList || getValidMoves(aiPlayer);
    
    if (!validMoves || validMoves.length === 0) {
        logAi('❌ Нет доступных ходов (неожиданная ошибка)', 'error');
        state.aiThinking = false;
        aiActionInProgress = false;
        return false;
    }
    
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
    
    // Выполняем ход
    const oldRow = aiPlayer.row;
    const oldCol = aiPlayer.col;
    const oldPoints = state.points;
    
    aiPlayer.row = bestMove.row;
    aiPlayer.col = bestMove.col;
    state.points -= COST.move;
    
    logAi(`Перемещение: (${oldRow},${oldCol}) → (${aiPlayer.row},${aiPlayer.col}), очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ переместился на (${aiPlayer.row},${aiPlayer.col})`);
    
    renderBoard();
    updateUI(); // ВАЖНО: обновляем UI после изменения очков!
    
    // Проверяем победу
    if (checkWin(aiPlayer, state.board[aiPlayer.row][aiPlayer.col])) {
        logAi('🏆 ИИ ДОСТИГ ФИНИША! ПОБЕДА!', 'success');
        state.aiThinking = false;
        aiActionInProgress = false;
        setTimeout(() => {
            showWinModal();
        }, 1000);
        return true;
    }
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        // Сбрасываем флаги перед следующим вызовом
        state.aiThinking = false;
        aiActionInProgress = false;
        
        setTimeout(aiTurn, 800);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return true;
}

// Размещение тайла рядом - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiPerformPlaceAdjacent(aiPlayer, finish, actionInfo) {
    const adjacentEmpty = actionInfo.cellList || getAdjacentEmpty(aiPlayer);
    
    if (!adjacentEmpty || adjacentEmpty.length === 0) {
        logAi('❌ Нет пустых клеток рядом (неожиданная ошибка)', 'error');
        state.aiThinking = false;
        aiActionInProgress = false;
        return false;
    }
    
    // Выбираем первую клетку
    const targetCell = adjacentEmpty[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    logAi(`Размещение тайла в (${targetCell.row},${targetCell.col}), поворот: ${bestRotation}`, 'place');
    
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
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[targetCell.row][targetCell.col] = {
        ...state.board[targetCell.row][targetCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен: тип ${oldTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ разместил тайл в (${targetCell.row},${targetCell.col})`);
    
    renderBoard();
    renderNextTile();
    updateUI(); // ВАЖНО: обновляем UI после изменения очков!
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        // Сбрасываем флаги перед следующим вызовом
        state.aiThinking = false;
        aiActionInProgress = false;
        
        setTimeout(aiTurn, 800);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return true;
}

// Размещение тайла где угодно - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiPerformPlaceAnywhere(aiPlayer, finish, actionInfo) {
    const allEmpty = actionInfo.cellList || getAllEmpty();
    
    if (!allEmpty || allEmpty.length === 0) {
        logAi('❌ Нет пустых клеток (неожиданная ошибка)', 'error');
        state.aiThinking = false;
        aiActionInProgress = false;
        return false;
    }
    
    // Выбираем клетку ближе к финишу
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
    
    logAi(`Размещение тайла в (${bestCell.row},${bestCell.col}), расстояние до финиша: ${bestDist}`, 'place');
    
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
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[bestCell.row][bestCell.col] = {
        ...state.board[bestCell.row][bestCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен: тип ${oldTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ разместил тайл в (${bestCell.row},${bestCell.col})`);
    
    renderBoard();
    renderNextTile();
    updateUI(); // ВАЖНО: обновляем UI после изменения очков!
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        // Сбрасываем флаги перед следующим вызовом
        state.aiThinking = false;
        aiActionInProgress = false;
        
        setTimeout(aiTurn, 800);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return true;
}

// Замена соседнего тайла - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiPerformReplaceAdjacent(aiPlayer, actionInfo) {
    const adjacentReplaceable = actionInfo.cellList || getAdjacentReplaceable();
    
    if (!adjacentReplaceable || adjacentReplaceable.length === 0) {
        logAi('❌ Нет заменяемых тайлов рядом (неожиданная ошибка)', 'error');
        state.aiThinking = false;
        aiActionInProgress = false;
        return false;
    }
    
    // Выбираем первый тайл
    const targetCell = adjacentReplaceable[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    logAi(`Замена тайла в (${targetCell.row},${targetCell.col}), поворот: ${bestRotation}`, 'replace');
    
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
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[targetCell.row][targetCell.col].tileType = state.nextTileType;
    state.board[targetCell.row][targetCell.col].rotation = bestRotation;
    
    state.points -= COST.replaceAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл заменен: новый тип ${oldTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ заменил тайл в (${targetCell.row},${targetCell.col})`);
    
    renderBoard();
    renderNextTile();
    updateUI(); // ВАЖНО: обновляем UI после изменения очков!
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        // Сбрасываем флаги перед следующим вызовом
        state.aiThinking = false;
        aiActionInProgress = false;
        
        setTimeout(aiTurn, 800);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return true;
}

// Замена любого тайла - ИСПРАВЛЕННАЯ ВЕРСИЯ
function aiPerformReplace(aiPlayer, actionInfo) {
    const replaceable = actionInfo.cellList || getReplaceable();
    
    if (!replaceable || replaceable.length === 0) {
        logAi('❌ Нет заменяемых тайлов (неожиданная ошибка)', 'error');
        state.aiThinking = false;
        aiActionInProgress = false;
        return false;
    }
    
    // Выбираем первый тайл
    const targetCell = replaceable[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    logAi(`Замена тайла в (${targetCell.row},${targetCell.col}), поворот: ${bestRotation}`, 'replace');
    
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
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[targetCell.row][targetCell.col].tileType = state.nextTileType;
    state.board[targetCell.row][targetCell.col].rotation = bestRotation;
    
    state.points -= COST.replace;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл заменен: новый тип ${oldTileType}, очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ заменил тайл в (${targetCell.row},${targetCell.col})`);
    
    renderBoard();
    renderNextTile();
    updateUI(); // ВАЖНО: обновляем UI после изменения очков!
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        // Сбрасываем флаги перед следующим вызовом
        state.aiThinking = false;
        aiActionInProgress = false;
        
        setTimeout(aiTurn, 800);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
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
        updateStatus('🤖 Режим против ИИ включен!');
        
        // Создаем панель логов
        if (!document.getElementById('ai-log-panel')) {
            createAiLogPanel();
        }
        
        logAi('Режим ИИ включен', 'success');
        logAi(`Сложность: ${state.aiDifficulty}`, 'info');
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
    
    const difficultyNames = {
        'easy': 'Легкая',
        'medium': 'Средняя', 
        'hard': 'Сложная'
    };
    
    if (state.aiOpponent) {
        updateStatus(`🤖 Сложность ИИ: ${difficultyNames[difficulty]}`);
        logAi(`Сложность изменена на: ${difficultyNames[difficulty]}`, 'info');
    }
}

// Функция для принудительного завершения хода ИИ
function forceEndAiTurn() {
    if (state.aiOpponent && state.currentPlayer === 1) {
        logAi('Ход ИИ принудительно завершен игроком', 'warning');
        completeAiTurn('🤖 Ход ИИ принудительно завершен');
    }
}

// Инициализация ИИ при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем состояние ИИ
    state.aiThinking = false;
    state.aiStatus = '';
    aiTurnTimeout = null;
    aiActionInProgress = false;
    
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
    
    // Патчим функцию endTurn в основном файле для корректной работы
    const originalEndTurn = window.endTurn;
    window.endTurn = function() {
        // Сбрасываем флаги ИИ при любом завершении хода
        state.aiThinking = false;
        aiActionInProgress = false;
        if (aiTurnTimeout) {
            clearTimeout(aiTurnTimeout);
            aiTurnTimeout = null;
        }
        
        // Если это был ход ИИ, логируем
        if (state.aiOpponent && state.currentPlayer === 1) {
            logAi('=== КОНЕЦ ХОДА ИИ (вызван endTurn) ===', 'phase');
            
            // Сбрасываем состояние ИИ
            state.selectedAction = null;
            state.selectedCell = null;
            state.lastTilePlacement = null;
            clearHighlights();
            
            // Меняем игрока
            state.currentPlayer = 0;
            state.phase = 'roll';
            // НЕ сбрасываем очки - они уже должны быть правильно подсчитаны!
            // state.points = 0; // УБИРАЕМ ЭТУ СТРОКУ!
            
            // Генерируем новый тайл
            state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
            state.nextTileRotation = 0;
            renderNextTile();
            
            // Сбрасываем кубик
            document.getElementById('dice').textContent = '?';
            
            // Обновляем UI
            updateUI();
            
            logAi(`Ход передан игроку (через endTurn). Очки: ${state.points}`, 'phase');
            updateStatus(`Игрок, бросьте кубик!`);
        } else {
            // Если это ход игрока, вызываем оригинальную функцию
            if (originalEndTurn) {
                originalEndTurn();
            }
        }
    };
    
    // Патчим rollDice для логирования броска ИИ
    const originalRollDice = window.rollDice;
    window.rollDice = function() {
        logAi('Вызов rollDice()', 'debug');
        
        if (originalRollDice) {
            originalRollDice();
        }
        
        // Логируем результат броска для ИИ
        if (state.aiOpponent && state.currentPlayer === 1) {
            setTimeout(() => {
                logAi(`Бросок завершен. Выпало: ${state.points} очков, фаза: ${state.phase}`, 'phase');
            }, 1100); // Чуть больше времени, чем анимация броска
        }
        
        // После броска кубика обновляем UI
        setTimeout(updateUI, 100);
    };
    
    logAi('Модуль ИИ инициализирован', 'success');
});