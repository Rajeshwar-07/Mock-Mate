# ---- Build Stage ----
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Download dependencies first (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build the JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Runtime Stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# -Xmx256m keeps memory within Render free tier (512MB RAM)
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar"]
