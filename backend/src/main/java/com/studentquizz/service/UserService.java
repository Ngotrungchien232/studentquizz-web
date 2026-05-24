package com.studentquizz.service;

import com.studentquizz.dto.AuthorDto;
import com.studentquizz.dto.QuizDto;
import com.studentquizz.dto.UserProfileResponse;
import com.studentquizz.model.Quiz;
import com.studentquizz.model.User;
import com.studentquizz.repository.ForumPostRepository;
import com.studentquizz.repository.QuizRepository;
import com.studentquizz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final ForumPostRepository forumPostRepository;

    public UserProfileResponse getMyProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Quiz> quizzes = quizRepository.findByAuthorIdOrderByCreatedAtDesc(user.getId());
        List<com.studentquizz.model.ForumPost> posts = forumPostRepository.findByAuthorIdOrderByCreatedAtDesc(user.getId());

        List<QuizDto> quizDtos = quizzes.stream().map(this::toQuizDto).collect(Collectors.toList());
        List<com.studentquizz.dto.ForumDto.PostResponse> postDtos = posts.stream().map(this::toPostDto).collect(Collectors.toList());

        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .totalQuizzes(quizDtos.size())
                .totalPosts(postDtos.size())
                .quizzes(quizDtos)
                .posts(postDtos)
                .build();
    }

    private QuizDto toQuizDto(Quiz quiz) {
        return QuizDto.builder()
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
                // Không map questions ở danh sách để tối ưu
                .author(AuthorDto.builder().id(quiz.getAuthor().getId()).name(quiz.getAuthor().getName()).build())
                .build();
    }

    private com.studentquizz.dto.ForumDto.PostResponse toPostDto(com.studentquizz.model.ForumPost post) {
        return com.studentquizz.dto.ForumDto.PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .author(AuthorDto.builder().id(post.getAuthor().getId()).name(post.getAuthor().getName()).build())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .tags(post.getTags())
                .createdAt(post.getCreatedAt())
                .status(post.getStatus())
                .rejectReason(post.getRejectReason())
                .appealMessage(post.getAppealMessage())
                .build();
    }

}
