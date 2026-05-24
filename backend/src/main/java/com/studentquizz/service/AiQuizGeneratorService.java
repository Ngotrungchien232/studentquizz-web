package com.studentquizz.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentquizz.dto.QuestionDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AiQuizGeneratorService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    // Danh sách model sẽ thử theo thứ tự (fallback chain)
    private static final List<String> MODEL_FALLBACK_CHAIN = List.of(
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest"
    );

    private static final String BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public List<QuestionDto> generateQuestions(String text, int questionCount, String title) {
        if (apiKey == null || apiKey.isBlank() || "YOUR_API_KEY".equals(apiKey)) {
            log.warn("⚠️ Gemini API Key chưa được cấu hình.");
            return Collections.emptyList();
        }

        String prompt = buildPrompt(text, questionCount, title);

        // Thử từng model theo thứ tự
        for (String model : MODEL_FALLBACK_CHAIN) {
            try {
                log.info("🤖 Thử gọi model: {} để tạo {} câu hỏi...", model, questionCount);
                List<QuestionDto> questions = callGeminiModel(model, prompt);
                if (questions != null && !questions.isEmpty()) {
                    log.info("✅ Model {} tạo thành công {} câu hỏi!", model, questions.size());
                    return questions;
                }
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode().value() == 429) {
                    log.warn("⚠️ Model {} bị giới hạn quota (429). Thử model tiếp theo...", model);
                } else if (e.getStatusCode().value() == 404) {
                    log.warn("⚠️ Model {} không tồn tại. Thử model tiếp theo...", model);
                } else {
                    log.error("❌ Lỗi HTTP {} khi gọi model {}: {}", e.getStatusCode().value(), model, e.getMessage());
                }
            } catch (Exception e) {
                log.error("❌ Lỗi khi gọi model {}: {}", model, e.getMessage());
            }
        }

        log.error("❌ Tất cả model đều thất bại. Quota có thể đã hết. Kiểm tra: https://ai.dev/rate-limit");
        return Collections.emptyList();
    }

    private List<QuestionDto> callGeminiModel(String model, String prompt) throws Exception {
        String url = String.format(BASE_URL, model) + apiKey;

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("role", "user",
                       "parts", List.of(Map.of("text", prompt)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.7,
                "responseMimeType", "application/json"
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            log.error("Gemini API trả về: {}", response.getStatusCode());
            return Collections.emptyList();
        }

        String rawText = extractTextFromResponse(response.getBody());
        return parseQuestions(rawText);
    }

    private String buildPrompt(String text, int count, String title) {
        String context = (text != null && !text.isBlank())
                ? "Dựa trên nội dung tài liệu sau:\n\n" + text.substring(0, Math.min(text.length(), 10000))
                : "Dựa trên chủ đề: " + title;

        return String.format("""
            %s

            Hãy tạo ĐÚNG %d câu hỏi trắc nghiệm bằng tiếng Việt.

            Trả về mảng JSON (không dùng markdown):
            [
              {
                "content": "Câu hỏi?",
                "options": ["A. Đáp án A", "B. Đáp án B", "C. Đáp án C", "D. Đáp án D"],
                "correctAnswer": 0,
                "explanation": "Giải thích"
              }
            ]

            Lưu ý: correctAnswer là số 0-3 (0=A, 1=B, 2=C, 3=D).
            """, context, count);
    }

    private String extractTextFromResponse(String responseBody) throws Exception {
        JsonNode root = mapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) {
            throw new RuntimeException("Gemini API không trả về candidates");
        }
        return candidates.get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();
    }

    private List<QuestionDto> parseQuestions(String raw) throws Exception {
        String cleaned = raw.trim()
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
        try {
            return mapper.readValue(cleaned, new TypeReference<List<QuestionDto>>() {});
        } catch (Exception e) {
            // Tìm JSON array trong text
            Pattern p = Pattern.compile("\\[\\s*\\{.*?\\}\\s*\\]", Pattern.DOTALL);
            Matcher m = p.matcher(raw);
            if (m.find()) {
                return mapper.readValue(m.group(), new TypeReference<List<QuestionDto>>() {});
            }
            throw new RuntimeException("Không parse được JSON: " + e.getMessage());
        }
    }
}
