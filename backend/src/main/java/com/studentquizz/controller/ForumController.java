package com.studentquizz.controller;

import com.studentquizz.dto.ForumDto;
import com.studentquizz.service.ForumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.Map;
import java.util.Arrays;

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

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tệp tin không được để trống."));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên tệp không hợp lệ."));
        }

        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex == -1) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên tệp không có định dạng mở rộng."));
        }
        String ext = originalFilename.substring(dotIndex).toLowerCase();
        List<String> allowedExtensions = Arrays.asList(".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".docx");
        if (!allowedExtensions.contains(ext)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Chỉ chấp nhận các tệp ảnh (png, jpg, jpeg, gif, webp), file PDF hoặc Word (docx)."));
        }

        try {
            String uploadDir = "uploads";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String newFilename = UUID.randomUUID().toString() + ext;
            Path filePath = Paths.get(uploadDir).resolve(newFilename);
            Files.copy(file.getInputStream(), filePath);

            String fileUrl = "/api/forum/uploads/" + newFilename;
            return ResponseEntity.ok(Map.of(
                    "url", fileUrl,
                    "name", originalFilename,
                    "type", file.getContentType() != null ? file.getContentType() : "application/octet-stream"
            ));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải tệp lên: " + e.getMessage()));
        }
    }

    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path file = Paths.get("uploads").resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
