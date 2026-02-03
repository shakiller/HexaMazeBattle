// Простой WebSocket сервер для онлайн игры
// Запуск: node server.js
// Или разверните на Replit/Glitch/Railway

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

const rooms = new Map(); // roomId -> Set of connections

wss.on('connection', (ws) => {
    console.log('Новое подключение');
    
    let roomId = null;
    let playerId = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Получено сообщение:', data.type);
            
            switch (data.type) {
                case 'createRoom':
                    roomId = data.roomId;
                    playerId = data.playerId || generateId();
                    
                    if (!rooms.has(roomId)) {
                        rooms.set(roomId, new Set());
                    }
                    rooms.get(roomId).add(ws);
                    
                    ws.send(JSON.stringify({
                        type: 'roomCreated',
                        roomId: roomId,
                        playerId: playerId,
                        playerNumber: 0
                    }));
                    
                    console.log(`Комната ${roomId} создана, игроков: ${rooms.get(roomId).size}`);
                    break;
                    
                case 'joinRoom':
                    roomId = data.roomId;
                    playerId = data.playerId || generateId();
                    
                    if (!rooms.has(roomId)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Комната не найдена'
                        }));
                        return;
                    }
                    
                    const room = rooms.get(roomId);
                    if (room.size >= 2) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Комната заполнена'
                        }));
                        return;
                    }
                    
                    room.add(ws);
                    const playerNumber = room.size - 1;
                    
                    ws.send(JSON.stringify({
                        type: 'roomJoined',
                        roomId: roomId,
                        playerId: playerId,
                        playerNumber: playerNumber
                    }));
                    
                    // Уведомляем всех в комнате о новом игроке
                    broadcastToRoom(roomId, {
                        type: 'playerJoined',
                        playerId: playerId,
                        playerNumber: playerNumber,
                        totalPlayers: room.size
                    }, ws);
                    
                    console.log(`Игрок присоединился к комнате ${roomId}, игроков: ${room.size}`);
                    break;
                    
                case 'gameState':
                case 'action':
                case 'turnEnd':
                case 'diceRoll':
                case 'gameWin':
                case 'requestState':
                    // Пересылаем сообщение всем в комнате кроме отправителя
                    if (roomId && rooms.has(roomId)) {
                        broadcastToRoom(roomId, {
                            ...data,
                            playerId: playerId
                        }, ws);
                    }
                    break;
            }
        } catch (err) {
            console.error('Ошибка обработки сообщения:', err);
        }
    });
    
    ws.on('close', () => {
        console.log('Подключение закрыто');
        if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.delete(ws);
            
            if (room.size === 0) {
                rooms.delete(roomId);
                console.log(`Комната ${roomId} удалена`);
            } else {
                // Уведомляем оставшихся игроков
                broadcastToRoom(roomId, {
                    type: 'playerLeft',
                    playerId: playerId
                });
                console.log(`Игрок покинул комнату ${roomId}, осталось: ${room.size}`);
            }
        }
    });
    
    ws.on('error', (err) => {
        console.error('Ошибка WebSocket:', err);
    });
});

function broadcastToRoom(roomId, message, excludeWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const data = JSON.stringify(message);
    room.forEach((ws) => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });
}

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

console.log('WebSocket сервер запущен на порту', process.env.PORT || 8080);
