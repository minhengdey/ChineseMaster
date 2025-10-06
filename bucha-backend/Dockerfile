# build stage
FROM eclipse-temurin:17-jdk-alpine AS backend-build
WORKDIR /app
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .
RUN ./mvnw dependency:go-offline
RUN chmod +x ./mvnw
COPY src ./src
RUN ./mvnw clean package -DskipTests

# run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
