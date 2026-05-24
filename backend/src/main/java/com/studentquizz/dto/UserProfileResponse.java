package com.studentquizz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String avatar;
    private int totalQuizzes;
    private int totalPosts;
    private List<QuizDto> quizzes;
    private List<ForumDto.PostResponse> posts;
}
