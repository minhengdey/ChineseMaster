package com.bucha.config;

import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.models.OpenAPI;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI buchaOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Bucha Backend API").version("0.0.1")
                        .description("REST API for a Chinese learning app (Bucha-like)"));
    }
}
