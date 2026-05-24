package com.studentquizz;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * Cấu hình DataSource cho môi trường production (Render).
 * Render/Neon cung cấp DATABASE_URL dạng: postgres://user:pass@host/db
 * hoặc postgresql://user:pass@host/db?sslmode=require&channel_binding=require
 * Spring Boot cần: jdbc:postgresql://host/db?params
 * Config này tự động chuyển đổi format.
 */
@Configuration
@Profile("prod")
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DATABASE_URL:}")
    private String rawDatabaseUrl;

    @Value("${DB_USERNAME:}")
    private String dbUsername;

    @Value("${DB_PASSWORD:}")
    private String dbPassword;

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        String jdbcUrl;
        String username = dbUsername;
        String password = dbPassword;

        if (rawDatabaseUrl == null || rawDatabaseUrl.isBlank()) {
            throw new IllegalStateException(
                "DATABASE_URL chưa được cấu hình. Vui lòng thêm biến môi trường DATABASE_URL trên Render dashboard.");
        }

        if (rawDatabaseUrl.startsWith("postgres://") || rawDatabaseUrl.startsWith("postgresql://")) {
            // Bỏ scheme: postgres(ql)://
            String withoutScheme = rawDatabaseUrl.replaceFirst("^postgres(ql)?://", "");

            // Tách user:pass@host/db
            String[] atSplit = withoutScheme.split("@", 2);
            if (atSplit.length == 2) {
                String userInfo = atSplit[0]; // user:pass
                String hostAndDb = atSplit[1]; // host:port/db?params

                // Lấy username và password từ URL nếu chưa có từ env var riêng
                String[] credParts = userInfo.split(":", 2);
                if (username.isBlank() && credParts.length >= 1) username = credParts[0];
                if (password.isBlank() && credParts.length >= 2) password = credParts[1];

                // Giữ nguyên query params (sslmode, channel_binding...) - KHÔNG append thêm
                // Nếu chưa có ?sslmode thì mới thêm vào
                if (hostAndDb.contains("?")) {
                    // Đã có query params rồi → giữ nguyên
                    jdbcUrl = "jdbc:postgresql://" + hostAndDb;
                } else {
                    // Chưa có → thêm sslmode=require
                    jdbcUrl = "jdbc:postgresql://" + hostAndDb + "?sslmode=require";
                }
            } else {
                jdbcUrl = "jdbc:postgresql://" + withoutScheme;
            }

            // Log (ẩn password)
            String safeUrl = jdbcUrl.replaceAll("password=[^&]*", "password=***");
            log.info("✅ DataSource URL: {}", safeUrl);

        } else if (rawDatabaseUrl.startsWith("jdbc:postgresql://")) {
            // Đã đúng format JDBC rồi
            jdbcUrl = rawDatabaseUrl;
            log.info("✅ DataSource URL đã ở dạng JDBC");
        } else {
            throw new IllegalStateException("DATABASE_URL không hợp lệ, phải bắt đầu bằng postgres:// hoặc jdbc:postgresql://");
        }

        config.setJdbcUrl(jdbcUrl);
        if (!username.isBlank()) config.setUsername(username);
        if (!password.isBlank()) config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(3);       // Free tier: giới hạn connections
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setConnectionTestQuery("SELECT 1");
        config.setPoolName("StudentQuizz-Pool");

        log.info("✅ HikariCP pool configured: maxPool=3, minIdle=1");
        return new HikariDataSource(config);
    }
}
