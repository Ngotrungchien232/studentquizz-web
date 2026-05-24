package com.studentquizz.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class ForumDto {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class PostResponse {
        private Long id;
        private String title;
        private String content;
        private AuthorDto author;
        private Long likeCount;
        private Long commentCount;
        private List<String> tags;
        private LocalDateTime createdAt;
        private boolean liked;
        private String status;
        private String rejectReason;
        private String appealMessage;
    }


    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class CommentResponse {
        private Long id;
        private String content;
        private AuthorDto author;
        private Long likeCount;
        private LocalDateTime createdAt;
    }

    @Data
    public static class CreatePostRequest {
        private String title;
        private String content;
        private List<String> tags;
    }

    @Data
    public static class CreateCommentRequest {
        private String content;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class LikeResponse {
        private Long likeCount;
        private boolean liked;
    }
}
