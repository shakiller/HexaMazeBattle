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
    
    const neighbors = getNeighbors(row, col);
    const edges = rotateEdges(TILE_TYPES[tileType], rotation);
    
    let connections = 0;
    for (const neighbor of neighbors) {
        const nCell = state.board[neighbor.row][neighbor.col];
        if (!nCell.isEmpty && nCell.tileType !== null && nCell.tileType !== undefined) {
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
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (state.board[row][col].isEmpty) {
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
        if (cell.isEmpty) {
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
        if (!cell.isEmpty && cell.tileType !== null) {
            // Нельзя заменять тайлы с игроками
            const hasPlayer = state.players.some(p => p.row === neighbor.row && p.col === neighbor.col) ||
                             state.finishPos.some(f => f.row === neighbor.row && f.col === neighbor.col);
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
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = state.board[row][col];
            if (!cell.isEmpty && cell.tileType !== null) {
                // Нельзя заменять тайлы с игроками или финишами
                const hasPlayer = state.players.some(p => p.row === row && p.col === col) ||
                                 state.finishPos.some(f => f.row === row && f.col === col);
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
            if (currentCell.isEmpty || neighborCell.isEmpty) continue;
            
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

// Функция для нахождения пути A* к цели
function findPathToTarget(startRow, startCol, targetRow, targetCol) {
    logAi(`Поиск пути от (${startRow},${startCol}) к (${targetRow},${targetCol})`, 'path');
    
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = `${startRow},${startCol}`;
    const targetKey = `${targetRow},${targetCol}`;
    
    // Функция для получения ключа клетки
    function getKey(row, col) {
        return `${row},${col}`;
    }
    
    // Функция эвристики (манхэттенское расстояние)
    function heuristic(row1, col1, row2, col2) {
        return Math.abs(row1 - row2) + Math.abs(col1 - col2);
    }
    
    // Инициализация
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startRow, startCol, targetRow, targetCol));
    openSet.push({row: startRow, col: startCol, fScore: fScore.get(startKey)});
    
    while (openSet.length > 0) {
        // Находим узел с наименьшим fScore
        openSet.sort((a, b) => a.fScore - b.fScore);
        const current = openSet.shift();
        const currentKey = getKey(current.row, current.col);
        
        // Если достигли цели
        if (current.row === targetRow && current.col === targetCol) {
            // Восстанавливаем путь
            const path = [];
            let node = current;
            while (node) {
                path.unshift({row: node.row, col: node.col});
                const nodeKey = getKey(node.row, node.col);
                node = cameFrom.get(nodeKey);
            }
            logAi(`Путь найден! Длина: ${path.length}`, 'success');
            return path;
        }
        
        closedSet.add(currentKey);
        
        // Получаем соседей
        const neighbors = getNeighbors(current.row, current.col);
        
        for (const neighbor of neighbors) {
            const neighborKey = getKey(neighbor.row, neighbor.col);
            
            // Пропускаем уже обработанные
            if (closedSet.has(neighborKey)) continue;
            
            // Проверяем, можно ли пройти через эту клетку
            const cell = state.board[neighbor.row][neighbor.col];
            if (!cell.isEmpty && cell.tileType !== null) {
                // Проверяем соединение
                const currentCell = state.board[current.row][current.col];
                if (currentCell.isEmpty || currentCell.tileType === null) continue;
                
                const currentEdges = rotateEdges(TILE_TYPES[currentCell.tileType], currentCell.rotation);
                const neighborEdges = rotateEdges(TILE_TYPES[cell.tileType], cell.rotation);
                
                const myEdge = neighbor.edge;
                const theirEdge = (myEdge + 3) % 6;
                
                if (!currentEdges.includes(myEdge) || !neighborEdges.includes(theirEdge)) {
                    continue; // Нет соединения
                }
            } else {
                continue; // Пустая клетка
            }
            
            // Вычисляем gScore
            const tentativeGScore = gScore.get(currentKey) + 1;
            
            if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + heuristic(neighbor.row, neighbor.col, targetRow, targetCol));
                
                // Добавляем в openSet если еще нет
                if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
                    openSet.push({
                        row: neighbor.row, 
                        col: neighbor.col, 
                        fScore: fScore.get(neighborKey)
                    });
                }
            }
        }
    }
    
    logAi('Путь не найден', 'warning');
    return null;
}

// Функция для нахождения ближайшей пустой клетки на пути к цели
function findBestEmptyCellOnPath(aiRow, aiCol, targetRow, targetCol) {
    logAi(`Поиск лучшей пустой клетки на пути к цели`, 'path');
    
    const allEmpty = getAllEmpty();
    if (allEmpty.length === 0) return null;
    
    let bestCell = null;
    let bestScore = -Infinity;
    
    for (const cell of allEmpty) {
        // Оцениваем клетку по нескольким критериям
        let score = 0;
        
        // 1. Близость к цели (чем ближе, тем лучше)
        const distToTarget = Math.abs(cell.row - targetRow) + Math.abs(cell.col - targetCol);
        score += (50 - distToTarget) * 2;
        
        // 2. Близость к текущей позиции ИИ (не слишком далеко)
        const distToAi = Math.abs(cell.row - aiRow) + Math.abs(cell.col - aiCol);
        if (distToAi <= 3) {
            score += (10 - distToAi) * 3;
        }
        
        // 3. Находится ли клетка на прямой линии к цели
        const dxToTarget = targetCol - aiCol;
        const dyToTarget = targetRow - aiRow;
        const dxToCell = cell.col - aiCol;
        const dyToCell = cell.row - aiRow;
        
        // Проверяем, находится ли клетка в направлении к цели
        const dotProduct = dxToTarget * dxToCell + dyToTarget * dyToCell;
        if (dotProduct > 0) {
            score += 20; // Клетка в правильном направлении
        }
        
        // 4. Количество соседей (чем больше, тем лучше для соединений)
        const neighbors = getNeighbors(cell.row, cell.col);
        const filledNeighbors = neighbors.filter(n => {
            const nCell = state.board[n.row][n.col];
            return !nCell.isEmpty && nCell.tileType !== null;
        }).length;
        score += filledNeighbors * 10;
        
        if (score > bestScore) {
            bestScore = score;
            bestCell = cell;
        }
    }
    
    if (bestCell) {
        logAi(`Лучшая пустая клетка: (${bestCell.row},${bestCell.col}) с оценкой ${bestScore}`, 'path');
    }
    
    return bestCell;
}

// Функция для нахождения лучшего места для размещения тайла
function findBestTilePlacement(aiRow, aiCol, targetRow, targetCol, tileType) {
    logAi(`Поиск лучшего места для тайла типа ${tileType}`, 'strategy');
    
    const allEmpty = getAllEmpty();
    if (allEmpty.length === 0) return null;
    
    let bestPlacement = null;
    let bestScore = -Infinity;
    
    for (const cell of allEmpty) {
        // Для каждого возможного поворота
        for (let rotation = 0; rotation < 6; rotation++) {
            let score = 0;
            
            // 1. Направление к цели
            const directionScore = evaluateTileDirection(cell.row, cell.col, rotation, tileType, targetRow, targetCol);
            score += directionScore * 15;
            
            // 2. Соединения с соседями
            const connectionScore = countTileConnections(cell.row, cell.col, tileType, rotation);
            score += connectionScore * 10;
            
            // 3. Близость к цели
            const distToTarget = Math.abs(cell.row - targetRow) + Math.abs(cell.col - targetCol);
            score += (30 - distToTarget) * 2;
            
            // 4. Близость к текущей позиции ИИ (для возможности дойти)
            const distToAi = Math.abs(cell.row - aiRow) + Math.abs(cell.col - aiCol);
            if (distToAi <= 4) {
                score += (8 - distToAi) * 2;
            }
            
            // 5. Создает ли путь к цели?
            if (wouldCreatePathToTarget(cell.row, cell.col, tileType, rotation, aiRow, aiCol, targetRow, targetCol)) {
                score += 50;
                logAi(`Тайл в (${cell.row},${cell.col}) с поворотом ${rotation} создает путь к цели!`, 'strategy');
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestPlacement = {
                    row: cell.row,
                    col: cell.col,
                    rotation: rotation,
                    score: score,
                    tileType: tileType
                };
            }
        }
    }
    
    if (bestPlacement) {
        logAi(`Лучшее размещение: (${bestPlacement.row},${bestPlacement.col}) поворот ${bestPlacement.rotation} оценка ${bestPlacement.score}`, 'strategy');
    }
    
    return bestPlacement;
}

// Функция для оценки направления тайла к цели
function evaluateTileDirection(row, col, rotation, tileType, targetRow, targetCol) {
    if (!tileType && tileType !== 0) return 0;
    
    const edges = rotateEdges(TILE_TYPES[tileType], rotation);
    
    // Вычисляем направление к цели
    const dx = targetCol - col;
    const dy = targetRow - row;
    
    let desiredEdges = [];
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) desiredEdges.push(1, 2); // Право
        else desiredEdges.push(4, 5); // Лево
    } else {
        if (dy > 0) desiredEdges.push(2, 3); // Низ
        else desiredEdges.push(5, 0); // Верх
    }
    
    // Считаем совпадения
    let matches = 0;
    for (const edge of desiredEdges) {
        if (edges.includes(edge)) {
            matches++;
        }
    }
    
    return matches;
}

// Функция для проверки, создаст ли тайл путь к цели
function wouldCreatePathToTarget(row, col, tileType, rotation, fromRow, fromCol, targetRow, targetCol) {
    // Проверяем валидность тайла
    if (tileType === null || tileType === undefined) return false;
    
    // Временно размещаем тайл
    const originalCell = { ...state.board[row][col] };
    state.board[row][col] = {
        ...state.board[row][col],
        tileType: tileType,
        rotation: rotation,
        isEmpty: false
    };
    
    // Проверяем, есть ли путь от текущей позиции ИИ
    let hasPath = false;
    try {
        const path = findPathToTarget(fromRow, fromCol, targetRow, targetCol);
        hasPath = path !== null && path.length > 0;
    } catch (error) {
        logAi(`Ошибка при проверке пути: ${error.message}`, 'error');
        hasPath = false;
    }
    
    // Восстанавливаем оригинальное состояние
    state.board[row][col] = originalCell;
    
    return hasPath;
}

// Функция для нахождения лучшего хода (движения)
function findBestMove(aiPlayer, targetRow, targetCol) {
    const validMoves = getValidMoves(aiPlayer);
    if (!validMoves || validMoves.length === 0) return null;
    
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const move of validMoves) {
        let score = 0;
        
        // 1. Близость к цели (самый важный фактор)
        const distToTarget = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);
        score += (50 - distToTarget) * 3;
        
        // 2. Приближает ли к цели?
        const currentDist = Math.abs(aiPlayer.row - targetRow) + Math.abs(aiPlayer.col - targetCol);
        const newDist = distToTarget;
        if (newDist < currentDist) {
            score += 30; // Приближает к цели
        } else if (newDist > currentDist) {
            score -= 20; // Удаляет от цели
        }
        
        // 3. Количество возможных ходов от новой позиции
        const futureMoves = getValidMoves({row: move.row, col: move.col});
        score += futureMoves.length * 5;
        
        // 4. Находится ли на пути к другим важным клеткам?
        const allEmpty = getAllEmpty();
        let closestEmptyDist = Infinity;
        for (const empty of allEmpty) {
            const dist = Math.abs(move.row - empty.row) + Math.abs(move.col - empty.col);
            if (dist < closestEmptyDist) {
                closestEmptyDist = dist;
            }
        }
        score += (10 - Math.min(closestEmptyDist, 10)) * 2;
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    if (bestMove) {
        logAi(`Лучший ход: (${bestMove.row},${bestMove.col}) оценка ${bestScore}`, 'strategy');
    }
    
    return bestMove;
}

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И УПРАВЛЕНИЕ ХОДОМ ИИ ===

// Глобальные переменные для управления ходом ИИ
let aiTurnTimeout = null;
let aiActionInProgress = false;
let aiTurnLock = false;
let aiIsMakingMove = false;

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

// Функция для хода ИИ
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
        
        // Бросаем кубик немедленно
        aiTurnTimeout = setTimeout(() => {
            logAi('Вызываем rollDice()', 'roll');
            
            if (typeof rollDice === 'function') {
                rollDice();
                
                // Через секунду проверяем результат и продолжаем
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
                }, 1200);
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

// Основная функция принятия решений ИИ
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
    
    // Проверяем, можем ли мы сразу дойти до финиша
    if (state.points >= COST.move) {
        const pathToFinish = findPathToTarget(aiPlayer.row, aiPlayer.col, finish.row, finish.col);
        if (pathToFinish && pathToFinish.length - 1 <= state.points / COST.move) {
            logAi(`🎯 Найден путь к финишу длиной ${pathToFinish.length - 1} ходов!`, 'strategy');
            // Пытаемся пойти по этому пути
            const nextStep = pathToFinish[1]; // Первый шаг после текущей позиции
            if (nextStep) {
                // Проверяем, можем ли мы сделать этот шаг
                const validMoves = getValidMoves(aiPlayer);
                const canMove = validMoves.some(move => move.row === nextStep.row && move.col === nextStep.col);
                
                if (canMove) {
                    logAi(`Пытаемся сделать шаг к финишу: (${nextStep.row},${nextStep.col})`, 'strategy');
                    // Выполняем движение к финишу
                    aiPlayer.row = nextStep.row;
                    aiPlayer.col = nextStep.col;
                    state.points -= COST.move;
                    
                    logAi(`Шаг к финишу выполнен! Осталось очков: ${state.points}`, 'success');
                    updateStatus(`🤖 ИИ движется к финишу!`);
                    
                    if (typeof renderBoard === 'function') renderBoard();
                    if (typeof updateUI === 'function') updateUI();
                    
                    // Проверяем победу
                    if (typeof checkWin === 'function' && checkWin(aiPlayer, state.board[aiPlayer.row][aiPlayer.col])) {
                        logAi('🏆 ИИ ДОСТИГ ФИНИША! ПОБЕДА!', 'success');
                        setTimeout(() => {
                            if (typeof showWinModal === 'function') showWinModal();
                        }, 1000);
                        return;
                    }
                    
                    // Продолжаем ход
                    setTimeout(() => {
                        state.aiThinking = false;
                        aiActionInProgress = false;
                        aiTurnLock = false;
                        aiMakeDecision();
                    }, 1000);
                    return;
                }
            }
        }
    }
    
    // Проверяем ВСЕ возможные действия с интеллектуальной оценкой
    const actions = [];
    
    // 1. Движение с интеллектуальным выбором
    if (state.points >= COST.move) {
        const bestMove = findBestMove(aiPlayer, finish.row, finish.col);
        if (bestMove) {
            actions.push({
                type: 'move',
                cost: COST.move,
                possible: true,
                target: bestMove,
                priority: 100 // Высокий приоритет для движения к цели
            });
        }
    }
    
    // 2. Размещение рядом с интеллектуальным выбором
    if (state.points >= COST.placeAdjacent) {
        const bestPlacement = findBestTilePlacement(aiPlayer.row, aiPlayer.col, finish.row, finish.col, state.nextTileType);
        if (bestPlacement) {
            // Проверяем, является ли клетка соседней
            const adjacentEmpty = getAdjacentEmpty(aiPlayer);
            const isAdjacent = adjacentEmpty.some(cell => cell.row === bestPlacement.row && cell.col === bestPlacement.col);
            
            if (isAdjacent) {
                actions.push({
                    type: 'placeAdjacent',
                    cost: COST.placeAdjacent,
                    possible: true,
                    placement: bestPlacement,
                    priority: 90 // Высокий приоритет для строительства пути
                });
            }
        }
    }
    
    // 3. Размещение где угодно с интеллектуальным выбором
    if (state.points >= COST.placeAnywhere) {
        const bestPlacement = findBestTilePlacement(aiPlayer.row, aiPlayer.col, finish.row, finish.col, state.nextTileType);
        if (bestPlacement) {
            actions.push({
                type: 'placeAnywhere',
                cost: COST.placeAnywhere,
                possible: true,
                placement: bestPlacement,
                priority: 80 // Средний приоритет
            });
        }
    }
    
    // 4. Замена рядом с улучшением пути
    if (state.points >= COST.replaceAdjacent) {
        const adjacentReplaceable = getAdjacentReplaceable();
        if (adjacentReplaceable.length > 0) {
            // Ищем тайл, который можно улучшить для создания пути
            let bestReplacement = null;
            let bestScore = -Infinity;
            
            for (const cell of adjacentReplaceable) {
                const currentRotation = state.board[cell.row][cell.col].rotation;
                const newRotation = getRotationTowardsTarget(cell.row, cell.col, state.nextTileType, finish.row, finish.col);
                
                // Оцениваем улучшение
                const currentEdges = rotateEdges(TILE_TYPES[state.board[cell.row][cell.col].tileType], currentRotation);
                const newEdges = rotateEdges(TILE_TYPES[state.nextTileType], newRotation);
                
                // Считаем, сколько новых направлений к цели добавляет замена
                const direction = evaluateDirectionToTarget(cell.row, cell.col, finish.row, finish.col);
                const improvesDirection = newEdges.includes(direction) && !currentEdges.includes(direction);
                
                if (improvesDirection) {
                    const score = 50; // Высокий балл за улучшение направления
                    if (score > bestScore) {
                        bestScore = score;
                        bestReplacement = {cell: cell, rotation: newRotation};
                    }
                }
            }
            
            if (bestReplacement) {
                actions.push({
                    type: 'replaceAdjacent',
                    cost: COST.replaceAdjacent,
                    possible: true,
                    target: bestReplacement.cell,
                    rotation: bestReplacement.rotation,
                    priority: 70
                });
            }
        }
    }
    
    // 5. Замена любого тайла для улучшения пути
    if (state.points >= COST.replace) {
        const replaceable = getReplaceable();
        if (replaceable.length > 0) {
            // Ищем самый бесполезный тайл (без соединений)
            let worstTile = null;
            let minConnections = Infinity;
            
            for (const cell of replaceable) {
                const connections = countTileConnections(cell.row, cell.col, 
                    state.board[cell.row][cell.col].tileType, 
                    state.board[cell.row][cell.col].rotation);
                
                if (connections < minConnections) {
                    minConnections = connections;
                    worstTile = cell;
                }
            }
            
            if (worstTile && minConnections === 0) {
                // Заменяем бесполезный тайл на что-то полезное
                const newRotation = getRotationTowardsTarget(worstTile.row, worstTile.col, state.nextTileType, finish.row, finish.col);
                actions.push({
                    type: 'replace',
                    cost: COST.replace,
                    possible: true,
                    target: worstTile,
                    rotation: newRotation,
                    priority: 60
                });
            }
        }
    }
    
    // Сортируем действия по приоритету
    actions.sort((a, b) => b.priority - a.priority);
    
    logAi(`Доступных интеллектуальных действий: ${actions.length}`, 
          actions.length > 0 ? 'success' : 'warning');
    
    if (actions.length === 0) {
        logAi('❌ Нет интеллектуальных действий, пробуем базовые', 'warning');
        // Пробуем базовые действия
        tryBasicActions(aiPlayer, finish);
        return;
    }
    
    // Выполняем лучшее действие
    const bestAction = actions[0];
    logAi(`Выбрано лучшее действие: ${bestAction.type} (приоритет ${bestAction.priority})`, 'strategy');
    
    executeSmartAiAction(bestAction, aiPlayer, finish);
}

// Выполнение интеллектуального действия ИИ
function executeSmartAiAction(action, aiPlayer, finish) {
    logAi(`▶️ Выполнение интеллектуального действия: ${action.type}`, 'action');
    
    switch (action.type) {
        case 'move':
            return aiPerformSmartMove(aiPlayer, finish, action);
        case 'placeAdjacent':
            return aiPerformSmartPlaceAdjacent(aiPlayer, finish, action);
        case 'placeAnywhere':
            return aiPerformSmartPlaceAnywhere(aiPlayer, finish, action);
        case 'replaceAdjacent':
            return aiPerformSmartReplaceAdjacent(aiPlayer, action);
        case 'replace':
            return aiPerformSmartReplace(aiPlayer, action);
        default:
            logAi(`❌ Неизвестное действие: ${action.type}`, 'error');
            return tryBasicActions(aiPlayer, finish);
    }
}

// Интеллектуальное движение
function aiPerformSmartMove(aiPlayer, finish, action) {
    const target = action.target;
    
    logAi(`Умный ход: (${aiPlayer.row},${aiPlayer.col}) → (${target.row},${target.col})`, 'move');
    
    // Выполняем ход
    const oldRow = aiPlayer.row;
    const oldCol = aiPlayer.col;
    const oldPoints = state.points;
    
    aiPlayer.row = target.row;
    aiPlayer.col = target.col;
    state.points -= COST.move;
    
    logAi(`Перемещение выполнено! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ движется к цели!`);
    
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

// Интеллектуальное размещение рядом
function aiPerformSmartPlaceAdjacent(aiPlayer, finish, action) {
    const placement = action.placement;
    
    logAi(`Умное размещение рядом: (${placement.row},${placement.col}), поворот ${placement.rotation}`, 'place');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'placeAdjacent',
        row: placement.row,
        col: placement.col,
        previousCellState: { ...state.board[placement.row][placement.col] },
        pointsUsed: COST.placeAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Размещаем тайл
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[placement.row][placement.col] = {
        ...state.board[placement.row][placement.col],
        tileType: state.nextTileType,
        rotation: placement.rotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен для создания пути! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ строит путь к цели!`);
    
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

// Интеллектуальное размещение где угодно
function aiPerformSmartPlaceAnywhere(aiPlayer, finish, action) {
    const placement = action.placement;
    
    logAi(`Умное размещение: (${placement.row},${placement.col}), поворот ${placement.rotation}`, 'place');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: placement.row,
        col: placement.col,
        previousCellState: { ...state.board[placement.row][placement.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Размещаем тайл
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[placement.row][placement.col] = {
        ...state.board[placement.row][placement.col],
        tileType: state.nextTileType,
        rotation: placement.rotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл размещен стратегически! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ строит стратегический путь!`);
    
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

// Интеллектуальная замена рядом
function aiPerformSmartReplaceAdjacent(aiPlayer, action) {
    const target = action.target;
    const rotation = action.rotation;
    
    logAi(`Умная замена рядом: (${target.row},${target.col}), поворот ${rotation}`, 'replace');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'replace',
        row: target.row,
        col: target.col,
        previousCellState: { ...state.board[target.row][target.col] },
        pointsUsed: COST.replaceAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Заменяем тайл
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[target.row][target.col].tileType = state.nextTileType;
    state.board[target.row][target.col].rotation = rotation;
    
    state.points -= COST.replaceAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Тайл заменен для улучшения пути! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ улучшает путь!`);
    
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

// Интеллектуальная замена любого
function aiPerformSmartReplace(aiPlayer, action) {
    const target = action.target;
    const rotation = action.rotation;
    
    logAi(`Умная замена: (${target.row},${target.col}), поворот ${rotation}`, 'replace');
    
    // Сохраняем состояние
    state.lastTilePlacement = {
        action: 'replace',
        row: target.row,
        col: target.col,
        previousCellState: { ...state.board[target.row][target.col] },
        pointsUsed: COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    // Заменяем тайл
    const oldPoints = state.points;
    const oldTileType = state.nextTileType;
    
    state.board[target.row][target.col].tileType = state.nextTileType;
    state.board[target.row][target.col].rotation = rotation;
    
    state.points -= COST.replace;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Бесполезный тайл заменен! Очки: ${oldPoints} → ${state.points}`, 'success');
    updateStatus(`🤖 ИИ убирает препятствие!`);
    
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

// Резервная функция для базовых действий
function tryBasicActions(aiPlayer, finish) {
    logAi('Пробуем базовые действия как запасной вариант', 'warning');
    
    // Базовые проверки как раньше
    const actions = [];
    
    if (state.points >= COST.move) {
        const canMove = canMoveAnywhere(aiPlayer);
        const validMoves = canMove ? getValidMoves(aiPlayer) : [];
        actions.push({
            type: 'move',
            cost: COST.move,
            possible: canMove && validMoves.length > 0,
            moveList: validMoves
        });
    }
    
    if (state.points >= COST.placeAdjacent) {
        const adjacentEmpty = getAdjacentEmpty(aiPlayer);
        actions.push({
            type: 'placeAdjacent',
            cost: COST.placeAdjacent,
            possible: adjacentEmpty.length > 0,
            cellList: adjacentEmpty
        });
    }
    
    if (state.points >= COST.placeAnywhere) {
        const allEmpty = getAllEmpty();
        actions.push({
            type: 'placeAnywhere',
            cost: COST.placeAnywhere,
            possible: allEmpty.length > 0,
            cellList: allEmpty
        });
    }
    
    const possibleActions = actions.filter(a => a.possible);
    
    if (possibleActions.length === 0) {
        logAi('❌ Нет доступных действий даже базовых, завершаем ход', 'error');
        completeAiTurn('🤖 ИИ: нет доступных действий');
        return false;
    }
    
    // Используем старую стратегию
    let actionTaken = false;
    
    if (state.aiDifficulty === 'easy') {
        actionTaken = aiEasyStrategy(possibleActions, aiPlayer, finish);
    } else if (state.aiDifficulty === 'medium') {
        actionTaken = aiMediumStrategy(possibleActions, aiPlayer, finish);
    } else {
        actionTaken = aiHardStrategy(possibleActions, aiPlayer, finish);
    }
    
    if (!actionTaken) {
        completeAiTurn('🤖 ИИ завершает ход.');
    }
    
    return actionTaken;
}

// Легкая стратегия ИИ (базовая)
function aiEasyStrategy(possibleActions, aiPlayer, finish) {
    possibleActions.sort((a, b) => a.cost - b.cost);
    const chosenAction = possibleActions[0];
    return executeAiAction(chosenAction.type, aiPlayer, finish, chosenAction);
}

// Средняя стратегия ИИ (базовая)
function aiMediumStrategy(possibleActions, aiPlayer, finish) {
    const actionPriority = {'move': 5, 'placeAdjacent': 4, 'placeAnywhere': 3, 'replaceAdjacent': 2, 'replace': 1};
    possibleActions.sort((a, b) => {
        const priorityDiff = actionPriority[b.type] - actionPriority[a.type];
        if (priorityDiff !== 0) return priorityDiff;
        return a.cost - b.cost;
    });
    const bestAction = possibleActions[0];
    return executeAiAction(bestAction.type, aiPlayer, finish, bestAction);
}

// Сложная стратегия ИИ (базовая)
function aiHardStrategy(possibleActions, aiPlayer, finish) {
    let bestAction = possibleActions[0];
    let bestScore = -Infinity;
    
    for (const action of possibleActions) {
        let score = 0;
        const priority = {'move': 5, 'placeAdjacent': 4, 'placeAnywhere': 3, 'replaceAdjacent': 2, 'replace': 1}[action.type] || 0;
        score += priority * 10;
        score += (10 - action.cost) * 2;
        
        if (score > bestScore) {
            bestScore = score;
            bestAction = action;
        }
    }
    
    return executeAiAction(bestAction.type, aiPlayer, finish, bestAction);
}

// Выполнение базового действия
function executeAiAction(actionType, aiPlayer, finish, actionInfo) {
    switch (actionType) {
        case 'move':
            return aiPerformBasicMove(aiPlayer, finish, actionInfo);
        case 'placeAdjacent':
            return aiPerformBasicPlaceAdjacent(aiPlayer, finish, actionInfo);
        case 'placeAnywhere':
            return aiPerformBasicPlaceAnywhere(aiPlayer, finish, actionInfo);
        case 'replaceAdjacent':
            return aiPerformBasicReplaceAdjacent(aiPlayer, actionInfo);
        case 'replace':
            return aiPerformBasicReplace(aiPlayer, actionInfo);
        default:
            return false;
    }
}

// Базовые функции выполнения действий
function aiPerformBasicMove(aiPlayer, finish, actionInfo) {
    const validMoves = actionInfo.moveList || getValidMoves(aiPlayer);
    if (!validMoves || validMoves.length === 0) return false;
    
    let bestMove = validMoves[0];
    let bestDist = Math.abs(bestMove.row - finish.row) + Math.abs(bestMove.col - finish.col);
    
    for (const move of validMoves) {
        const dist = Math.abs(move.row - finish.row) + Math.abs(move.col - finish.col);
        if (dist < bestDist) {
            bestDist = dist;
            bestMove = move;
        }
    }
    
    const oldPoints = state.points;
    aiPlayer.row = bestMove.row;
    aiPlayer.col = bestMove.col;
    state.points -= COST.move;
    
    logAi(`Базовое перемещение: (${aiPlayer.row},${aiPlayer.col}), очки: ${oldPoints} → ${state.points}`, 'move');
    updateStatus(`🤖 ИИ переместился`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof updateUI === 'function') updateUI();
    
    if (typeof checkWin === 'function' && checkWin(aiPlayer, state.board[aiPlayer.row][aiPlayer.col])) {
        logAi('🏆 ИИ ДОСТИГ ФИНИША!', 'success');
        setTimeout(() => {
            if (typeof showWinModal === 'function') showWinModal();
        }, 1000);
        return true;
    }
    
    if (state.points > 0) {
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

function aiPerformBasicPlaceAdjacent(aiPlayer, finish, actionInfo) {
    const adjacentEmpty = actionInfo.cellList || getAdjacentEmpty(aiPlayer);
    if (!adjacentEmpty || adjacentEmpty.length === 0) return false;
    
    const targetCell = adjacentEmpty[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    state.lastTilePlacement = {
        action: 'placeAdjacent',
        row: targetCell.row,
        col: targetCell.col,
        previousCellState: { ...state.board[targetCell.row][targetCell.col] },
        pointsUsed: COST.placeAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    const oldPoints = state.points;
    state.board[targetCell.row][targetCell.col] = {
        ...state.board[targetCell.row][targetCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Базовое размещение рядом`, 'place');
    updateStatus(`🤖 ИИ разместил тайл`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof renderNextTile === 'function') renderNextTile();
    if (typeof updateUI === 'function') updateUI();
    
    if (state.points > 0) {
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

function aiPerformBasicPlaceAnywhere(aiPlayer, finish, actionInfo) {
    const allEmpty = actionInfo.cellList || getAllEmpty();
    if (!allEmpty || allEmpty.length === 0) return false;
    
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
    
    state.lastTilePlacement = {
        action: 'placeAnywhere',
        row: bestCell.row,
        col: bestCell.col,
        previousCellState: { ...state.board[bestCell.row][bestCell.col] },
        pointsUsed: COST.placeAnywhere,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    const oldPoints = state.points;
    state.board[bestCell.row][bestCell.col] = {
        ...state.board[bestCell.row][bestCell.col],
        tileType: state.nextTileType,
        rotation: bestRotation,
        isEmpty: false
    };
    
    state.points -= COST.placeAnywhere;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Базовое размещение где угодно`, 'place');
    updateStatus(`🤖 ИИ разместил тайл`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof renderNextTile === 'function') renderNextTile();
    if (typeof updateUI === 'function') updateUI();
    
    if (state.points > 0) {
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

function aiPerformBasicReplaceAdjacent(aiPlayer, actionInfo) {
    const adjacentReplaceable = actionInfo.cellList || getAdjacentReplaceable();
    if (!adjacentReplaceable || adjacentReplaceable.length === 0) return false;
    
    const targetCell = adjacentReplaceable[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    state.lastTilePlacement = {
        action: 'replace',
        row: targetCell.row,
        col: targetCell.col,
        previousCellState: { ...state.board[targetCell.row][targetCell.col] },
        pointsUsed: COST.replaceAdjacent,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    const oldPoints = state.points;
    state.board[targetCell.row][targetCell.col].tileType = state.nextTileType;
    state.board[targetCell.row][targetCell.col].rotation = bestRotation;
    
    state.points -= COST.replaceAdjacent;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Базовая замена рядом`, 'replace');
    updateStatus(`🤖 ИИ заменил тайл`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof renderNextTile === 'function') renderNextTile();
    if (typeof updateUI === 'function') updateUI();
    
    if (state.points > 0) {
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

function aiPerformBasicReplace(aiPlayer, actionInfo) {
    const replaceable = actionInfo.cellList || getReplaceable();
    if (!replaceable || replaceable.length === 0) return false;
    
    const targetCell = replaceable[0];
    const bestRotation = getBestRotationForTile(targetCell.row, targetCell.col, state.nextTileType);
    
    state.lastTilePlacement = {
        action: 'replace',
        row: targetCell.row,
        col: targetCell.col,
        previousCellState: { ...state.board[targetCell.row][targetCell.col] },
        pointsUsed: COST.replace,
        nextTileTypeBefore: state.nextTileType,
        nextTileRotationBefore: state.nextTileRotation
    };
    
    const oldPoints = state.points;
    state.board[targetCell.row][targetCell.col].tileType = state.nextTileType;
    state.board[targetCell.row][targetCell.col].rotation = bestRotation;
    
    state.points -= COST.replace;
    state.nextTileType = Math.floor(Math.random() * TILE_TYPES.length);
    state.nextTileRotation = 0;
    
    logAi(`Базовая замена`, 'replace');
    updateStatus(`🤖 ИИ заменил тайл`);
    
    if (typeof renderBoard === 'function') renderBoard();
    if (typeof renderNextTile === 'function') renderNextTile();
    if (typeof updateUI === 'function') updateUI();
    
    if (state.points > 0) {
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

// Функция для установки режима игры с ИИ
function setAiMode(enable) {
    state.aiOpponent = enable;
    if (enable) {
        state.numPlayers = 2;
        document.querySelectorAll('.mode-btn[data-players]').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.players) === 2);
        });
        updateStatus('🤖 Режим против ИИ включен!');
        
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
    if (state.aiOpponent && state.currentPlayer === 1 && aiIsMakingMove) {
        logAi('Ход ИИ принудительно завершен игроком', 'warning');
        completeAiTurn('🤖 Ход ИИ принудительно завершен');
    }
}

// Инициализация ИИ
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем состояние ИИ
    state.aiThinking = false;
    state.aiStatus = '';
    aiTurnTimeout = null;
    aiActionInProgress = false;
    aiTurnLock = false;
    aiIsMakingMove = false;
    
    // Добавляем обработчики для кнопок ИИ
    const aiEasyBtn = document.getElementById('btn-ai-easy');
    const aiMediumBtn = document.getElementById('btn-ai-medium');
    const aiHardBtn = document.getElementById('btn-ai-hard');
    
    if (aiEasyBtn) aiEasyBtn.addEventListener('click', () => {
        setAiMode(true);
        setAiDifficulty('easy');
    });

    if (aiMediumBtn) aiMediumBtn.addEventListener('click', () => {
        setAiMode(true);
        setAiDifficulty('medium');
    });

    if (aiHardBtn) aiHardBtn.addEventListener('click', () => {
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
                // Дальнейшее продолжение будет в aiTurn после таймаута
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
    
    // Патчим restartGame чтобы ИИ начинал ход если нужно
    if (typeof restartGame === 'function') {
        const originalRestartGame = restartGame;
        window.restartGame = function() {
            if (originalRestartGame) {
                originalRestartGame();
            }
            
            // Если игра с ИИ и сейчас его ход, запускаем
            if (state.aiOpponent && state.currentPlayer === 1) {
                setTimeout(() => {
                    logAi('Запуск хода ИИ после перезапуска игры', 'phase');
                    startAiTurn();
                }, 1500);
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
});