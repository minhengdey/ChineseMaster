# Build stage
FROM eclipse-temurin:17-jdk-alpine AS backend-build
WORKDIR /app

# Copy Maven files
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

# Install ffmpeg
RUN apk add --no-cache \
    ffmpeg \
    tzdata \
    curl \
    bash

ENV TZ=Asia/Ho_Chi_Minh

WORKDIR /app

# Copy JAR
COPY --from=backend-build /app/target/*.jar app.jar

# Create user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-XX:+UseContainerSupport", \
            "-XX:MaxRAMPercentage=75.0", \
            "-Dserver.port=8080", \
            "-jar", \
            "app.jar"]