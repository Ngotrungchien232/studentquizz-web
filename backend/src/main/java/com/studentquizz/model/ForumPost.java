package com.studentquizz.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "forum_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Builder.Default
    private Long likeCount = 0L;

    @Builder.Default
    private Long commentCount = 0L;

    @ElementCollection
    @CollectionTable(name = "forum_post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag")
    private List<String> tags;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING | APPROVED | REJECTED

    @Column(columnDefinition = "TEXT")
    private String rejectReason;

    @Column(columnDefinition = "TEXT")
    private String appealMessage;
}

