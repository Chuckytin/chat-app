package com.app.chat.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessage {
    private Long id;
    private String sender;
    private String content;
    private String type;
    private LocalDateTime timestamp;
}