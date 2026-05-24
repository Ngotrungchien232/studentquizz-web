package com.studentquizz.dto;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class CreateQuizRequest {
    private String title;
    private String category;
    private String description;
    private Integer questionCount;
}
