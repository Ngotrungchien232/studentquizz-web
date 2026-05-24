package com.studentquizz.controller;

import com.studentquizz.dto.ForumDto;
import com.studentquizz.service.ForumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/posts")
    public ResponseEntity<List<ForumDto.PostResponse>> getPosts() {
        return ResponseEntity.ok(forumService.getAllPosts());
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ForumDto.PostResponse> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getPostById(id));
    }

    @PostMapping("/posts")
    public ResponseEntity<ForumDto.PostResponse> createPost(@RequestBody ForumDto.CreatePostRequest req) {
        return ResponseEntity.ok(forumService.createPost(req));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<ForumDto.LikeResponse> toggleLike(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.toggleLike(id));
    }

    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<List<ForumDto.CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getComments(id));
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<ForumDto.CommentResponse> addComment(
            @PathVariable Long id,
            @RequestBody ForumDto.CreateCommentRequest req) {
        return ResponseEntity.ok(forumService.addComment(id, req));
    }

    @PutMapping("/posts/{id}/appeal")
    public ResponseEntity<ForumDto.PostResponse> appeal(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String message = body.getOrDefault("appealMessage", "Tôi muốn khiếu nại.");
        return ResponseEntity.ok(forumService.appeal(id, message));
    }
}
