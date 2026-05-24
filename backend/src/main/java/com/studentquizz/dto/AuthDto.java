package com.studentquizz.dto;

import lombok.*;
import jakarta.validation.constraints.*;

public class AuthDto {

    @Data
    public static class LoginRequest {
        @Email @NotBlank
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank
        private String name;
        @Email @NotBlank
        private String email;
        @NotBlank @Size(min = 8)
        private String password;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class AuthResponse {
        private String token;
        private UserDto user;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class UserDto {
        private Long id;
        private String name;
        private String email;
        private String avatar;
        private String role;
    }
}
