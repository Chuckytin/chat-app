let stompClient = null;
let currentUser = '';
let typingTimer = null;
let isTyping = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

/**
 * Actualiza el estado de conexión en la interfaz
 */
function setConnected(connected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const sendButton = document.getElementById('sendMessage');

    if (connected) {
        statusDot.classList.remove('status-disconnected');
        statusText.textContent = 'Conectado';
        sendButton.disabled = false;
        reconnectAttempts = 0;
    } else {
        statusDot.classList.add('status-disconnected');
        statusText.textContent = 'Desconectado';
        sendButton.disabled = true;
    }
}

/**
 * Establece conexión WebSocket con el servidor
 */
function connect() {
    const socket = new SockJS('/chat');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        setConnected(true);
        currentUser = document.getElementById('senderInput').value || 'Anónimo';

        // Guarda el nombre de usuario en localStorage
        localStorage.setItem('chatUsername', currentUser);

        // Suscribirse al topic de mensajes
        stompClient.subscribe('/topic/messages', function(message) {
            const messageData = JSON.parse(message.body);
            showMessage(messageData);
        });

        // Suscribirse al topic de typing
        stompClient.subscribe('/topic/typing', function(typing) {
            const typingData = JSON.parse(typing.body);
            showTyping(typingData);
        });

        // Suscribirse al topic de eventos de usuario
        stompClient.subscribe('/topic/userEvents', function(event) {
            const eventData = JSON.parse(event.body);
            handleUserEvent(eventData);
        });

        // Envia mensaje de unión al chat
        const joinMessage = {
            sender: currentUser,
            content: `${currentUser} se unió al chat`,
            type: 'join'
        };
        stompClient.send("/app/sendMessage", {}, JSON.stringify(joinMessage));

        // Registra evento de usuario unido
        const userEvent = {
            sender: currentUser,
            type: 'JOIN'
        };
        stompClient.send("/app/userJoin", {}, JSON.stringify(userEvent));

    }, function(error) {
        setConnected(false);
        console.error('Error de conexión:', error);

        // Intenta reconectar con límite de intentos
        if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(function() {
                reconnectAttempts++;
                console.log(`Intentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`);
                connect();
            }, 2000);
        }
    });
}

/**
 * Muestra un mensaje en la interfaz
 */
function showMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const emptyState = document.getElementById('emptyState');

    // Oculta estado vacío si hay mensajes
    if (emptyState) emptyState.style.display = 'none';

    const messageElement = document.createElement('div');

    // Mensajes del sistema (unión/desconexión)
    if (message.type === 'join' || message.type === 'leave') {
        messageElement.className = 'system-message';
        messageElement.innerHTML = `<small>${message.content}</small>`;
    } else {
        // Mensajes normales de chat
        messageElement.className = `message ${message.sender === currentUser ? 'message-sent' : 'message-received'}`;

        const now = new Date();
        const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        messageElement.innerHTML = `
            ${message.sender !== currentUser ? `<div class="message-sender">${message.sender}</div>` : ''}
            <div class="message-bubble">
                <div class="message-content">${message.content}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Muestra el indicador de que alguien está escribiendo
 */
function showTyping(typing) {
    const typingIndicator = document.getElementById('typingIndicator');
    const typingText = document.getElementById('typingText');

    // No muestra indicador para uno mismo o si no es evento de typing
    if (typing.sender === currentUser || typing.type !== 'TYPING') {
        typingIndicator.style.display = 'none';
        return;
    }

    if (typing.typing) {
        typingText.textContent = `${typing.sender} está escribiendo...`;
        typingIndicator.style.display = 'block';

        // Oculta automáticamente después de 3 segundos
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            typingIndicator.style.display = 'none';
        }, 3000);
    } else {
        // Oculta inmediatamente cuando se recibe "typing: false"
        clearTimeout(window.typingTimeout);
        typingIndicator.style.display = 'none';
    }
}

/**
 * Maneja eventos de usuario (unión/desconexión)
 */
function handleUserEvent(event) {
    console.log("Evento de usuario recibido:", event);

    if (event.type === 'JOIN' && event.sender !== currentUser) {
        // Muestra mensaje de unión
        const joinMessage = {
            sender: event.sender,
            content: `${event.sender} se unió al chat`,
            type: 'join'
        };
        showMessage(joinMessage);
    } else if (event.type === 'LEAVE') {
        // Muestra mensaje de desconexión
        const leaveMessage = {
            sender: event.sender,
            content: `${event.sender} se desconectó`,
            type: 'leave'
        };
        showMessage(leaveMessage);
    }
}

/**
 * Envía un mensaje al servidor
 */
function sendMessage() {
    const sender = document.getElementById('senderInput').value || 'Anónimo';
    const content = document.getElementById('messageInput').value.trim();

    if (content && stompClient && stompClient.connected) {
        const chatMessage = {
            sender: sender,
            content: content,
            type: 'chat'
        };

        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        document.getElementById('messageInput').value = '';

        // Notifica que dejó de escribir
        sendTypingEvent(false);
        isTyping = false;
        clearTimeout(typingTimer);
    }
}

/**
 * Envía evento de typing al servidor
 */
function sendTypingEvent(isTypingValue) {
    if (stompClient && stompClient.connected) {
        const typingEvent = {
            sender: document.getElementById('senderInput').value || 'Anónimo',
            typing: isTypingValue,
            type: 'TYPING'
        };
        stompClient.send("/app/typing", {}, JSON.stringify(typingEvent));
    }
}

// ========== EVENT LISTENERS ==========

// Event listener para el botón de enviar
document.getElementById('sendMessage').addEventListener('click', sendMessage);

// Event listener para enviar con Enter
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Event listener para detectar escritura
document.getElementById('messageInput').addEventListener('input', function() {
    clearTimeout(typingTimer);

    if (!isTyping) {
        sendTypingEvent(true);
        isTyping = true;
    }

    typingTimer = setTimeout(function() {
        sendTypingEvent(false);
        isTyping = false;
    }, 1000);
});

// Event listener para cambio de nombre
document.getElementById('senderInput').addEventListener('change', function() {
    if (stompClient && stompClient.connected) {
        const oldUser = currentUser;
        currentUser = this.value || 'Anónimo';

        if (oldUser !== currentUser) {
            // Notifica cambio de nombre
            const systemMessage = {
                sender: 'Sistema',
                content: `${oldUser} ahora es ${currentUser}`,
                type: 'change'
            };
            stompClient.send("/app/sendMessage", {}, JSON.stringify(systemMessage));
        }
    }
});

// Detecta cierre de ventana/pestaña para enviar evento de desconexión
window.addEventListener('beforeunload', function() {
    if (stompClient && stompClient.connected && currentUser) {
        const userEvent = {
            sender: currentUser,
            type: 'LEAVE'
        };
        stompClient.send("/app/userEvent", {}, JSON.stringify(userEvent));
    }
});

// ========== INICIALIZACIÓN ==========

// Inicializa la aplicación cuando la página cargue
window.onload = function() {
    // Recupera nombre de usuario guardado
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        document.getElementById('senderInput').value = savedUsername;
    }

    connect();
};