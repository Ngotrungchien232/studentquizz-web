package com.studentquizz.controller;

import com.studentquizz.model.ForumPost;
import com.studentquizz.model.Quiz;
import com.studentquizz.model.User;
import com.studentquizz.repository.ForumPostRepository;
import com.studentquizz.repository.QuizRepository;
import com.studentquizz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final ForumPostRepository forumPostRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Dashboard Stats ──────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers  = userRepository.count();
        long totalQuizzes = quizRepository.count();
        long totalPosts  = forumPostRepository.count();
        long totalPlays  = quizRepository.sumPlayCount();

        return ResponseEntity.ok(Map.of(
                "totalUsers",   totalUsers,
                "totalQuizzes", totalQuizzes,
                "totalPosts",   totalPosts,
                "totalPlays",   totalPlays
        ));
    }

    // ─── User Management ──────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<User> result = userRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content",       result.getContent(),
                "totalPages",    result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "currentPage",   page
        ));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<Map<String, String>> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String newRole = body.getOrDefault("role", "USER");
        if (!newRole.equals("USER") && !newRole.equals("ADMIN")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }
        user.setRole(newRole);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Role updated to " + newRole));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // ─── Quiz Management ─────────────────────────────────────────────────────

    @GetMapping("/quizzes")
    public ResponseEntity<Map<String, Object>> getQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Quiz> result = quizRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));
        
        java.util.List<com.studentquizz.dto.QuizDto> dtos = result.getContent().stream()
                .map(quiz -> com.studentquizz.dto.QuizDto.builder()
                        .id(quiz.getId())
                        .title(quiz.getTitle())
                        .category(quiz.getCategory())
                        .description(quiz.getDescription())
                        .questionCount(quiz.getQuestionCount())
                        .playCount(quiz.getPlayCount())
                        .featured(quiz.getFeatured())
                        .status(quiz.getStatus())
                        .rejectReason(quiz.getRejectReason())
                        .appealMessage(quiz.getAppealMessage())
                        .author(quiz.getAuthor() != null ? com.studentquizz.dto.AuthorDto.builder().id(quiz.getAuthor().getId()).name(quiz.getAuthor().getName()).build() : null)
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "content",       dtos,
                "totalPages",    result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "currentPage",   page
        ));
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Map<String, String>> deleteQuiz(@PathVariable Long id) {
        if (!quizRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        quizRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Quiz deleted"));
    }

    // ─── Forum Management ────────────────────────────────────────────────────

    @GetMapping("/forum/posts")
    public ResponseEntity<Map<String, Object>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ForumPost> result = forumPostRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));
        
        java.util.List<com.studentquizz.dto.ForumDto.PostResponse> dtos = result.getContent().stream()
                .map(post -> com.studentquizz.dto.ForumDto.PostResponse.builder()
                        .id(post.getId())
                        .title(post.getTitle())
                        .content(post.getContent())
                        .likeCount(post.getLikeCount())
                        .commentCount(post.getCommentCount())
                        .tags(post.getTags())
                        .createdAt(post.getCreatedAt())
                        .status(post.getStatus())
                        .rejectReason(post.getRejectReason())
                        .appealMessage(post.getAppealMessage())
                        .author(post.getAuthor() != null ? com.studentquizz.dto.AuthorDto.builder().id(post.getAuthor().getId()).name(post.getAuthor().getName()).build() : null)
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "content",       dtos,
                "totalPages",    result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "currentPage",   page
        ));
    }

    @DeleteMapping("/forum/posts/{id}")
    public ResponseEntity<Map<String, String>> deletePost(@PathVariable Long id) {
        if (!forumPostRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        forumPostRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted"));
    }

    @PutMapping("/quizzes/{id}/status")
    public ResponseEntity<Map<String, String>> updateQuizStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        String newStatus = body.getOrDefault("status", "PENDING");
        quiz.setStatus(newStatus);
        if ("REJECTED".equals(newStatus)) {
            quiz.setRejectReason(body.get("rejectReason"));
        } else if ("APPROVED".equals(newStatus)) {
            quiz.setRejectReason(null);
            quiz.setAppealMessage(null);
        }
        quizRepository.save(quiz);
        return ResponseEntity.ok(Map.of("message", "Quiz status updated to " + newStatus));
    }

    @PutMapping("/forum/posts/{id}/status")
    public ResponseEntity<Map<String, String>> updatePostStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        String newStatus = body.getOrDefault("status", "PENDING");
        post.setStatus(newStatus);
        if ("REJECTED".equals(newStatus)) {
            post.setRejectReason(body.get("rejectReason"));
        } else if ("APPROVED".equals(newStatus)) {
            post.setRejectReason(null);
            post.setAppealMessage(null);
        }
        forumPostRepository.save(post);
        return ResponseEntity.ok(Map.of("message", "Post status updated to " + newStatus));
    }
}

