// const socket = io('http://localhost:3000');
const socket = io('https://gameserver-g68k.onrender.com');
let playerId = null;
let gameId = null;

document.getElementById('playBtn').addEventListener('click', () => {
    document.getElementById('gameArea').style.display = 'flex';
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
    socket.emit('startGame', gameId);
    // document.getElementById('status').innerText = `Players: ${players.map(p => p.name).join(', ')}`;
});

// document.getElementById('startGame').addEventListener('click', () => {
//     socket.emit('startGame', gameId);
// });

socket.on('gameStarted', ({ cards, systemCard }) => {
    renderCards(cards);
    document.getElementById('status').innerText = "Game Started! Select a card.";
});

// Attach the event listener to the card container
document.querySelector('.cards').addEventListener('click', (event) => {
    
    // Check if the clicked element is a card button
    if (event.target && event.target.classList.contains('cardBtn')) {
        const button = event.target;
        
        // Remove 'selected' class from all buttons and add it to the clicked one
        document.querySelectorAll('.cardBtn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        // Get the data-card attribute and emit the selected card
        const selectedCard = button.getAttribute('data-card');
        socket.emit('selectCard', { gameId, playerId, card: JSON.parse(selectedCard) });
    }
});


function renderCards(cards) {
    const cardContainer = document.querySelector('.cards');
    
    // Check if the container exists before modifying it
    if (cardContainer) {
        cardContainer.innerHTML = ''; // Clear existing cards
        cards.forEach((card) => {
            const button = document.createElement('button');
            // button.classList.add('cardBtn');
            // button.dataset.card = JSON.stringify(card);
            button.innerHTML = `<img src="images/${card.value}_of_${card.suit}.svg" data-card=${JSON.stringify(card)} class="card-img cardBtn">`;
            cardContainer.appendChild(button);
        });
        // document.getElementById('roundResult').innerHTML = '';
    } else {
        console.error('Card container not found!');
    }
}

socket.on('roundResult', ({ systemCard, players, result, round }) => {
    const roundResultElement = document.getElementById('roundResult');

    roundResultElement.style.display = 'block';
    document.getElementById('roundResult').innerHTML = `System selected: <img src="images/${systemCard.value}_of_${systemCard.suit}.svg" class="card-img cardBtn">`;
    document.getElementById('scoreBoard').innerText = `${players[0].name}: ${players[0].score} | ${players[1].name}: ${players[1].score}`;
    document.getElementById('roundCount').innerText = `Round: ${round}/5`;
    document.getElementById('result').innerText = `Result: ${result}`;
    document.querySelectorAll('.cardBtn').forEach(btn => btn.classList.remove('selected'));
    renderCards(players[0].cards);
    setTimeout(() => {
        roundResultElement.style.display = 'none';
    }, 1500);
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
        location.reload();
    });
});
