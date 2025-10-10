require 'sinatra'
require 'sinatra/cross_origin'
require 'json'
require 'securerandom'
require 'date'
require_relative 'models/todo'
require_relative 'services/todo_service'
require_relative 'helpers/routes'

set :port, 8000
set :bind, '0.0.0.0'

# CORS configuration
configure do
  enable :cross_origin
end

before do
  response.headers['Access-Control-Allow-Origin'] = '*'
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
  content_type :json
end

options '*' do
  200
end

# Initialize service
$todo_service = TodoService.new

# Configure routes
Routes.configure_routes(self)

# Start message
puts "🌶️  Spicy Todo API (Ruby/Sinatra) running on http://localhost:8000"
