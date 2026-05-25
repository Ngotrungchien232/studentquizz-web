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
        private String attachmentUrl;
        private String attachmentName;
        private String attachmentType;
        private String linkUrl;
    }


    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class CommentResponse {
        private Long id;
        private String content;
        private AuthorDto author;
        private Long likeCount;
        private LocalDateTime createdAt;
        private Long parentId;
        private String replyToAuthorName;
        private List<CommentResponse> replies;
    }

    @Data
    public static class CreatePostRequest {
        private String title;
        private String content;
        private List<String> tags;
        private String attachmentUrl;
        private String attachmentName;
        private String attachmentType;
        private String linkUrl;
    }

    @Data
    public static class CreateCommentRequest {
        private String content;
        private Long parentId;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class LikeResponse {
        private Long likeCount;
        private boolean liked;
    }
}
