package com.studentquizz.service;

import com.studentquizz.model.ForumPost;
import com.studentquizz.model.Question;
import com.studentquizz.model.Quiz;
import com.studentquizz.model.User;
import com.studentquizz.repository.ForumPostRepository;
import com.studentquizz.repository.QuizRepository;
import com.studentquizz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SampleDataService {

    public static final String DEMO_EMAIL = "demo@studentquizz.vn";
    public static final String DEMO_PASSWORD = "Demo@123456";

    private static final String SAMPLE_QUIZ_HISTORY = "Quiz mẫu: Lịch sử Việt Nam cơ bản";
    private static final String SAMPLE_QUIZ_MATH = "Quiz mẫu: Toán - Phương trình bậc hai";
    private static final String SAMPLE_FORUM_TITLE = "Chào mừng đến diễn đàn StudentQuizz!";

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final ForumPostRepository forumPostRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> seedSamplesIfMissing() {
        User admin = ensureAdmin();
        User demo = ensureDemoUser();
        User author = demo != null ? demo : admin;

        int quizzesCreated = 0;
        if (!quizRepository.existsByTitle(SAMPLE_QUIZ_HISTORY)) {
            saveHistoryQuiz(author);
            quizzesCreated++;
        }
        if (!quizRepository.existsByTitle(SAMPLE_QUIZ_MATH)) {
            saveMathQuiz(author);
            quizzesCreated++;
        }

        boolean forumCreated = false;
        if (forumPostRepository.findAll().stream().noneMatch(p -> SAMPLE_FORUM_TITLE.equals(p.getTitle()))) {
            forumPostRepository.save(ForumPost.builder()
                    .title(SAMPLE_FORUM_TITLE)
                    .content("Đây là bài viết mẫu trên diễn đàn.\n\n"
                            + "Bạn có thể đăng bài, bình luận và trả lời lẫn nhau sau khi đăng nhập.\n"
                            + "Hãy thử tạo quiz từ PDF hoặc tham gia thảo luận nhé!")
                    .tags(List.of("Hỏi đáp", "Kinh nghiệm"))
                    .author(author)
                    .status("APPROVED")
                    .likeCount(12L)
                    .commentCount(0L)
                    .build());
            forumCreated = true;
        }

        return Map.of(
                "demoEmail", DEMO_EMAIL,
                "demoPassword", DEMO_PASSWORD,
                "quizzesCreated", quizzesCreated,
                "forumPostCreated", forumCreated,
                "totalApprovedQuizzes", quizRepository.findByStatusOrderByCreatedAtDesc("APPROVED",
                        org.springframework.data.domain.PageRequest.of(0, 100)).getTotalElements()
        );
    }

    private User ensureAdmin() {
        String adminEmail = "ngotrungchien232@gmail.com";
        return userRepository.findByEmail(adminEmail).orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Ngô Trung Chiến")
                        .email(adminEmail)
                        .password(passwordEncoder.encode("14102005"))
                        .role("ADMIN")
                        .locked(false)
                        .build()));
    }

    private User ensureDemoUser() {
        return userRepository.findByEmail(DEMO_EMAIL).orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Người dùng Demo")
                        .email(DEMO_EMAIL)
                        .password(passwordEncoder.encode(DEMO_PASSWORD))
                        .role("USER")
                        .locked(false)
                        .build()));
    }

    private void saveHistoryQuiz(User author) {
        Quiz history = Quiz.builder()
                .title(SAMPLE_QUIZ_HISTORY)
                .category("Lịch sử")
                .description("Bài quiz mẫu giúp bạn làm quen với StudentQuizz — 5 câu hỏi trắc nghiệm về lịch sử Việt Nam.")
                .questionCount(5)
                .playCount(128L)
                .featured(true)
                .status("APPROVED")
                .author(author)
                .build();
        history.setQuestions(List.of(
                question(history, "Năm nào vua Quang Trung đại phá quân Thanh tại Ngọc Hồi - Đống Đa?",
                        List.of("1789", "1771", "1802", "1858"), 0,
                        "Chiến thắng Ngọc Hồi - Đống Đa diễn ra ngày mùng 5 Tết Kỷ Dậu (1789)."),
                question(history, "Ai là vị vua đầu tiên của triều Nguyễn?",
                        List.of("Gia Long", "Minh Mạng", "Tự Đức", "Duy Tân"), 0,
                        "Gia Long (Nguyễn Ánh) lập triều Nguyễn năm 1802."),
                question(history, "Thủ đô Đại Việt thời Lý - Trần đặt tại đâu?",
                        List.of("Thăng Long (Hà Nội)", "Huế", "Thành phố Hồ Chí Minh", "Ninh Bình"), 0,
                        "Thăng Long là trung tâm chính trị suốt hàng trăm năm."),
                question(history, "Cuộc kháng chiến chống Mỹ kết thúc năm nào?",
                        List.of("1975", "1968", "1954", "1945"), 0,
                        "Miền Nam hoàn toàn giải phóng ngày 30/4/1975."),
                question(history, "Văn Miếu - Quốc Tử Giám được xây dưới triều nào?",
                        List.of("Lý", "Trần", "Lê", "Nguyễn"), 0,
                        "Văn Miếu khởi công năm 1070, thời vua Lý Thánh Tông.")
        ));
        quizRepository.save(history);
    }

    private void saveMathQuiz(User author) {
        Quiz math = Quiz.builder()
                .title(SAMPLE_QUIZ_MATH)
                .category("Toán học")
                .description("Luyện tập phương trình bậc hai — bài quiz mẫu 3 câu.")
                .questionCount(3)
                .playCount(56L)
                .featured(true)
                .status("APPROVED")
                .author(author)
                .build();
        math.setQuestions(List.of(
                question(math, "Nghiệm của phương trình x² - 5x + 6 = 0 là?",
                        List.of("x = 2 hoặc x = 3", "x = 1 hoặc x = 6", "x = -2 hoặc x = -3", "Không có nghiệm"), 0,
                        "x² - 5x + 6 = (x-2)(x-3) = 0."),
                question(math, "Discriminant Δ của ax² + bx + c bằng?",
                        List.of("b² - 4ac", "b² + 4ac", "4ac - b²", "2b - 4ac"), 0,
                        "Δ = b² - 4ac quyết định số nghiệm."),
                question(math, "Phương trình x² + 4 = 0 có mấy nghiệm thực?",
                        List.of("0", "1", "2", "Vô số"), 0,
                        "x² = -4 không có nghiệm trong tập số thực.")
        ));
        quizRepository.save(math);
    }

    private static Question question(Quiz quiz, String content, List<String> options,
                                     int correctIndex, String explanation) {
        return Question.builder()
                .quiz(quiz)
                .content(content)
                .options(options)
                .correctAnswer(correctIndex)
                .explanation(explanation)
                .build();
    }
}
