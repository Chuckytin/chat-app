package com.app.chat.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuración de WebSocket para habilitar comunicación bidireccional en tiempo real
 * entre el cliente y el servidor usando el protocolo STOMP sobre WebSocket.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    /**
     * Registra los endpoints STOMP para la conexión WebSocket.
     * Los clientes se conectarán a este endpoint para establecer la conexión persistente.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        logger.info("Registrando endpoint STOMP: /chat");
        registry.addEndpoint("/chat")
                .setAllowedOrigins("http://localhost:8080")
                .withSockJS();
    }

    /**
     * Configura el broker de mensajes para el routing de mensajes STOMP.
     * Define los prefijos para diferentes tipos de destinos de mensajes.
     *
     * - Cliente → Servidor: Mensajes enviados a destinos con prefijo "/app"
     * - Servidor → Cliente: Mensajes enviados a destinos con prefijo "/topic"
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        logger.info("Configurando broker de mensajes - Topic: /topic, App: /app");
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}