package com.studentquizz;

import com.studentquizz.model.User;
import com.studentquizz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Chỉ tạo tài khoản Admin mặc định nếu chưa tồn tại.
 * Không tạo dữ liệu mẫu (quiz, forum, user thường).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        ensureAdminExists();
    }

    private void ensureAdminExists() {
        String adminEmail = "ngotrungchien232@gmail.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            userRepository.save(User.builder()
                    .name("Ngô Trung Chiến")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("14102005"))
                    .role("ADMIN")
                    .build());
            log.info("✅ Tài khoản Admin đã được tạo: {}", adminEmail);
        }
    }
}
