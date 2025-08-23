package com.app.chat.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TypingEvent {
    private String sender;
    private boolean typing;
    private String type;
    private LocalDateTime timestamp;
}