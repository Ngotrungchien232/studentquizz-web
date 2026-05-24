package com.studentquizz.service;

import com.studentquizz.dto.AuthorDto;
import com.studentquizz.dto.ForumDto;
import com.studentquizz.model.ForumComment;
import com.studentquizz.model.ForumPost;
import com.studentquizz.model.ForumPostLike;
import com.studentquizz.model.User;
import com.studentquizz.repository.ForumCommentRepository;
import com.studentquizz.repository.ForumPostLikeRepository;
import com.studentquizz.repository.ForumPostRepository;
import com.studentquizz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumPostRepository postRepository;
    private final ForumCommentRepository commentRepository;
    private final ForumPostLikeRepository likeRepository;
    private final UserRepository userRepository;

    public List<ForumDto.PostResponse> getAllPosts() {
        return postRepository.findByStatusOrderByCreatedAtDesc("APPROVED")
                .stream().map(this::toPostDto).collect(Collectors.toList());
    }

    public ForumDto.PostResponse getPostById(Long id) {
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!"APPROVED".equals(post.getStatus()) && !canViewUnapproved(post)) {
            throw new RuntimeException("Bài viết chưa được duyệt hoặc không khả dụng.");
        }
        return toPostDto(post);
    }

    @Transactional
    public ForumDto.PostResponse createPost(ForumDto.CreatePostRequest req) {
        User author = getCurrentUser();
        String initialStatus = "ADMIN".equals(author.getRole()) ? "APPROVED" : "PENDING";

        List<String> tags = req.getTags() != null ? req.getTags() : new java.util.ArrayList<>();

        ForumPost post = ForumPost.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .tags(tags)
                .author(author)
                .status(initialStatus)
                .build();
        return toPostDto(postRepository.save(post));
    }

    @Transactional
    public ForumDto.LikeResponse toggleLike(Long postId) {
        User user = getCurrentUser();
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!"APPROVED".equals(post.getStatus())) {
            throw new RuntimeException("Chỉ có thể thích bài viết đã được duyệt.");
        }

        Optional<ForumPostLike> existing = likeRepository.findByPostIdAndUserId(postId, user.getId());
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            postRepository.save(post);
            return ForumDto.LikeResponse.builder()
                    .likeCount(post.getLikeCount())
                    .liked(false)
                    .build();
        }

        likeRepository.save(ForumPostLike.builder().post(post).user(user).build());
        post.setLikeCount(post.getLikeCount() + 1);
        postRepository.save(post);
        return ForumDto.LikeResponse.builder()
                .likeCount(post.getLikeCount())
                .liked(true)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ForumDto.CommentResponse> getComments(Long postId) {
        List<ForumComment> flat = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        Map<Long, ForumDto.CommentResponse> dtoMap = new LinkedHashMap<>();
        List<ForumDto.CommentResponse> roots = new ArrayList<>();

        for (ForumComment comment : flat) {
            ForumDto.CommentResponse dto = toCommentDto(comment);
            dto.setReplies(new ArrayList<>());
            dtoMap.put(comment.getId(), dto);
        }

        for (ForumComment comment : flat) {
            ForumDto.CommentResponse dto = dtoMap.get(comment.getId());
            if (comment.getParent() == null) {
                roots.add(dto);
            } else {
                ForumDto.CommentResponse parentDto = dtoMap.get(comment.getParent().getId());
                if (parentDto != null) {
                    parentDto.getReplies().add(dto);
                } else {
                    roots.add(dto);
                }
            }
        }
        return roots;
    }

    @Transactional
    public ForumDto.CommentResponse addComment(Long postId, ForumDto.CreateCommentRequest req) {
        User author = getCurrentUser();
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!"APPROVED".equals(post.getStatus())) {
            throw new RuntimeException("Chỉ có thể bình luận bài viết đã được duyệt.");
        }
        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new RuntimeException("Nội dung bình luận không được để trống.");
        }

        ForumComment parent = null;
        if (req.getParentId() != null) {
            parent = commentRepository.findById(req.getParentId())
                    .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại."));
            if (!parent.getPost().getId().equals(postId)) {
                throw new RuntimeException("Bình luận không thuộc bài viết này.");
            }
        }

        ForumComment comment = ForumComment.builder()
                .content(req.getContent().trim())
                .author(author)
                .post(post)
                .parent(parent)
                .build();
        comment = commentRepository.save(comment);
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);
        return toCommentDto(comment);
    }

    private User getCurrentUser() {
        return getCurrentUserOptional()
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Optional<User> getCurrentUserOptional() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        return userRepository.findByEmail(auth.getName());
    }

    private boolean canViewUnapproved(ForumPost post) {
        return getCurrentUserOptional()
                .map(user -> post.getAuthor() != null && (
                        post.getAuthor().getId().equals(user.getId()) || "ADMIN".equals(user.getRole())))
                .orElse(false);
    }

    private ForumDto.PostResponse toPostDto(ForumPost post) {
        boolean liked = getCurrentUserOptional()
                .map(user -> likeRepository.existsByPostIdAndUserId(post.getId(), user.getId()))
                .orElse(false);

        return ForumDto.PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .author(toAuthorDto(post.getAuthor()))
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .tags(post.getTags())
                .createdAt(post.getCreatedAt())
                .liked(liked)
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
        if (message == null || message.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập nội dung khiếu nại.");
        }

        post.setAppealMessage(message.trim());
        post.setStatus("PENDING");
        post.setRejectReason(null);
        return toPostDto(postRepository.save(post));
    }

    private ForumDto.CommentResponse toCommentDto(ForumComment c) {
        String replyTo = null;
        Long parentId = null;
        if (c.getParent() != null) {
            parentId = c.getParent().getId();
            if (c.getParent().getAuthor() != null) {
                replyTo = c.getParent().getAuthor().getName();
            }
        }
        return ForumDto.CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .author(toAuthorDto(c.getAuthor()))
                .likeCount(c.getLikeCount())
                .createdAt(c.getCreatedAt())
                .parentId(parentId)
                .replyToAuthorName(replyTo)
                .replies(new ArrayList<>())
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
