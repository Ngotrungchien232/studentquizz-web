package com.studentquizz.service;

import com.studentquizz.dto.AuthorDto;
import com.studentquizz.dto.CreateQuizRequest;
import com.studentquizz.dto.QuestionDto;
import com.studentquizz.dto.QuizDto;
import com.studentquizz.model.Question;
import com.studentquizz.model.Quiz;
import com.studentquizz.model.User;
import com.studentquizz.repository.QuizRepository;
import com.studentquizz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final DocumentParserService documentParserService;
    private final AiQuizGeneratorService aiQuizGeneratorService;

    public List<QuizDto> getFeatured() {
        return quizRepository.findByFeaturedTrueAndStatusOrderByPlayCountDesc("APPROVED")
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public Page<QuizDto> getAll(int page, int size) {
        return quizRepository.findByStatusOrderByCreatedAtDesc("APPROVED", PageRequest.of(page, size))
                .map(this::toDto);
    }

    public QuizDto getById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found: " + id));
        if (!"APPROVED".equals(quiz.getStatus()) && !canViewUnapproved(quiz)) {
            throw new RuntimeException("Quiz chưa được duyệt hoặc không khả dụng.");
        }
        return toDto(quiz);
    }

    @Transactional
    public QuizDto incrementPlayCount(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found: " + id));
        if (!"APPROVED".equals(quiz.getStatus())) {
            throw new RuntimeException("Chỉ có thể chơi quiz đã được duyệt.");
        }
        quiz.setPlayCount(quiz.getPlayCount() + 1);
        return toDto(quizRepository.save(quiz));
    }

    @Transactional
    public QuizDto create(CreateQuizRequest req, MultipartFile file) {
        User author = getCurrentUser();
        int count = req.getQuestionCount() != null ? req.getQuestionCount() : 10;
        String initialStatus = "ADMIN".equals(author.getRole()) ? "APPROVED" : "PENDING";

        // Parse tài liệu nếu có file
        String documentText = "";
        try {
            if (file != null && !file.isEmpty()) {
                documentText = documentParserService.extractText(file);
                if (documentText.length() > 12000) {
                    documentText = documentText.substring(0, 12000);
                }
                log.info("📄 Đã đọc file: {} ký tự", documentText.length());
            }
        } catch (Exception e) {
            log.error("Lỗi khi đọc file: ", e);
            throw new RuntimeException("Không thể đọc file: " + e.getMessage());
        }

        // Gọi AI tạo câu hỏi
        List<QuestionDto> aiQuestions = aiQuizGeneratorService.generateQuestions(documentText, count, req.getTitle());

        if (aiQuestions == null || aiQuestions.isEmpty()) {
            throw new RuntimeException("Không thể tạo câu hỏi từ AI. Vui lòng kiểm tra lại nội dung file hoặc thử lại sau.");
        }

        // Lưu Quiz
        Quiz quiz = Quiz.builder()
                .title(req.getTitle())
                .category(req.getCategory())
                .description(req.getDescription())
                .questionCount(aiQuestions.size())
                .author(author)
                .featured(false)
                .status(initialStatus)
                .build();

        quiz = quizRepository.save(quiz);

        Quiz finalQuiz = quiz;
        List<Question> questions = aiQuestions.stream().map(dto -> Question.builder()
                .quiz(finalQuiz)
                .content(dto.getContent())
                .options(dto.getOptions())
                .correctAnswer(dto.getCorrectAnswer())
                .explanation(dto.getExplanation())
                .build()).collect(Collectors.toList());

        quiz.setQuestions(questions);
        quiz = quizRepository.save(quiz);

        log.info("✅ Quiz '{}' đã được tạo với {} câu hỏi, status: {}", quiz.getTitle(), questions.size(), initialStatus);
        return toDto(quiz);
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

    private boolean canViewUnapproved(Quiz quiz) {
        return getCurrentUserOptional()
                .map(user -> quiz.getAuthor() != null && (
                        quiz.getAuthor().getId().equals(user.getId()) || "ADMIN".equals(user.getRole())))
                .orElse(false);
    }

    private QuizDto toDto(Quiz quiz) {
        AuthorDto authorDto = null;
        if (quiz.getAuthor() != null) {
            authorDto = AuthorDto.builder()
                    .id(quiz.getAuthor().getId())
                    .name(quiz.getAuthor().getName())
                    .avatar(quiz.getAuthor().getAvatar())
                    .build();
        }
        List<QuestionDto> qDtos = null;
        if (quiz.getQuestions() != null && !quiz.getQuestions().isEmpty()) {
            qDtos = quiz.getQuestions().stream().map(q -> QuestionDto.builder()
                    .id(q.getId())
                    .content(q.getContent())
                    .options(q.getOptions())
                    .correctAnswer(q.getCorrectAnswer())
                    .explanation(q.getExplanation())
                    .build()).collect(Collectors.toList());
        }
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
                .author(authorDto)
                .questions(qDtos)
                .build();
    }

    @Transactional
    public QuizDto appeal(Long id, String message) {
        User author = getCurrentUser();
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found: " + id));

        if (!quiz.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("Bạn không có quyền thực hiện hành động này.");
        }
        if (!"REJECTED".equals(quiz.getStatus())) {
            throw new RuntimeException("Chỉ có thể khiếu nại những bài bị từ chối.");
        }
        if (message == null || message.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập nội dung khiếu nại.");
        }

        quiz.setAppealMessage(message.trim());
        quiz.setStatus("PENDING");
        quiz.setRejectReason(null);
        return toDto(quizRepository.save(quiz));
    }

}
