const socket = io('http://localhost:3000');
let playerId = null;
let gameId = null;

document.getElementById('playBtn').addEventListener('click', () => {
    document.getElementById('gameArea').style.display = 'block';
});

document.getElementById('createGame').addEventListener('click', () => {
    const playerName = document.getElementById('playerName').value;
    document.getElementById('welcomeMessage').innerText = `Welcome: ${playerName}`;
    socket.emit('createGame', playerName);
});

socket.on('gameCreated', (id) => {
    alert(`Game Created! Share this Game ID: ${id}`);
    gameId = id;
    localStorage.setItem('gameId', gameId);
});

document.getElementById('joinGame').addEventListener('click', () => {
    gameId = document.getElementById('gameIdInput').value;
    const playerName = document.getElementById('playerName').value;
    document.getElementById('welcomeMessage').innerText = `Welcome: ${playerName}`;
    socket.emit('joinGame', { gameId, playerName });
});

socket.on('gameJoined', ({ players, id }) => {
    gameId = id;
    document.getElementById('gameBoard').style.display = 'block';
    document.getElementById('roundCount').style.display = 'block';
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('playBtn').style.display = 'none';
    document.getElementById('status').innerText = `Players: ${players.map(p => p.name).join(', ')}`;
    // document.getElementById('status').innerText = `Players: ${players.map(p => p.name).join(', ')}`;
});

// document.getElementById('startGame').addEventListener('click', () => {
//     socket.emit('startGame', gameId);
// });

socket.on('gameStarted', () => {
    document.getElementById('status').innerText = "Game Started! Select a card.";
});

document.querySelectorAll('.cardBtn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.cardBtn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        const selectedCard = button.getAttribute('data-card');
        socket.emit('selectCard', { gameId, playerId, card: parseInt(selectedCard) });
    });
});

socket.on('roundResult', ({ systemCard, players, result, round }) => {
    // alert(`System selected: ${systemCard}\n${result}`);
    document.getElementById('roundResult').innerText = `System selected: ${systemCard}\n${result}`;
    document.getElementById('scoreBoard').innerText = `${players[0].name}: ${players[0].score} | ${players[1].name}: ${players[1].score}`;
    document.getElementById('roundCount').innerText = `Round: ${round}`;
});

socket.on('gameOver', ({ winner }) => {
    const modal = document.getElementById("gameOverModal");
    const message = document.getElementById("gameOverMessage");
    const restartButton = document.getElementById("restartGame");
    const playerName = document.getElementById('playerName').value;
    const currentUser = playerId; // Assuming playerId stores the current player's ID
    console.log('winner', winner);
    console.log('playerName', playerName);
    let displayMessage = "";
    
    if (winner != '') {
        const winnerName = winner.split(" ")[0]; // Extract winner's name
        if (winner == playerName) {
            displayMessage = "🎉 Congratulations! You won the game! 🏆";
        } else {
            displayMessage = "😢 Oops! You lost the game. Better luck next time! 💔";
        }
    } else {
        displayMessage = "🤝 Match Draw! Well Played! 🎭";
    }

    // Set message in the modal
    message.innerHTML = displayMessage;

    // Show the modal
    modal.style.display = "block";

    // Restart game on button click
    restartButton.addEventListener("click", () => {
        location.reload();
    });

    // Close modal when clicking the 'X'
    document.querySelector(".close").addEventListener("click", () => {
        modal.style.display = "none";
    });
});
