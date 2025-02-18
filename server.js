const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, '/')));

// Initialize a deck of 52 cards
const suits = ['Hearts', 'Kite', 'Clubs', 'Spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'A'];
const deck = suits.flatMap(suit => values.map(value => ({ value, suit })));

// Function to shuffle the deck
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

const games = {};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('createGame', (playerName) => {
        const gameId = Math.floor(100000 + Math.random() * 900000).toString();
        games[gameId] = {
            players: [{ id: socket.id, name: playerName, score: 0 }],
            selectedCards: {},
            rounds: 1,
            deck: [...deck], 
        };
        socket.join(gameId);
        socket.emit('gameCreated', gameId);
    });

    socket.on('joinGame', ({ gameId, playerName }) => {
        if (games[gameId] && games[gameId].players.length < 2) {
            games[gameId].players.push({ id: socket.id, name: playerName, score: 0 });
            socket.join(gameId);
            io.to(gameId).emit('gameJoined', { players: games[gameId].players, id: gameId });
        } else {
            socket.emit('error', 'Invalid Game ID or Game Full');
        }
    });

    socket.on('startGame', (gameId) => {
        if (games[gameId] && games[gameId].players.length === 2) {
                shuffleDeck(); 
                const playerCards = [[], []];

                // Distribute 5 random cards to each player
                for (let i = 0; i < 5; i++) {
                    playerCards[0].push(games[gameId].deck.pop());
                    playerCards[1].push(games[gameId].deck.pop());
                }

                games[gameId].players[0].cards = playerCards[0];
                games[gameId].players[1].cards = playerCards[1];

                io.to(gameId).emit('gameStarted', {
                    cards: playerCards[0],
                    systemCard: '',
                });
            // io.to(gameId).emit('gameStarted');
        } else {
            socket.emit('error', 'Need 2 players to start the game');
        }
    });

    socket.on('selectCard', ({ gameId, playerId, card }) => {
        if (!games[gameId]) return;
        const game = games[gameId];
        
        // Store only one card per player
        game.selectedCards[socket.id] = card;

        if (Object.keys(game.selectedCards).length === 2) {
            setTimeout(() => {
            if(game.rounds <= 5){
                game.rounds++;
            }
            
            const players = game.players;
            const player1 = players[0];
            const player2 = players[1];
            const combinedPlayerCards = [...player1.cards];
            const systemCard = combinedPlayerCards[Math.floor(Math.random() * combinedPlayerCards.length)];
            let result = "Draw!";
            if (
                game.selectedCards[player1.id].value === systemCard.value &&
                game.selectedCards[player1.id].suit === systemCard.suit &&
                game.selectedCards[player2.id].value === systemCard.value &&
                game.selectedCards[player2.id].suit === systemCard.suit
            ) {
                // Both players selected the same card and it matches the system card
                player1.score += 1;
                player2.score += 1;
                result = `Both ${player1.name} and ${player2.name} win this round! 🎉`;
            } else if (
                game.selectedCards[player1.id].value === systemCard.value &&
                game.selectedCards[player1.id].suit === systemCard.suit
            ) {
                // Only player 1 selected the matching card
                player1.score += 1;
                result = `${player1.name} wins this round! 🏆`;
            } else if (
                game.selectedCards[player2.id].value === systemCard.value &&
                game.selectedCards[player2.id].suit === systemCard.suit
            ) {
                // Only player 2 selected the matching card
                player2.score += 1;
                result = `${player2.name} wins this round! 🏆`;
            } else {
                // No one matched the system card
                result = "It's a draw!";
            }
            

            io.to(gameId).emit('roundResult', { systemCard , players, result,round: game.rounds });

            game.selectedCards = {};

            // if (player1.score >= 3 || player2.score >= 3) {
            if(game.rounds >= 5) {     
                let winnerMessage = "Match Draw!";
                let winnerName = '';
                if (player1.score > player2.score) {
                    winnerMessage = `${player1.name} wins the game!`;
                    winnerName = player1.name;
                } else if (player2.score > player1.score) {
                    winnerMessage = `${player2.name} wins the game!`;
                    winnerName = player2.name;
                }
                // const winner = player1.score > player2.score ? player1.name : player2.name;
                io.to(gameId).emit('gameOver', {winner: winnerName });
                delete games[gameId];
            }
        }, 1000);
        }
    });

    socket.on('disconnect', () => {
        Object.keys(games).forEach(gameId => {
            games[gameId].players = games[gameId].players.filter(player => player.id !== socket.id);
            if (games[gameId].players.length === 0) delete games[gameId];
        });
        console.log(`User disconnected: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
