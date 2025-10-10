# Build stage
FROM ruby:3.2-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache build-base

# Copy Gemfile
COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle install --jobs 4 --retry 3

# Runtime stage
FROM ruby:3.2-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache tzdata

# Copy gems from builder
COPY --from=builder /usr/local/bundle /usr/local/bundle

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["ruby", "app.rb"]

