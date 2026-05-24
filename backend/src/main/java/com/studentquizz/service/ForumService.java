package com.studentquizz.service;

import com.studentquizz.dto.AuthorDto;
import com.studentquizz.dto.ForumDto;
import com.studentquizz.model.ForumComment;
import com.studentquizz.model.ForumPost;
import com.studentquizz.model.User;
import com.studentquizz.repository.ForumCommentRepository;
import com.studentquizz.repository.ForumPostRepository;
import com.studentquizz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumPostRepository postRepository;
    private final ForumCommentRepository commentRepository;
    private final UserRepository userRepository;

    public List<ForumDto.PostResponse> getAllPosts() {
        return postRepository.findByStatusOrderByCreatedAtDesc("APPROVED")
                .stream().map(this::toPostDto).collect(Collectors.toList());
    }

    public ForumDto.PostResponse getPostById(Long id) {
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return toPostDto(post);
    }

    @Transactional
    public ForumDto.PostResponse createPost(ForumDto.CreatePostRequest req) {
        User author = getCurrentUser();
        String initialStatus = "ADMIN".equals(author.getRole()) ? "APPROVED" : "PENDING";
        
        ForumPost post = ForumPost.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .tags(req.getTags())
                .author(author)
                .status(initialStatus)
                .build();
        return toPostDto(postRepository.save(post));
    }

    @Transactional
    public ForumDto.LikeResponse toggleLike(Long postId) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        // Simple toggle: increment/decrement
        post.setLikeCount(post.getLikeCount() + 1);
        postRepository.save(post);
        return ForumDto.LikeResponse.builder()
                .likeCount(post.getLikeCount())
                .liked(true)
                .build();
    }

    public List<ForumDto.CommentResponse> getComments(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream().map(this::toCommentDto).collect(Collectors.toList());
    }

    @Transactional
    public ForumDto.CommentResponse addComment(Long postId, ForumDto.CreateCommentRequest req) {
        User author = getCurrentUser();
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        ForumComment comment = ForumComment.builder()
                .content(req.getContent())
                .author(author)
                .post(post)
                .build();
        comment = commentRepository.save(comment);
        // Update comment count
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);
        return toCommentDto(comment);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ForumDto.PostResponse toPostDto(ForumPost post) {
        return ForumDto.PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .author(toAuthorDto(post.getAuthor()))
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .tags(post.getTags())
                .createdAt(post.getCreatedAt())
                .status(post.getStatus())
                .rejectReason(post.getRejectReason())
                .appealMessage(post.getAppealMessage())
                .build();
    }

    @Transactional
    public ForumDto.PostResponse appeal(Long id, String message) {
        User author = getCurrentUser();
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện hành động này.");
        }
        if (!"REJECTED".equals(post.getStatus())) {
            throw new RuntimeException("Chỉ có thể khiếu nại những bài bị từ chối.");
        }

        post.setAppealMessage(message);
        post.setStatus("PENDING");
        post.setRejectReason(null);
        return toPostDto(postRepository.save(post));
    }


    private ForumDto.CommentResponse toCommentDto(ForumComment c) {
        return ForumDto.CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .author(toAuthorDto(c.getAuthor()))
                .likeCount(c.getLikeCount())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private AuthorDto toAuthorDto(User user) {
        if (user == null) return null;
        return AuthorDto.builder()
                .id(user.getId())
                .name(user.getName())
                .avatar(user.getAvatar())
                .build();
    }
}
