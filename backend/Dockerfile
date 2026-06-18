# Multi-stage build for Render (or any Docker host).
# Stage 1: build the jar with Maven + JDK 21.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# Stage 2: slim runtime with JRE only.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Render injects PORT; default 5000 for local docker run.
EXPOSE 5000
ENTRYPOINT ["java", "-jar", "app.jar"]
