package com.app.chat.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserEvent {
    private String sender;
    private String oldSender;
    private String type;
    private LocalDateTime timestamp;
}