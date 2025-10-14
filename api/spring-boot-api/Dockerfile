# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the JAR from builder
COPY --from=builder /app/target/spicy-todo-api-1.0.0.jar app.jar

# Expose port
EXPOSE 8000

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

