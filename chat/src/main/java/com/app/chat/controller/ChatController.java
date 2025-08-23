package com.app.chat.controller;

import com.app.chat.model.ChatMessage;
import com.app.chat.model.TypingEvent;
import com.app.chat.model.UserEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDateTime;

@Controller
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @MessageMapping("/sendMessage")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(ChatMessage message) {
        logger.info("Mensaje recibido de {}: {}", message.getSender(), message.getContent());
        logger.debug("Detalles del mensaje: {}", message);
        return message;
    }

    @GetMapping("chat")
    public String chat() {
        logger.info("Solicitada página de chat");
        return "chat";
    }

    @MessageMapping("/typing")
    @SendTo("/topic/typing")
    public TypingEvent handleTyping(TypingEvent typingEvent) {
        if (typingEvent.isTyping()) {
            logger.info("Usuario {} está escribiendo...", typingEvent.getSender());
        } else {
            logger.debug("Usuario {} dejó de escribir", typingEvent.getSender());
        }
        typingEvent.setTimestamp(LocalDateTime.now());
        typingEvent.setType("TYPING");
        return typingEvent;
    }

    @MessageMapping("/userEvent")
    @SendTo("/topic/userEvents")
    public UserEvent handleUserEvent(UserEvent userEvent, SimpMessageHeaderAccessor headerAccessor) {
        userEvent.setTimestamp(LocalDateTime.now());

        switch (userEvent.getType()) {
            case "JOIN":
                logger.info("Usuario {} se unió al chat", userEvent.getSender());
                break;
            case "LEAVE":
                logger.info("Usuario {} abandonó el chat", userEvent.getSender());
                break;
            case "CHANGE_NAME":
                logger.info("Usuario {} cambió su nombre a {}",
                        userEvent.getOldSender(), userEvent.getSender());
                break;
            default:
                logger.warn("Evento de usuario desconocido: {}", userEvent.getType());
        }

        return userEvent;
    }

    @MessageMapping("/userJoin")
    @SendTo("/topic/userEvents")
    public UserEvent handleUserJoin(ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        UserEvent userEvent = new UserEvent();
        userEvent.setSender(message.getSender());
        userEvent.setType("JOIN");
        userEvent.setTimestamp(LocalDateTime.now());

        headerAccessor.getSessionAttributes().put("username", message.getSender());

        logger.info("Nuevo usuario unido: {}", message.getSender());
        logger.debug("Atributos de sesión: {}", headerAccessor.getSessionAttributes());

        return userEvent;
    }
}