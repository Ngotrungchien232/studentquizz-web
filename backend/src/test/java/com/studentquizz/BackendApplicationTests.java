package com.studentquizz;

import com.studentquizz.dto.CreateQuizRequest;
import com.studentquizz.dto.QuestionDto;
import com.studentquizz.dto.QuizDto;
import com.studentquizz.model.User;
import com.studentquizz.repository.UserRepository;
import com.studentquizz.service.QuizService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private QuizService quizService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.studentquizz.repository.QuizRepository quizRepository;

    @Test
    void testCreateManualQuizAndGet() {
        // 1. Create and save a user
        User user = User.builder()
                .name("Test User")
                .email("testuser@gmail.com")
                .password("password")
                .role("USER")
                .locked(false)
                .build();
        userRepository.findByEmail(user.getEmail()).ifPresent(existingUser -> {
            quizRepository.findByAuthorIdOrderByCreatedAtDesc(existingUser.getId()).forEach(q -> {
                quizRepository.delete(q);
            });
            userRepository.delete(existingUser);
        });
        user = userRepository.save(user);

        // 2. Mock Security Context
        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
        org.springframework.security.core.userdetails.User springUser =
                new org.springframework.security.core.userdetails.User(user.getEmail(), "", authorities);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(springUser, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);

        // 3. Create manual quiz request
        QuestionDto q1 = QuestionDto.builder()
                .content("Question 1")
                .options(List.of("A", "B", "C", "D"))
                .correctAnswer(0)
                .explanation("Exp 1")
                .build();

        CreateQuizRequest req = CreateQuizRequest.builder()
                .title("Manual Quiz Test")
                .category("Khác")
                .description("Manual Quiz Desc")
                .questionCount(1)
                .questions(List.of(q1))
                .build();

        // 4. Create quiz
        QuizDto created = quizService.create(req, null);
        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals("PENDING", created.getStatus());

        // 5. Get quiz by ID
        QuizDto fetched = quizService.getById(created.getId());
        assertNotNull(fetched);
        assertEquals("Manual Quiz Test", fetched.getTitle());
        assertNotNull(fetched.getQuestions());
        assertEquals(1, fetched.getQuestions().size());
        assertEquals("Question 1", fetched.getQuestions().get(0).getContent());
        assertEquals(4, fetched.getQuestions().get(0).getOptions().size());
        assertEquals("A", fetched.getQuestions().get(0).getOptions().get(0));
    }
}

