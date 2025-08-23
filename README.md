# Chat en Tiempo Real

Aplicación web de chat con comunicación instantánea entre usuarios.

## Características

- Mensajería en tiempo real
- Indicador de "escribiendo..."
- Notificaciones de conexión/desconexión

## Tecnologías

- Spring Boot 3.5.5 (Backend)
- WebSockets STOMP (Comunicación)
- Bootstrap 5 + JavaScript (Frontend)
- Java 21

## Probar la aplicación

Abre tu navegador en: http://localhost:8080/chat

## Como usar

Abre 2 más chats para probarlo.
1. Ingresa distintos nombres
2. Escribe mensajes
3. Presiona Enter o el botón enviar
4. Los mensajes aparecen en tiempo real

## Ejecutar la aplicación

```bash
mvn clean package
java -jar target/chat-1.0.0.jar
