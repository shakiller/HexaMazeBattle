// === КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
// Проверяем, что мы в браузере
if (typeof window === 'undefined') {
    throw new Error('ai.js должен загружаться в браузере');
}

// TILE_TYPES и COST уже определены в script.js, не переопределяем их здесь
// Если BOARD_SIZE не определена, устанавливаем значение по умолчанию
if (typeof BOARD_SIZE === 'undefined') {
    var BOARD_SIZE = 9; // Размер игрового поля по умолчанию
}

// Инициализация состояния ИИ, если не существует
if (typeof state !== 'undefined') {
    if (!state.aiOpponent) {
        state.aiOpponent = false;
        state.aiDifficulty = 'medium';
        state.aiThinking = false;
    }
    // Убеждаемся, что gameModeType существует
    if (typeof state.gameModeType === 'undefined') {
        state.gameModeType = 'single';
    }
}

// Глобальные переменные для управления ходом ИИ
let aiTurnTimeout = null;
let aiActionInProgress = false;
let aiTurnLock = false;
let aiIsMakingMove = false;

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
        'debug': { emoji: '🔍', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
        'roll': { emoji: '🎲', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' },
        'path': { emoji: '🗺️', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
        'strategy': { emoji: '🧠', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
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

// Копирование лога
function copyAiLog() {
    const logContent = document.getElementById('ai-log-content');
    if (!logContent) {
        logAi('Лог не найден', 'error');
        return;
    }
    
    try {
        let text = '';
        const entries = logContent.querySelectorAll('div');
        entries.forEach(entry => {
            const timestamp = entry.querySelector('span[style*="color: #64748b"]')?.textContent || '';
            const emoji = entry.querySelector('span[style*="font-weight: bold"]')?.textContent || '';
            const message = entry.querySelector('span[style*="color: #e2e8f0"]')?.textContent || '';
            text += `${timestamp} ${emoji} ${message}\n`;
        });
        
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
if (typeof updateStatus === 'function') {
    const originalUpdateStatus = updateStatus;
    updateStatus = function(text) {
        originalUpdateStatus(text);
        
        // Логируем статусы связанные с ИИ
        if (state.aiOpponent && state.currentPlayer === 1) {
            if (text.includes('ИИ') || text.includes('🤖') || text.includes('бросает')) {
                logAi(`Статус: ${text}`, 'phase');
            }
        }
    };
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Функция rotateEdges (если не определена в основном коде)
if (typeof rotateEdges !== 'function') {
    function rotateEdges(edges, rotation) {
        if (!edges || !Array.isArray(edges)) return [];
        return edges.map(edge => (edge + rotation) % 6);
    }
}

// Функция getNeighbors (если не определена в основном коде)
if (typeof getNeighbors !== 'function') {
    function getNeighbors(row, col) {
        const neighbors = [];
        const directions = [
            { dr: -1, dc: 0, edge: 0 },   // Вверх
            { dr: -1, dc: 1, edge: 1 },   // Вверх-вправо
            { dr: 0, dc: 1, edge: 2 },    // Вправо
            { dr: 1, dc: 0, edge: 3 },    // Вниз
            { dr: 1, dc: -1, edge: 4 },   // Вниз-влево
            { dr: 0, dc: -1, edge: 5 }    // Влево
        ];
        
        for (const dir of directions) {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;
            
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                neighbors.push({
                    row: newRow,
                    col: newCol,
                    edge: dir.edge
                });
            }
        }
        
        return neighbors;
    }
}

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

// Функция для подсчета соединений тайла с соседями
function countTileConnections(row, col, tileType, rotation) {
    if (!tileType && tileType !== 0) return 0;
    if (!TILE_TYPES[tileType]) return 0;
    
    const neighbors = getNeighbors(row, col);
    const edges = rotateEdges(TILE_TYPES[tileType], rotation);
    
    let connections = 0;
    for (const neighbor of neighbors) {
        const nCell = state.board[neighbor.row][neighbor.col];
        if (!nCell.isEmpty && nCell.tileType !== null && nCell.tileType !== undefined) {
            if (!TILE_TYPES[nCell.tileType]) continue;
            
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

// Функция для получения всех пустых клеток
function getAllEmpty() {
    const emptyCells = [];
    if (!state.board || !BOARD_SIZE) return emptyCells;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (!state.board[row]) continue;
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (state.board[row][col] && state.board[row][col].isEmpty) {
                emptyCells.push({row, col});
            }
        }
    }
    return emptyCells;
}

// Функция для получения соседних пустых клеток
function getAdjacentEmpty(player) {
    const adjacent = [];
    const neighbors = getNeighbors(player.row, player.col);
    
    for (const neighbor of neighbors) {
        const cell = state.board[neighbor.row][neighbor.col];
        if (cell && cell.isEmpty) {
            adjacent.push({row: neighbor.row, col: neighbor.col});
        }
    }
    
    return adjacent;
}

// Функция для получения заменяемых тайлов рядом
function getAdjacentReplaceable() {
    const aiPlayer = state.players[1];
    const adjacent = [];
    const neighbors = getNeighbors(aiPlayer.row, aiPlayer.col);
    
    for (const neighbor of neighbors) {
        const cell = state.board[neighbor.row][neighbor.col];
        if (cell && !cell.isEmpty && cell.tileType !== null) {
            // Нельзя заменять тайлы с игроками
            const hasPlayer = state.players.some(p => p.row === neighbor.row && p.col === neighbor.col) ||
                             (state.finishPos && state.finishPos.some(f => f.row === neighbor.row && f.col === neighbor.col));
            if (!hasPlayer) {
                adjacent.push({row: neighbor.row, col: neighbor.col});
            }
        }
    }
    
    return adjacent;
}

// Функция для получения всех заменяемых тайлов
function getReplaceable() {
    const replaceable = [];
    if (!state.board || !BOARD_SIZE) return replaceable;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (!state.board[row]) continue;
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = state.board[row][col];
            if (cell && !cell.isEmpty && cell.tileType !== null) {
                // Нельзя заменять тайлы с игроками или финишами
                const hasPlayer = state.players.some(p => p.row === row && p.col === col) ||
                                 (state.finishPos && state.finishPos.some(f => f.row === row && f.col === col));
                if (!hasPlayer) {
                    replaceable.push({row, col});
                }
            }
        }
    }
    
    return replaceable;
}

// Функция для проверки, может ли игрок куда-то двигаться
function canMoveAnywhere(player) {
    return getValidMoves(player).length > 0;
}

// Функция для получения допустимых ходов
function getValidMoves(player) {
    const validMoves = [];
    const visited = new Set();
    const queue = [{row: player.row, col: player.col, path: []}];
    
    visited.add(`${player.row},${player.col}`);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Если это не начальная позиция, добавляем как возможный ход
        if (current.row !== player.row || current.col !== player.col) {
            validMoves.push({row: current.row, col: current.col});
        }
        
        // Получаем соседей
        const neighbors = getNeighbors(current.row, current.col);
        
        for (const neighbor of neighbors) {
            const key = `${neighbor.row},${neighbor.col}`;
            
            if (visited.has(key)) continue;
            
            // Проверяем, можно ли пройти
            const currentCell = state.board[current.row][current.col];
            const neighborCell = state.board[neighbor.row][neighbor.col];
            
            // Если текущая или соседняя клетка пустая - нельзя пройти
            if (!currentCell || !neighborCell || currentCell.isEmpty || neighborCell.isEmpty) continue;
            if (currentCell.tileType === null || neighborCell.tileType === null) continue;
            
            // Проверяем соединение
            const currentEdges = rotateEdges(TILE_TYPES[currentCell.tileType], currentCell.rotation);
            const neighborEdges = rotateEdges(TILE_TYPES[neighborCell.tileType], neighborCell.rotation);
            
            const myEdge = neighbor.edge;
            const theirEdge = (myEdge + 3) % 6;
            
            if (currentEdges.includes(myEdge) && neighborEdges.includes(theirEdge)) {
                visited.add(key);
                queue.push({row: neighbor.row, col: neighbor.col, path: [...current.path, neighbor]});
            }
        }
    }
    
    return validMoves;
}

// === ИНТЕЛЛЕКТУАЛЬНЫЕ ФУНКЦИИ ИИ ===

// Функция для получения поворота тайла в направлении цели
function getRotationTowardsTarget(row, col, tileType, targetRow, targetCol) {
    if (!tileType && tileType !== 0) return 0;
    
    // Вычисляем направление к цели
    const dx = targetCol - col;
    const dy = targetRow - row;
    
    // Определяем, какое направление наиболее важно
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    let desiredEdges = [];
    
    if (absDx > absDy) {
        // Горизонтальное направление более важно
        if (dx > 0) {
            // Цель справа
            desiredEdges = [1, 2]; // Правые края
        } else {
            // Цель слева
            desiredEdges = [4, 5]; // Левые края
        }
    } else {
        // Вертикальное направление более важно
        if (dy > 0) {
            // Цель снизу
            desiredEdges = [2, 3]; // Нижние края
        } else {
            // Цель сверху
            desiredEdges = [5, 0]; // Верхние края
        }
    }
    
    // Ищем поворот, который дает максимальное количество нужных направлений
    let bestRotation = 0;
    let bestMatch = 0;
    
    for (let rotation = 0; rotation < 6; rotation++) {
        const edges = rotateEdges(TILE_TYPES[tileType], rotation);
        let match = 0;
        
        for (const edge of desiredEdges) {
            if (edges.includes(edge)) {
                match++;
            }
        }
        
        if (match > bestMatch) {
            bestMatch = match;
            bestRotation = rotation;
        }
    }
    
    return bestRotation;
}

// Функция для оценки направления от позиции к цели
function evaluateDirectionToTarget(fromRow, fromCol, toRow, toCol) {
    const dx = toCol - fromCol;
    const dy = toRow - fromRow;
    
    // Возвращаем направление в виде угла (0-5 соответствуют краям гексагона)
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) return 1; // Восток/право
        else return 4; // Запад/лево
    } else {
        if (dy > 0) return 2; // Юго-восток/низ-право
        else return 5; // Северо-запад/верх-лево
    }
}

// Функция для нахождения пути A* к цели (УПРОЩЕННАЯ ВЕРСИЯ)
function findPathToTarget(startRow, startCol, targetRow, targetCol) {
    logAi(`Поиск пути от (${startRow},${startCol}) к (${targetRow},${targetCol})`, 'path');
    
    // Упрощенная версия - просто возвращаем null если не можем найти путь быстро
    // Это временное решение для тестирования
    
    // Проверяем простейший случай - если мы уже рядом
    if (Math.abs(startRow - targetRow) <= 1 && Math.abs(startCol - targetCol) <= 1) {
        logAi('Цель рядом, возвращаем простой путь', 'path');
        return [{row: startRow, col: startCol}, {row: targetRow, col: targetCol}];
    }
    
    logAi('Путь не найден (упрощенная проверка)', 'warning');
    return null;
}

// Функция для нахождения лучшего места для размещения тайла (УПРОЩЕННАЯ)
function findBestTilePlacement(aiRow, aiCol, targetRow, targetCol, tileType) {
    logAi(`Поиск лучшего места для тайла типа ${tileType}`, 'strategy');
    
    const allEmpty = getAllEmpty();
    if (allEmpty.length === 0) {
        logAi('Нет пустых клеток', 'warning');
        return null;
    }
    
    // Упрощенная логика: выбираем пустую клетку ближе к цели
    let bestCell = allEmpty[0];
    let bestDist = Math.abs(bestCell.row - targetRow) + Math.abs(bestCell.col - targetCol);
    
    for (const cell of allEmpty) {
        const dist = Math.abs(cell.row - targetRow) + Math.abs(cell.col - targetCol);
        if (dist < bestDist) {
            bestDist = dist;
            bestCell = cell;
        }
    }
    
    // Простой поворот в направлении цели
    const bestRotation = getBestRotationForTile(bestCell.row, bestCell.col, tileType);
    
    const bestPlacement = {
        row: bestCell.row,
        col: bestCell.col,
        rotation: bestRotation,
        score: 100 - bestDist, // Чем ближе к цели, тем выше оценка
        tileType: tileType
    };
    
    logAi(`Упрощенное размещение: (${bestPlacement.row},${bestPlacement.col}) поворот ${bestPlacement.rotation}`, 'strategy');
    
    return bestPlacement;
}

// Функция для оценки направления тайла к цели (УПРОЩЕННАЯ)
function evaluateTileDirection(row, col, rotation, tileType, targetRow, targetCol) {
    if (!tileType && tileType !== 0) return 0;
    if (!TILE_TYPES[tileType]) return 0;
    
    const edges = rotateEdges(TILE_TYPES[tileType], rotation);
    
    // Вычисляем общее направление
    const dx = targetCol - col > 0 ? 1 : -1;
    const dy = targetRow - row > 0 ? 1 : -1;
    
    let score = 0;
    
    // Простая оценка: тайл смотрит в правильном направлении?
    if (dx > 0 && (edges.includes(1) || edges.includes(2))) score++;
    if (dx < 0 && (edges.includes(4) || edges.includes(5))) score++;
    if (dy > 0 && (edges.includes(2) || edges.includes(3))) score++;
    if (dy < 0 && (edges.includes(5) || edges.includes(0))) score++;
    
    return score;
}

// Функция для нахождения лучшего хода (движения) - УПРОЩЕННАЯ
function findBestMove(aiPlayer, targetRow, targetCol) {
    const validMoves = getValidMoves(aiPlayer);
    if (!validMoves || validMoves.length === 0) return null;
    
    // Простая логика: выбираем ход, который приближает к цели
    let bestMove = validMoves[0];
    let bestDist = Math.abs(bestMove.row - targetRow) + Math.abs(bestMove.col - targetCol);
    
    for (const move of validMoves) {
        const dist = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);
        if (dist < bestDist) {
            bestDist = dist;
            bestMove = move;
        }
    }
    
    logAi(`Лучший ход (упрощенный): (${bestMove.row},${bestMove.col})`, 'strategy');
    
    return bestMove;
}

// === УПРАВЛЕНИЕ ХОДОМ ИИ ===

// Функция для запуска хода ИИ
function startAiTurn() {
    logAi('=== ЗАПУСК ХОДА ИИ ===', 'action');
    logAi(`Состояние: player=${state.currentPlayer}, phase=${state.phase}, aiOpponent=${state.aiOpponent}`, 'debug');
    
    if (!state.aiOpponent) {
        logAi('Режим ИИ не включен', 'warning');
        return;
    }
    
    if (state.currentPlayer !== 1) {
        logAi('Сейчас не ход ИИ (player не равен 1)', 'warning');
        return;
    }
    
    // Отключаем кнопку завершения хода на время хода ИИ
    disableEndTurnButton();
    
    // Сбрасываем флаги перед началом
    state.aiThinking = false;
    aiActionInProgress = false;
    aiTurnLock = false;
    aiIsMakingMove = true;
    
    if (aiTurnTimeout) {
        clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    
    // Начинаем ход с небольшой задержкой
    setTimeout(() => {
        aiTurn();
    }, 500);
}

// Функция для отключения кнопки завершения хода
function disableEndTurnButton() {
    const endTurnBtn = document.getElementById('btn-end');
    if (endTurnBtn) {
        endTurnBtn.disabled = true;
        endTurnBtn.style.opacity = '0.5';
        endTurnBtn.style.cursor = 'not-allowed';
        endTurnBtn.title = 'Дождитесь завершения хода ИИ';
    }
}

// Функция для включения кнопки завершения хода
function enableEndTurnButton() {
    const endTurnBtn = document.getElementById('btn-end');
    if (endTurnBtn) {
        endTurnBtn.disabled = false;
        endTurnBtn.style.opacity = '1';
        endTurnBtn.style.cursor = 'pointer';
        endTurnBtn.title = 'Завершить ход';
    }
}

// Функция для хода ИИ (УПРОЩЕННАЯ И РАБОЧАЯ)
function aiTurn() {
    logAi(`=== НАЧАЛО ХОДА ИИ ===`, 'action');
    logAi(`Состояние: player=${state.currentPlayer}, phase=${state.phase}, points=${state.points}, tile=${state.nextTileType}`, 'debug');
    
    // Проверяем, что сейчас действительно ход ИИ
    if (!state.aiOpponent || state.currentPlayer !== 1) {
        logAi('Сейчас не ход ИИ (проверка не прошла)', 'warning');
        state.aiThinking = false;
        aiActionInProgress = false;
        aiTurnLock = false;
        aiIsMakingMove = false;
        enableEndTurnButton();
        return;
    }
    
    if (aiTurnLock) {
        logAi('Ход ИИ уже выполняется (lock)', 'warning');
        return;
    }
    
    aiTurnLock = true;
    state.aiThinking = true;
    aiActionInProgress = true;
    aiIsMakingMove = true;
    
    if (state.phase === 'roll') {
        logAi('Фаза: Бросок кубика', 'phase');
        updateStatus('🤖 ИИ бросает кубик...');
        
        // Бросаем кубик с небольшой задержкой
        aiTurnTimeout = setTimeout(() => {
            logAi('Вызываем rollDice()', 'roll');
            
            if (typeof rollDice === 'function') {
                try {
                    rollDice();
                    
                    // Даем время на анимацию броска и обновление состояния
                    setTimeout(() => {
                        logAi(`После броска: фаза=${state.phase}, очки=${state.points}`, 'debug');
                        
                        if (state.phase === 'action' && state.points > 0) {
                            logAi(`Успешно! Выпало ${state.points} очков, продолжаем...`, 'success');
                            
                            // Сбрасываем флаги и продолжаем в action phase
                            state.aiThinking = false;
                            aiActionInProgress = false;
                            aiTurnLock = false;
                            
                            // Небольшая пауза перед действиями
                            setTimeout(() => {
                                if (state.aiOpponent && state.currentPlayer === 1 && state.phase === 'action') {
                                    aiMakeDecision();
                                }
                            }, 500);
                        } else {
                            logAi(`Проблема: фаза=${state.phase}, очки=${state.points}`, 'error');
                            emergencyEndAiTurn();
                        }
                    }, 1000);
                } catch (error) {
                    logAi(`Ошибка при броске кубика: ${error.message}`, 'error');
                    emergencyEndAiTurn();
                }
            } else {
                logAi('Ошибка: функция rollDice не найдена', 'error');
                emergencyEndAiTurn();
            }
        }, 800);
        return;
    }
    
    if (state.phase !== 'action') {
        logAi(`Неправильная фаза для действий: ${state.phase}`, 'error');
        emergencyEndAiTurn();
        return;
    }
    
    // Если мы в action phase, сразу принимаем решение
    aiMakeDecision();
}

// Аварийное завершение хода ИИ
function emergencyEndAiTurn() {
    logAi('Аварийное завершение хода ИИ', 'error');
    
    // Сбрасываем все флаги
    state.aiThinking = false;
    aiActionInProgress = false;
    aiTurnLock = false;
    aiIsMakingMove = false;
    
    // Включаем кнопку завершения хода
    enableEndTurnButton();
    
    if (aiTurnTimeout) {
        clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    
    // Передаем ход игроку
    state.currentPlayer = 0;
    state.phase = 'roll';
    
    updateStatus('❌ Ошибка ИИ. Ваш ход!');
    if (typeof renderBoard === 'function') {
        renderBoard();
    }
    if (typeof updateUI === 'function') {
        updateUI();
    }
    
    logAi('Ход передан игроку (аварийно)', 'phase');
}

// Основная функция принятия решений ИИ (УПРОЩЕННАЯ РАБОЧАЯ ВЕРСИЯ)
function aiMakeDecision() {
    logAi(`Принятие решения. Очки: ${state.points}`, 'action');
    
    // Проверка на отрицательные очки
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
    
    // ПРОСТАЯ РАБОЧАЯ СТРАТЕГИЯ
    const actions = [];
    
    // 1. Движение
    if (state.points >= COST.move) {
        const validMoves = getValidMoves(aiPlayer);
        if (validMoves.length > 0) {
            // Выбираем ход ближе к финишу
            let bestMove = validMoves[0];
            let bestDist = Math.abs(bestMove.row - finish.row) + Math.abs(bestMove.col - finish.col);
            
            for (const move of validMoves) {
                const dist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestMove = move;
                }
            }
            
            actions.push({
                type: 'move',
                cost: COST.move,
                possible: true,
                target: bestMove,
                priority: 100
            });
        }
    }
    
    // 2. Размещение рядом (если можем)
    if (state.points >= COST.placeAdjacent) {
        const adjacentEmpty = getAdjacentEmpty(aiPlayer);
        if (adjacentEmpty.length > 0) {
            // Выбираем первую доступную клетку
            const targetCell = adjacentEmpty[0];
            const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
            
            actions.push({
                type: 'placeAdjacent',
                cost: COST.placeAdjacent,
                possible: true,
                target: targetCell,
                rotation: bestRotation,
                priority: 90
            });
        }
    }
    
    // 3. Размещение где угодно (если не можем рядом)
    if (state.points >= COST.placeAnywhere && actions.filter(a => a.type === 'placeAdjacent').length === 0) {
        const allEmpty = getAllEmpty();
        if (allEmpty.length > 0) {
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
            
            actions.push({
                type: 'placeAnywhere',
                cost: COST.placeAnywhere,
                possible: true,
                target: bestCell,
                rotation: bestRotation,
                priority: 80
            });
        }
    }
    
    // Сортируем действия по приоритету
    actions.sort((a, b) => b.priority - a.priority);
    
    logAi(`Доступных действий: ${actions.length}`, 
          actions.length > 0 ? 'success' : 'warning');
    
    if (actions.length === 0) {
        logAi('❌ Нет доступных действий, завершаем ход', 'error');
        completeAiTurn('🤖 ИИ: нет доступных действий');
        return;
    }
    
    // Выполняем лучшее действие
    const bestAction = actions[0];
    logAi(`Выбрано действие: ${bestAction.type}`, 'strategy');
    
    executeSimpleAiAction(bestAction, aiPlayer, finish);
}

// Выполнение простого действия ИИ
function executeSimpleAiAction(action, aiPlayer, finish) {
    logAi(`▶️ Выполнение: ${action.type}`, 'action');
    
    switch (action.type) {
        case 'move':
            return aiPerformSimpleMove(aiPlayer, finish, action);
        case 'placeAdjacent':
            return aiPerformSimplePlaceAdjacent(aiPlayer, finish, action);
        case 'placeAnywhere':
            return aiPerformSimplePlaceAnywhere(aiPlayer, finish, action);
        default:
            logAi(`❌ Неизвестное действие: ${action.type}`, 'error');
            completeAiTurn('🤖 ИИ: неизвестное действие');
            return false;
    }
}

// Простое движение
function aiPerformSimpleMove(aiPlayer, finish, action) {
    const target = action.target;
    
    logAi(`Ход: (${aiPlayer.row},${aiPlayer.col}) → (${target.row},${target.col})`, 'move');
    
    // Выполняем ход
    const oldPoints = state.points;
    
    aiPlayer.row = target.row;
    aiPlayer.col = target.col;
    state.points -= COST.move;
    
    logAi(`Перемещение выполнено! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ переместился`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof updateUI === 'function') updateUI();
    
    // Проверяем победу
    if (typeof checkWin === 'function' && checkWin(aiPlayer, state.board[aiPlayer.row][aiPlayer.col])) {
        logAi('🏆 ИИ ДОСТИГ ФИНИША! ПОБЕДА!', 'success');
        setTimeout(() => {
            if (typeof showWinModal === 'function') showWinModal();
        }, 1000);
        return true;
    }
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        setTimeout(() => {
            state.aiThinking = false;
            aiActionInProgress = false;
            aiTurnLock = false;
            aiMakeDecision();
        }, 1000);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return true;
}

// Простое размещение рядом
function aiPerformSimplePlaceAdjacent(aiPlayer, finish, action) {
    const target = action.target;
    const rotation = action.rotation;
    
    logAi(`Размещение рядом: (${target.row},${target.col}), поворот ${rotation}`, 'place');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'placeAdjacent',
        row: target.row,
        col: target.col,
        previousCellState: { ...state.board[target.row][target.col] },
        pointsUsed: COST.placeAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Размещаем тайл
    const oldPoints = state.points;
    
    state.board[target.row][target.col] = {
        ...state.board[target.row][target.col],
        tileType: state.nextTileType,
        rotation: rotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ разместил тайл`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof renderNextTile === 'function') renderNextTile();
    if (typeof updateUI === 'function') updateUI();
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        setTimeout(() => {
            state.aiThinking = false;
            aiActionInProgress = false;
            aiTurnLock = false;
            aiMakeDecision();
        }, 1000);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return true;
}

// Простое размещение где угодно
function aiPerformSimplePlaceAnywhere(aiPlayer, finish, action) {
    const target = action.target;
    const rotation = action.rotation;
    
    logAi(`Размещение: (${target.row},${target.col}), поворот ${rotation}`, 'place');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: target.row,
        col: target.col,
        previousCellState: { ...state.board[target.row][target.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Размещаем тайл
    const oldPoints = state.points;
    
    state.board[target.row][target.col] = {
        ...state.board[target.row][target.col],
        tileType: state.nextTileType,
        rotation: rotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ разместил тайл`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof renderNextTile === 'function') renderNextTile();
    if (typeof updateUI === 'function') updateUI();
    
    // Продолжаем ход, если есть очки
    if (state.points > 0) {
        logAi(`Осталось очков: ${state.points}, продолжаем ход`, 'info');
        
        setTimeout(() => {
            state.aiThinking = false;
            aiActionInProgress = false;
            aiTurnLock = false;
            aiMakeDecision();
        }, 1000);
    } else {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return true;
}

// Функция для корректного завершения хода ИИ
function completeAiTurn(message) {
    logAi('Завершение хода ИИ...', 'phase');
    
    // Включаем кнопку завершения хода
    enableEndTurnButton();
    
    // Сбрасываем все флаги
    state.aiThinking = false;
    aiActionInProgress = false;
    aiTurnLock = false;
    aiIsMakingMove = false;
    
    if (aiTurnTimeout) {
        clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    
    // Обновляем статус
    if (message) {
        updateStatus(message);
    }
    
    // Даем небольшую задержку перед передачей хода
    setTimeout(() => {
        if (state.aiOpponent && state.currentPlayer === 1) {
            logAi('Передача хода игроку', 'phase');
            aiEndTurn();
        }
    }, 800);
}

// Функция завершения хода для ИИ
function aiEndTurn() {
    logAi('Выполняем aiEndTurn()', 'phase');
    
    enableEndTurnButton();
    
    state.aiThinking = false;
    aiActionInProgress = false;
    aiTurnLock = false;
    aiIsMakingMove = false;
    
    if (aiTurnTimeout) {
        clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    
    state.selectedAction = null;
    state.selectedCell = null;
    state.lastTilePlacement = null;
    if (typeof clearHighlights === 'function') clearHighlights();
    
    state.currentPlayer = 0;
    state.phase = 'roll';
    
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    if (typeof renderNextTile === 'function') renderNextTile();
    
    const diceElement = document.getElementById('dice');
    if (diceElement) diceElement.textContent = '?';
    
    if (typeof updateUI === 'function') updateUI();
    
    logAi(`Ход ИИ завершен, передано игроку`, 'phase');
    updateStatus(`Игрок, бросьте кубик!`);
}

// === ФУНКЦИИ ДЛЯ ТЕСТИРОВАНИЯ БОТА ===

// Создаем кнопку для тестирования бота
function createTestBotButton() {
    const testBtn = document.createElement('button');
    testBtn.id = 'btn-test-bot';
    testBtn.textContent = '🤖 Тест бота';
    testBtn.style.cssText = `
        position: fixed;
        top: 100px;
        right: 10px;
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        color: white;
        border: 2px solid #a78bfa;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        z-index: 999;
        transition: all 0.2s;
        box-shadow: 0 0 15px rgba(124, 58, 237, 0.4);
    `;
    
    testBtn.onmouseover = () => {
        testBtn.style.transform = 'translateY(-2px)';
        testBtn.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.6)';
    };
    
    testBtn.onmouseout = () => {
        testBtn.style.transform = 'translateY(0)';
        testBtn.style.boxShadow = '0 0 15px rgba(124, 58, 237, 0.4)';
    };
    
    testBtn.onclick = function() {
        logAi('=== ЗАПУСК ТЕСТА БОТА ===', 'action');
        
        // Включаем режим ИИ
        setAiMode(true);
        setAiDifficulty('hard');
        
        // Передаем ход ИИ
        state.currentPlayer = 1;
        state.phase = 'roll';
        
        // Обновляем UI
        if (typeof updateUI === 'function') updateUI();
        
        // Запускаем ход ИИ
        setTimeout(() => {
            startAiTurn();
        }, 1000);
        
        // Меняем текст кнопки
        testBtn.textContent = '🤖 Тест запущен...';
        testBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        testBtn.disabled = true;
        
        // Через 10 секунд возвращаем кнопку в исходное состояние
        setTimeout(() => {
            testBtn.textContent = '🤖 Тест бота';
            testBtn.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
            testBtn.disabled = false;
        }, 10000);
    };
    
    document.body.appendChild(testBtn);
    return testBtn;
}

// Функция для быстрой игры ИИ против себя (автоматический тест)
function startBotSelfPlay() {
    logAi('=== ЗАПУСК АВТОНОМНОЙ ИГРЫ БОТА ===', 'action');
    
    // Включаем режим ИИ
    setAiMode(true);
    setAiDifficulty('hard');
    
    // Устанавливаем, что сейчас ход ИИ
    state.currentPlayer = 1;
    state.phase = 'roll';
    
    // Обновляем UI
    if (typeof updateUI === 'function') updateUI();
    
    // Запускаем ход ИИ
    setTimeout(() => {
        startAiTurn();
    }, 1000);
    
    // Создаем кнопку остановки
    const stopBtn = document.createElement('button');
    stopBtn.id = 'btn-stop-bot';
    stopBtn.textContent = '⏹️ Остановить тест';
    stopBtn.style.cssText = `
        position: fixed;
        top: 150px;
        right: 10px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: 2px solid #fca5a5;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        z-index: 999;
        transition: all 0.2s;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
    `;
    
    stopBtn.onmouseover = () => {
        stopBtn.style.transform = 'translateY(-2px)';
        stopBtn.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
    };
    
    stopBtn.onmouseout = () => {
        stopBtn.style.transform = 'translateY(0)';
        stopBtn.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
    };
    
    stopBtn.onclick = function() {
        logAi('Тест бота остановлен вручную', 'warning');
        
        // Выключаем режим ИИ
        state.aiOpponent = false;
        state.currentPlayer = 0;
        state.phase = 'roll';
        
        // Сбрасываем флаги ИИ
        state.aiThinking = false;
        aiActionInProgress = false;
        aiTurnLock = false;
        aiIsMakingMove = false;
        
        if (aiTurnTimeout) {
            clearTimeout(aiTurnTimeout);
            aiTurnTimeout = null;
        }
        
        // Обновляем UI
        if (typeof updateUI === 'function') updateUI();
        updateStatus('Тест бота остановлен');
        
        // Удаляем кнопку остановки
        stopBtn.remove();
        
        // Возвращаем кнопку теста
        const testBtn = document.getElementById('btn-test-bot');
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.textContent = '🤖 Тест бота';
            testBtn.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
        }
    };
    
    document.body.appendChild(stopBtn);
}

// Функция для установки режима игры с ИИ
function setAiMode(enable, skipRestart) {
    state.aiOpponent = enable;
    if (enable) {
        state.numPlayers = 2;
        state.gameModeType = 'bot';
        
        // Обновляем UI кнопок режима (новая структура с data-mode-type)
        const modeButtons = document.querySelectorAll('.mode-btn[data-mode-type]');
        if (modeButtons.length > 0) {
            modeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.modeType === 'bot');
            });
        }
        
        // Показываем панель выбора сложности
        const aiPanel = document.getElementById('ai-mode-panel');
        if (aiPanel) {
            aiPanel.style.display = 'block';
        }
        
        updateStatus('🤖 Режим против ИИ включен!');
        
        // Создаем панель логов
        if (!document.getElementById('ai-log-panel')) {
            createAiLogPanel();
        }
        
        logAi('Режим ИИ включен', 'success');
        logAi(`Сложность: ${state.aiDifficulty}`, 'info');
        
        if (state.currentPlayer === 1) {
            setTimeout(() => {
                startAiTurn();
            }, 1500);
        }
    } else {
        // Скрываем панель выбора сложности
        const aiPanel = document.getElementById('ai-mode-panel');
        if (aiPanel) {
            aiPanel.style.display = 'none';
        }
        updateStatus('Режим против ИИ выключен');
    }
    
    // Перезапускаем игру, если функция существует и не пропущен флаг
    if (!skipRestart && typeof restartGame === 'function') {
        restartGame();
    } else if (!skipRestart) {
        // Если restartGame не существует, просто обновляем UI
        if (typeof renderBoard === 'function') renderBoard();
        if (typeof updateUI === 'function') updateUI();
    }
}

// Функция для установки сложности ИИ
function setAiDifficulty(difficulty, skipRestart) {
    if (typeof state === 'undefined') {
        console.error('setAiDifficulty: state не определен');
        return;
    }
    
    state.aiDifficulty = difficulty;
    
    // Обновляем UI кнопок сложности - делаем это сразу и синхронно
    const difficultyButtons = document.querySelectorAll('.mode-btn[data-difficulty]');
    difficultyButtons.forEach(btn => {
        if (btn && btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        } else if (btn) {
            btn.classList.remove('active');
        }
    });
    
    const difficultyNames = {
        'easy': 'Легкая',
        'medium': 'Средняя', 
        'hard': 'Сложная'
    };
    
    if (state.aiOpponent) {
        if (typeof updateStatus === 'function') {
            updateStatus(`🤖 Сложность ИИ: ${difficultyNames[difficulty]}`);
        }
        if (typeof logAi === 'function') {
            logAi(`Сложность изменена на: ${difficultyNames[difficulty]}`, 'info');
        }
    }
    
    // Перезапускаем игру, если режим бота активен и не пропущен флаг
    if (!skipRestart && state.aiOpponent && typeof restartGame === 'function') {
        // Небольшая задержка, чтобы UI успел обновиться
        setTimeout(() => {
            restartGame();
        }, 50);
    }
}

// Функция для принудительного завершения хода ИИ
function forceEndAiTurn() {
    if (state.aiOpponent && state.currentPlayer === 1 && aiIsMakingMove) {
        logAi('Ход ИИ принудительно завершен игроком', 'warning');
        completeAiTurn('🤖 Ход ИИ принудительно завершен');
    }
}

// Делаем функции доступными глобально сразу после определения
// Функции сами проверят state при вызове
try {
    if (typeof window !== 'undefined') {
        window.aiTurn = aiTurn;
        window.startAiTurn = startAiTurn;
        window.setAiMode = setAiMode;
        window.setAiDifficulty = setAiDifficulty;
    }
} catch (e) {
    console.error('ai.js: Ошибка при присвоении функций в window:', e);
}

// Инициализация ИИ при загрузке страницы
function initAiOnReady() {
    // Проверяем, что state доступен
    if (typeof state === 'undefined') {
        // Пытаемся еще раз через небольшую задержку
        setTimeout(initAiOnReady, 50);
        return;
    }
    
    // Убеждаемся, что функции доступны глобально
    if (typeof window !== 'undefined') {
        window.aiTurn = aiTurn;
        window.startAiTurn = startAiTurn;
        window.setAiMode = setAiMode;
        window.setAiDifficulty = setAiDifficulty;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initAiOnReady();
    
    // Проверяем, что state доступен
    if (typeof state === 'undefined') {
        console.error('ai.js: state не определен! Убедитесь, что script.js загружается перед ai.js');
        return;
    }
    
    // Инициализируем состояние ИИ
    if (typeof state.aiThinking === 'undefined') {
        state.aiThinking = false;
    }
    if (typeof state.aiStatus === 'undefined') {
        state.aiStatus = '';
    }
    aiTurnTimeout = null;
    aiActionInProgress = false;
    aiTurnLock = false;
    aiIsMakingMove = false;
    
    // Создаем кнопку тестирования бота
    createTestBotButton();
    
    // Добавляем обработчики для кнопок ИИ (если они существуют)
    const aiEasyBtn = document.getElementById('btn-ai-easy');
    const aiMediumBtn = document.getElementById('btn-ai-medium');
    const aiHardBtn = document.getElementById('btn-ai-hard');
    
    if (aiEasyBtn) aiEasyBtn.addEventListener('click', function() {
        // Сразу обновляем визуально кнопку
        const difficultyButtons = document.querySelectorAll('.mode-btn[data-difficulty]');
        difficultyButtons.forEach(btn => {
            if (btn.dataset.difficulty === 'easy') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Устанавливаем режим бота, если еще не установлен
        if (!state.aiOpponent || state.gameModeType !== 'bot') {
            if (typeof setGameModeType === 'function') {
                setGameModeType('bot');
                // После установки режима устанавливаем сложность
                setTimeout(() => {
                    setAiDifficulty('easy', false);
                }, 100);
            } else {
                if (typeof setAiMode === 'function') {
                    setAiMode(true);
                }
                setAiDifficulty('easy', false);
            }
        } else {
            // Режим уже установлен, просто меняем сложность
            setAiDifficulty('easy', false);
        }
    });

    if (aiMediumBtn) aiMediumBtn.addEventListener('click', function() {
        // Сразу обновляем визуально кнопку
        const difficultyButtons = document.querySelectorAll('.mode-btn[data-difficulty]');
        difficultyButtons.forEach(btn => {
            if (btn.dataset.difficulty === 'medium') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Устанавливаем режим бота, если еще не установлен
        if (!state.aiOpponent || state.gameModeType !== 'bot') {
            if (typeof setGameModeType === 'function') {
                setGameModeType('bot');
                setTimeout(() => {
                    setAiDifficulty('medium', false);
                }, 100);
            } else {
                if (typeof setAiMode === 'function') {
                    setAiMode(true);
                }
                setAiDifficulty('medium', false);
            }
        } else {
            setAiDifficulty('medium', false);
        }
    });

    if (aiHardBtn) aiHardBtn.addEventListener('click', function() {
        // Сразу обновляем визуально кнопку
        const difficultyButtons = document.querySelectorAll('.mode-btn[data-difficulty]');
        difficultyButtons.forEach(btn => {
            if (btn.dataset.difficulty === 'hard') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Устанавливаем режим бота, если еще не установлен
        if (!state.aiOpponent || state.gameModeType !== 'bot') {
            if (typeof setGameModeType === 'function') {
                setGameModeType('bot');
                setTimeout(() => {
                    setAiDifficulty('hard', false);
                }, 100);
            } else {
                if (typeof setAiMode === 'function') {
                    setAiMode(true);
                }
                setAiDifficulty('hard', false);
            }
        } else {
            setAiDifficulty('hard', false);
        }
    });
    
    // Модифицируем кнопку завершения хода для работы с ИИ
    const endTurnBtn = document.getElementById('btn-end');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', function() {
            if (state.aiOpponent && state.currentPlayer === 1) {
                forceEndAiTurn();
            } else {
                if (typeof endTurn === 'function') {
                    endTurn();
                }
            }
        });
    }
    
    // Патчим функцию endTurn в основном файле для корректной работы
    if (typeof endTurn === 'function') {
        const originalEndTurn = endTurn;
        window.endTurn = function() {
            // Сбрасываем флаги ИИ при любом завершении хода
            state.aiThinking = false;
            aiActionInProgress = false;
            aiTurnLock = false;
            aiIsMakingMove = false;
            
            // Включаем кнопку завершения хода
            enableEndTurnButton();
            
            if (aiTurnTimeout) {
                clearTimeout(aiTurnTimeout);
                aiTurnTimeout = null;
            }
            
            // Если это был ход ИИ, логируем
            if (state.aiOpponent && state.currentPlayer === 1) {
                logAi('=== КОНЕЦ ХОДА ИИ (вызван endTurn) ===', 'phase');
                aiEndTurn();
            } else {
                // Если это ход игрока, вызываем оригинальную функцию
                if (originalEndTurn) {
                    originalEndTurn();
                }
            }
        };
    }
    
    // Патчим rollDice для автоматического продолжения хода ИИ
    if (typeof rollDice === 'function') {
        const originalRollDice = rollDice;
        window.rollDice = function() {
            logAi('Вызов rollDice()', 'roll');
            
            // Сохраняем, был ли это ход ИИ
            const wasAiTurn = state.aiOpponent && state.currentPlayer === 1;
            
            if (originalRollDice) {
                originalRollDice();
            }
            
            // Если это был ход ИИ, планируем продолжение через время анимации
            if (wasAiTurn) {
                logAi('Бросок кубика ИИ завершен, ждем перехода в action phase', 'debug');
            }
        };
    }
    
    // Патчим функцию смены игрока
    if (typeof switchPlayer === 'function') {
        const originalSwitchPlayer = switchPlayer;
        window.switchPlayer = function() {
            const oldPlayer = state.currentPlayer;
            
            if (originalSwitchPlayer) {
                originalSwitchPlayer();
            }
            
            // Если теперь ход ИИ, запускаем его ход
            if (state.aiOpponent && state.currentPlayer === 1 && oldPlayer === 0) {
                logAi('Автоматический запуск хода ИИ после смены игрока', 'phase');
                setTimeout(() => {
                    startAiTurn();
                }, 1000);
            }
        };
    }
    
    // Также перехватываем клик по кубику для ИИ
    const diceElement = document.getElementById('dice');
    if (diceElement) {
        const originalOnClick = diceElement.onclick;
        diceElement.onclick = function() {
            // Если сейчас ход ИИ, блокируем ручной бросок
            if (state.aiOpponent && state.currentPlayer === 1 && aiIsMakingMove) {
                logAi('Игрок пытается бросить кубик во время хода ИИ - блокируем', 'warning');
                return;
            }
            
            // Иначе вызываем оригинальный обработчик
            if (originalOnClick) {
                originalOnClick.call(this);
            } else if (typeof rollDice === 'function') {
                rollDice();
            }
        };
    }
    
    // Глобальный обработчик ошибок для ИИ
    window.addEventListener('error', function(e) {
        if (state.aiOpponent && state.currentPlayer === 1) {
            logAi(`Глобальная ошибка: ${e.message}`, 'error');
            emergencyEndAiTurn();
        }
    });
    
    logAi('Модуль ИИ инициализирован', 'success');
    logAi('Кнопка "Тест бота" добавлена в правом верхнем углу', 'info');
});